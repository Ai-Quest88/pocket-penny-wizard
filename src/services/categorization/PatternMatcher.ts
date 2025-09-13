export class PatternMatcher {
  static matchesPattern(description: string, pattern: string): boolean {
    console.log(`🔍 PatternMatcher: Testing "${description}" against pattern "${pattern}"`);
    const lowerDescription = description.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    // Strategy 1: Exact substring match
    if (lowerDescription.includes(lowerPattern)) {
      console.log('✅ Matched using exact substring');
      return true;
    }

    // Strategy 2: Word boundary matching
    const words = lowerDescription.split(/\s+/);
    for (const word of words) {
      if (word.includes(lowerPattern) || lowerPattern.includes(word)) {
        return true;
      }
    }

    // Strategy 3: Cleaned text matching
    const cleanDescription = this.cleanText(lowerDescription);
    const cleanPattern = this.cleanText(lowerPattern);

    if (cleanDescription.includes(cleanPattern)) {
      return true;
    }

    // Strategy 4: Word similarity matching
    const patternWords = cleanPattern.split(/\s+/);
    const descWords = cleanDescription.split(/\s+/);
    
    for (const patternWord of patternWords) {
      if (patternWord.length >= 3) {
        for (const descWord of descWords) {
          if (descWord.includes(patternWord) || patternWord.includes(descWord)) {
            return true;
          }
        }
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