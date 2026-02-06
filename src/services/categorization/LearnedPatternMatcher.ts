import { supabase } from '@/integrations/supabase/client';

export interface LearnedPattern {
  id: string;
  pattern: string;
  category_name: string;
  category_id: string | null;
  match_count: number;
  last_matched_at: string | null;
}

export interface PatternMatchResult {
  pattern_id: string;
  category_name: string;
  category_id: string | null;
  confidence: number;
}

/**
 * LearnedPatternMatcher - Manages user-specific learned patterns for categorization
 * Patterns are learned from user corrections and improve accuracy over time
 */
export class LearnedPatternMatcher {
  private userId: string;
  private patternCache: Map<string, LearnedPattern[]> | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Normalize a transaction description into a matchable pattern
   */
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[0-9]+/g, '')      // Remove numbers (reference IDs, amounts)
      .replace(/[^\w\s]/g, ' ')    // Remove special characters
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
  }

  /**
   * Load patterns from database with caching
   */
  private async loadPatterns(): Promise<LearnedPattern[]> {
    const now = Date.now();
    
    // Return cached patterns if still valid
    if (this.patternCache && now < this.cacheExpiry) {
      return this.patternCache.get(this.userId) || [];
    }

    try {
      const { data, error } = await supabase
        .from('learned_patterns')
        .select('*')
        .eq('user_id', this.userId)
        .order('match_count', { ascending: false });

      if (error) {
        console.error('Error loading learned patterns:', error);
        return [];
      }

      const patterns = (data || []) as LearnedPattern[];
      
      // Update cache
      if (!this.patternCache) {
        this.patternCache = new Map();
      }
      this.patternCache.set(this.userId, patterns);
      this.cacheExpiry = now + this.CACHE_TTL;

      return patterns;
    } catch (error) {
      console.error('LearnedPatternMatcher load error:', error);
      return [];
    }
  }

  /**
   * Find a matching pattern for a transaction description
   */
  async findMatch(description: string): Promise<PatternMatchResult | null> {
    const normalized = this.normalizeDescription(description);
    if (!normalized || normalized.length < 3) {
      return null;
    }

    try {
      // Try using the database function first
      const { data, error } = await supabase.rpc('find_learned_pattern', {
        p_user_id: this.userId,
        p_description: description
      });

      if (!error && data && data.length > 0) {
        const match = data[0];
        console.log(`✓ Learned pattern match via DB: "${match.category_name}" (${(match.confidence * 100).toFixed(0)}%)`);
        return {
          pattern_id: match.pattern_id,
          category_name: match.category_name,
          category_id: match.category_id,
          confidence: match.confidence
        };
      }
    } catch (rpcError) {
      // RPC might not exist yet, fall back to client-side matching
      console.log('Falling back to client-side pattern matching');
    }

    // Client-side fallback
    const patterns = await this.loadPatterns();
    
    for (const pattern of patterns) {
      const confidence = this.calculateMatchConfidence(normalized, pattern.pattern);
      if (confidence >= 0.8) {
        console.log(`✓ Learned pattern match: "${pattern.category_name}" (${(confidence * 100).toFixed(0)}%)`);
        return {
          pattern_id: pattern.id,
          category_name: pattern.category_name,
          category_id: pattern.category_id,
          confidence
        };
      }
    }

    return null;
  }

  /**
   * Calculate confidence score for pattern match
   */
  private calculateMatchConfidence(normalized: string, pattern: string): number {
    // Exact match
    if (normalized === pattern) {
      return 0.98;
    }

    // Substring matches
    if (normalized.includes(pattern)) {
      return 0.95;
    }
    if (pattern.includes(normalized)) {
      return 0.92;
    }

    // Word-based matching
    const normalizedWords = normalized.split(/\s+/).filter(w => w.length > 2);
    const patternWords = pattern.split(/\s+/).filter(w => w.length > 2);
    
    if (patternWords.length === 0) return 0;

    const matchedWords = patternWords.filter(pw =>
      normalizedWords.some(nw => nw.includes(pw) || pw.includes(nw))
    );

    const wordMatchRatio = matchedWords.length / patternWords.length;
    
    if (wordMatchRatio >= 0.8) {
      return 0.85 + (wordMatchRatio - 0.8) * 0.5; // 0.85 - 0.95
    }

    return wordMatchRatio * 0.8; // Scale to max 0.8
  }

  /**
   * Save a learned pattern from a user correction
   */
  async savePattern(
    description: string,
    categoryName: string,
    categoryId?: string
  ): Promise<string | null> {
    const pattern = this.normalizeDescription(description);
    
    if (!pattern || pattern.length < 3) {
      console.warn('Pattern too short to save:', description);
      return null;
    }

    try {
      // Try using the database function first
      const { data, error } = await supabase.rpc('save_learned_pattern', {
        p_user_id: this.userId,
        p_description: description,
        p_category_name: categoryName,
        p_category_id: categoryId || null
      });

      if (!error && data) {
        console.log(`✓ Saved learned pattern: "${pattern}" -> ${categoryName}`);
        this.invalidateCache();
        return data as string;
      }
    } catch (rpcError) {
      // RPC might not exist, fall back to direct insert
    }

    // Direct insert fallback
    try {
      const { data, error } = await supabase
        .from('learned_patterns')
        .upsert({
          user_id: this.userId,
          pattern,
          category_name: categoryName,
          category_id: categoryId || null,
          match_count: 1,
          last_matched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,pattern'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving learned pattern:', error);
        return null;
      }

      console.log(`✓ Saved learned pattern: "${pattern}" -> ${categoryName}`);
      this.invalidateCache();
      return data?.id || null;
    } catch (error) {
      console.error('LearnedPatternMatcher save error:', error);
      return null;
    }
  }

  /**
   * Save multiple patterns at once (batch learning)
   */
  async savePatterns(
    corrections: Array<{ description: string; categoryName: string; categoryId?: string }>
  ): Promise<number> {
    let savedCount = 0;

    for (const correction of corrections) {
      const result = await this.savePattern(
        correction.description,
        correction.categoryName,
        correction.categoryId
      );
      if (result) savedCount++;
    }

    return savedCount;
  }

  /**
   * Delete a learned pattern
   */
  async deletePattern(patternId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('learned_patterns')
        .delete()
        .eq('id', patternId)
        .eq('user_id', this.userId);

      if (error) {
        console.error('Error deleting pattern:', error);
        return false;
      }

      this.invalidateCache();
      return true;
    } catch (error) {
      console.error('LearnedPatternMatcher delete error:', error);
      return false;
    }
  }

  /**
   * Get all patterns for the user
   */
  async getPatterns(): Promise<LearnedPattern[]> {
    return this.loadPatterns();
  }

  /**
   * Get pattern statistics
   */
  async getStats(): Promise<{ total: number; totalMatches: number; topCategories: string[] }> {
    const patterns = await this.loadPatterns();
    
    const totalMatches = patterns.reduce((sum, p) => sum + p.match_count, 0);
    
    const categoryCounts: Record<string, number> = {};
    patterns.forEach(p => {
      categoryCounts[p.category_name] = (categoryCounts[p.category_name] || 0) + p.match_count;
    });
    
    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    return {
      total: patterns.length,
      totalMatches,
      topCategories
    };
  }

  /**
   * Invalidate the pattern cache
   */
  invalidateCache(): void {
    this.patternCache = null;
    this.cacheExpiry = 0;
  }
}




