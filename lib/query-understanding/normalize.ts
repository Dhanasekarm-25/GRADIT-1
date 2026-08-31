export interface NormalizedQueryOutput {
  originalQuery: string;
  normalizedQuery: string;
}

export class QueryNormalizer {
  private static readonly KNOWN_SUFFIXES = [
    'details',
    'detail',
    'information',
    'info',
    'profile',
    'attendance',
    'fees',
    'fee',
    'report',
  ];

  private static readonly TYPO_DICTIONARY: Record<string, string> = {
    // Attendance typos
    atendance: 'attendance',
    atendence: 'attendance',
    attendence: 'attendance',
    attandance: 'attendance',
    atndance: 'attendance',
    attndnc: 'attendance',
    atendnce: 'attendance',

    // Fees typos
    feee: 'fees',
    feess: 'fees',
    feez: 'fees',
    fee: 'fees',
    paymnt: 'fees',
    payemnt: 'fees',
    dues: 'fees',
    deatails: 'details',
    deatailsof: 'details of ',

    // Pending typos
    panding: 'pending',
    peding: 'pending',
    pendng: 'pending',
    unpaid: 'pending',
    due: 'pending',

    // Student typos
    studnt: 'student',
    stdnts: 'students',
    studnts: 'students',
    stundets: 'students',

    // Department typos
    computer: 'cse',
    computr: 'cse',
    csedep: 'cse',
    electronics: 'ece',
    elec: 'ece',
    mech: 'mech',
    mechanical: 'mech',

    // Report typos
    repot: 'report',
    reprt: 'report',
    repote: 'report',
    exel: 'excel',
    excl: 'excel',
    wrd: 'word',
    pdff: 'pdf',
  };

  /**
   * Un-glues concatenated words such as ARUNDETAILS -> arun details, HARINIDETAILS -> harini details, ARUNINFO -> arun info
   */
  public static splitKnownIntentSuffix(text: string): string {
    let result = text;
    for (const suffix of this.KNOWN_SUFFIXES) {
      const regex = new RegExp(`([a-z0-9]{3,})(${suffix})\\b`, 'gi');
      result = result.replace(regex, '$1 $2');
    }
    return result;
  }

  /**
   * Main query normalization pipeline.
   */
  public static normalizeQuery(userPrompt: string): NormalizedQueryOutput {
    const originalQuery = userPrompt.trim();
    if (!originalQuery) {
      return { originalQuery: '', normalizedQuery: '' };
    }

    let text = originalQuery.toLowerCase();

    // 1. Separate concatenated suffix tokens e.g. ARUNDETAILS -> arun details
    text = this.splitKnownIntentSuffix(text);

    // 2. Separate concatenated pattern tokens e.g. FEE23CS101 -> fee 23cs101, CSEATTENDANCE -> cse attendance
    text = text.replace(/([a-z]+)(\d{2}[a-z]{2,4}\d{3})/gi, '$1 $2');
    text = text.replace(/(\d{2}[a-z]{2,4}\d{3})([a-z]+)/gi, '$1 $2');
    text = text.replace(/(cse|ece|mech|eee|it|civil)(attendance|fee|fees|students?|details?)/gi, '$1 $2');
    text = text.replace(/(students?|attendance|fee|fees|details?)(cse|ece|mech|eee|it|civil)/gi, '$1 $2');

    // 3. Normalize possessives e.g. arun's details -> arun details
    text = text.replace(/'s\b|s'\b/gi, '');

    // 4. Replace non-alphanumeric separators with single space
    text = text.replace(/[-_:\/\\]/g, ' ');
    text = text.replace(/[!?.,;]/g, ' ');

    // 5. Normalize repeated whitespace
    text = text.replace(/\s+/g, ' ').trim();

    const STOP_WORDS = new Set([
      'much',
      'does',
      'have',
      'from',
      'with',
      'what',
      'when',
      'some',
      'more',
      'many',
      'been',
      'this',
      'that',
      'were',
      'them',
      'they',
      'will',
      'show',
      'give',
      'each',
      'make',
    ]);

    // 6. Tokenize & Typo Correction
    const tokens = text.split(' ');
    const correctedTokens = tokens.map((token) => {
      if (this.TYPO_DICTIONARY[token]) {
        return this.TYPO_DICTIONARY[token];
      }
      if (!STOP_WORDS.has(token) && token.length >= 5) {
        for (const [typo, target] of Object.entries(this.TYPO_DICTIONARY)) {
          if (typo.length >= 5 && this.levenshteinDistance(token, typo) <= 1) {
            return target;
          }
        }
      }
      return token;
    });

    const normalizedQuery = correctedTokens.join(' ');
    return { originalQuery, normalizedQuery };
  }

  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
