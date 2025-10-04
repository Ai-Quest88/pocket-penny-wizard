export class PatternMatcher {
  static matchesPattern(description: string, pattern: string): boolean {
    console.log(`🔍 PatternMatcher: Testing "${description}" against pattern "${pattern}"`);
    const lowerDescription = description.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    // Strategy 1: Whole word matching using regex word boundaries
    // This prevents "interest" from matching "disinterest" or "interesting"
    const escapedPattern = lowerPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundaryRegex = new RegExp(`\\b${escapedPattern}\\b`, 'i');
    
    if (wordBoundaryRegex.test(lowerDescription)) {
      console.log('✅ Matched using whole word boundary');
      return true;
    }

    // Strategy 2: Cleaned text matching with word boundaries
    const cleanDescription = this.cleanText(lowerDescription);
    const cleanPattern = this.cleanText(lowerPattern);

    const cleanWordBoundaryRegex = new RegExp(`\\b${cleanPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (cleanWordBoundaryRegex.test(cleanDescription)) {
      console.log('✅ Matched using cleaned word boundary');
      return true;
    }

    // Strategy 3: Multi-word pattern matching
    // For patterns like "transfer to", "uber eats", etc.
    const patternWords = cleanPattern.split(/\s+/).filter(w => w.length > 0);
    if (patternWords.length > 1) {
      const multiWordRegex = new RegExp(patternWords.join('\\s+'), 'i');
      if (multiWordRegex.test(cleanDescription)) {
        console.log('✅ Matched using multi-word pattern');
        return true;
      }
    }

    return false;
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\b(pty ltd|ltd|inc|corp|group|store|shop)\b/g, '')
      .replace(/\d+/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}