export interface NormalizedQueryOutput {
  originalQuery: string;
  normalizedQuery: string;
}

export class QueryNormalizer {
  private static readonly KNOWN_PREFIX_COMPOUNDS: [RegExp, string][] = [
    // 1. Whole word compounds & typos
    [/\b(pendingfeesof|pendingfeeof|pendingfeesod|pendingfeeod)\b/gi, 'pending fee of'],
    [/\b(pendingfees|pendingfee)\b/gi, 'pending fee'],
    [/\b(feesof|feeof|feesod|feeod|feesog|feeog|feesot|feeot)\b/gi, 'fee of'],
    [/\b(paymentof|paidof|paymentod|paidod)\b/gi, 'payment of'],
    [/\b(attendanceof|attendof|attendanceod|attendod|attendanceog|attendanceot)\b/gi, 'attendance of'],
    [/\b(detailsof|detailof|detailsod|detailod|detailsog|detailsot)\b/gi, 'details of'],
    [/\b(infoof|profileof|informationof|infood|profileod)\b/gi, 'details of'],
    [/\b(reportof|reportod|reportog)\b/gi, 'report of'],
    [/\b(typesof|typeof|typesod|typeod)\b/gi, 'types of'],
    [/\b(listof|listsof|listod|listsod)\b/gi, 'list of'],
    [/\b(recordsof|recordof|recordsod|recordod)\b/gi, 'records of'],

    // 2. Attached to entity name (require >= 2 trailing chars)
    [/\b(pendingfeesof|pendingfeeof|pendingfeesod|pendingfeeod)([a-z0-9]{2,})/gi, 'pending fee of $2'],
    [/\b(pendingfees|pendingfee)([a-z0-9]{2,})/gi, 'pending fee $2'],
    [/\b(feesof|feeof|feesod|feeod|feesog|feeog)([a-z0-9]{2,})/gi, 'fee of $2'],
    [/\b(paymentof|paidof|paymentod|paidod)([a-z0-9]{2,})/gi, 'payment of $2'],
    [/\b(attendanceof|attendof|attendanceod|attendod|attendanceog)([a-z0-9]{2,})/gi, 'attendance of $2'],
    [/\b(detailsof|detailof|detailsod|detailod)([a-z0-9]{2,})/gi, 'details of $2'],
    [/\b(infoof|profileof|informationof|infood|profileod)([a-z0-9]{2,})/gi, 'details of $2'],
    [/\b(reportof|reportod)([a-z0-9]{2,})/gi, 'report of $2'],
    [/\b(typesof|typeof|typesod|typeod)([a-z0-9]{2,})/gi, 'types of $2'],
    [/\b(listof|listsof|listod|listsod)([a-z0-9]{2,})/gi, 'list of $2'],
  ];

  private static readonly KNOWN_ATTACHED_PREFIXES: string[] = [
    'attendance',
    'pendingfees',
    'pendingfee',
    'payment',
    'details',
    'detail',
    'profile',
    'fees',
    'fee',
  ];

  private static readonly KNOWN_ATTACHED_SUFFIXES: string[] = [
    'attendance',
    'attandance',
    'attendence',
    'atendance',
    'atendence',
    'information',
    'students',
    'student',
    'payment',
    'details',
    'detail',
    'detials',
    'detial',
    'profile',
    'fees',
    'fee',
    'paid',
    'info',
    'report',
    'pdf',
    'xlsx',
    'excel',
    'docx',
    'word',
  ];

  private static readonly TYPO_DICTIONARY: Record<string, string> = {
    // Prepositions & Connectors typos (adjacent keyboard keys)
    od: 'of',
    og: 'of',
    ot: 'of',
    ov: 'of',
    fo: 'of',
    fro: 'for',
    fpr: 'for',
    fot: 'for',
    fir: 'for',
    fr: 'for',
    teh: 'the',
    thw: 'the',
    tge: 'the',
    frm: 'from',
    fron: 'from',
    fom: 'from',
    wth: 'with',
    wit: 'with',
    giv: 'give',
    gve: 'give',
    gimme: 'give me',
    shw: 'show',
    sho: 'show',
    shwo: 'show',
    abot: 'about',
    abotu: 'about',
    abut: 'about',
    typesof: 'types of',
    typeof: 'type of',
    kindof: 'kind of',
    listof: 'list of',
    listsof: 'list of',

    // Attendance typos
    atendance: 'attendance',
    atendence: 'attendance',
    attendence: 'attendance',
    attandance: 'attendance',
    atndance: 'attendance',
    attndnc: 'attendance',
    atendnce: 'attendance',
    attendace: 'attendance',
    attendanc: 'attendance',

    // Fees typos
    ffe: 'fees',
    fess: 'fees',
    feee: 'fees',
    feess: 'fees',
    feez: 'fees',
    fee: 'fees',
    fees: 'fees',
    fes: 'fees',
    fe: 'fees',
    fae: 'fees',
    fiee: 'fees',
    fde: 'fees',
    fge: 'fees',
    fwe: 'fees',
    fesss: 'fees',
    paymnt: 'fees',
    payemnt: 'fees',
    pymnt: 'fees',
    paymt: 'fees',
    paymnts: 'fees',
    paied: 'fees',
    payed: 'fees',
    pyment: 'fees',
    pymt: 'fees',
    dues: 'fees',
    due: 'pending',
    du: 'pending',
    dyes: 'fees',
    dud: 'pending',
    deatails: 'details',
    detials: 'details',
    detial: 'detail',
    deatailsof: 'details of',
    detailsof: 'details of',
    detailsofsharma: 'details of sharma',
    detals: 'details',
    detalis: 'details',
    detais: 'details',
    detaisl: 'details',
    detal: 'details',
    deatils: 'details',
    detils: 'details',
    dtls: 'details',
    dtail: 'details',
    dtails: 'details',
    detailes: 'details',
    profle: 'profile',
    profl: 'profile',
    infromation: 'information',
    informtion: 'information',

    // Pending typos
    panding: 'pending',
    peding: 'pending',
    pendng: 'pending',
    pendin: 'pending',
    pendig: 'pending',
    unpaid: 'pending',
    outstandng: 'pending',

    // Student typos
    studnt: 'student',
    stdnts: 'students',
    studnts: 'students',
    stdnt: 'student',
    stundets: 'students',
    stundent: 'student',
    stundents: 'students',
    stuent: 'student',
    stuents: 'students',
    studet: 'student',
    studets: 'students',

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
    rport: 'report',
    reprot: 'report',
    repoert: 'report',
    repor: 'report',
    exel: 'excel',
    excl: 'excel',
    wrd: 'word',
    pdff: 'pdf',
  };

  /**
   * Safely splits known concatenated ERP domain terms and connectors without corrupting general tokens.
   */
  public static splitKnownTerms(input: string): string {
    let text = input;

    // 1. Separate student codes (e.g. ATTENDANCE23CS101 -> ATTENDANCE 23CS101, 23CS101FEES -> 23CS101 FEES)
    text = text.replace(/([a-zA-Z]+)(\d{2}[a-zA-Z]{2,4}\d{3})/g, '$1 $2');
    text = text.replace(/(\d{2}[a-zA-Z]{2,4}\d{3})([a-zA-Z]+)/g, '$1 $2');

    // 2. Separate compound prefix terms (e.g. pendingfeeofsharma -> pending fee of sharma, feeofsharma -> fee of sharma)
    for (const [pattern, replacement] of this.KNOWN_PREFIX_COMPOUNDS) {
      text = text.replace(pattern, replacement);
    }

    // 3. Separate known suffixes attached to entity names (e.g. sharmafees -> sharma fees, arunattendance -> arun attendance)
    // 3. Separate known suffixes attached to entity names (e.g. sharmafees -> sharma fees)
    for (const suffix of this.KNOWN_ATTACHED_SUFFIXES) {
      const regex = new RegExp(`\\b([a-zA-Z]{3,})(${suffix})\\b`, 'gi');
      text = text.replace(regex, (match, prefix, sfx) => {
        if (prefix.toLowerCase() === 'in' || prefix.toLowerCase() === 're') return match;
        return `${prefix} ${sfx}`;
      });
    }

    // 4. Separate known prefixes attached to entity names (e.g. feesharma -> fee sharma, attendancesharma -> attendance sharma)
    for (const prefix of this.KNOWN_ATTACHED_PREFIXES) {
      const regex = new RegExp(`\\b(${prefix})([a-zA-Z]{3,})\\b`, 'gi');
      text = text.replace(regex, (match, pfx, suffix) => {
        if (['report', 'detail', 'details', 'attendance', 'payment', 'students', 'student'].includes(match.toLowerCase())) return match;
        if (pfx.toLowerCase() === 'fees' && suffix.toLowerCase().startsWith('h')) {
          return `fee s${suffix}`;
        }
        return `${pfx} ${suffix}`;
      });
    }

    // 5. Department words concatenated (e.g. csestudents -> cse students, csefees -> cse fees)
    text = text.replace(/\b(cse|ece|mech|eee|it|civil)(attendance|fees?|payment|students?|details?|pending)\b/gi, '$1 $2');
    text = text.replace(/\b(students?|attendance|fees?|details?|pending)(cse|ece|mech|eee|it|civil)\b/gi, '$1 $2');

    return text;
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

    // 1. Normalize apostrophes and possessives (e.g. sharma's fees -> sharma fees)
    text = text.replace(/['’]s\b/gi, '');
    text = text.replace(/s['’]\b/gi, 's');

    // 2. Safe concatenated phrase splitting
    text = this.splitKnownTerms(text);

    // 3. Replace non-alphanumeric separators with single space (preserve hyphens in alphanumeric codes)
    text = text.replace(/[:\/\\_]/g, ' ');
    text = text.replace(/(?<![a-z0-9])-(?![a-z0-9])/gi, ' ');
    text = text.replace(/[!?.,;]/g, ' ');

    // 4. Normalize repeated whitespace
    text = text.replace(/\s+/g, ' ').trim();

    const STOP_WORDS = new Set([
      'me',
      'we',
      'he',
      'she',
      'it',
      'is',
      'was',
      'be',
      'to',
      'do',
      'did',
      'in',
      'on',
      'at',
      'by',
      'an',
      'as',
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

    // 5. Tokenize & Typo Correction
    const tokens = text.split(' ').filter(Boolean);
    const correctedTokens = tokens.map((token) => {
      // 1. Exact Dictionary Match
      if (this.TYPO_DICTIONARY[token]) {
        return this.TYPO_DICTIONARY[token];
      }
      // 2. Fuzzy Match only for words of length >= 4 that are not stop words
      if (token.length >= 4 && !STOP_WORDS.has(token)) {
        for (const [typo, target] of Object.entries(this.TYPO_DICTIONARY)) {
          if (typo.length >= 4 && Math.abs(token.length - typo.length) <= 1 && this.damerauLevenshteinDistance(token, typo) <= 1) {
            return target;
          }
        }
      }
      return token;
    });

    const normalizedQuery = correctedTokens.join(' ').trim();
    return { originalQuery, normalizedQuery };
  }

  public static damerauLevenshteinDistance(a: string, b: string): number {
    const al = a.length;
    const bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;

    const matrix: number[][] = [];
    for (let i = 0; i <= al; i++) matrix[i] = [i];
    for (let j = 0; j <= bl; j++) matrix[0][j] = j;

    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );

        if (
          i > 1 &&
          j > 1 &&
          a.charAt(i - 1) === b.charAt(j - 2) &&
          a.charAt(i - 2) === b.charAt(j - 1)
        ) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
        }
      }
    }
    return matrix[al][bl];
  }
}

/**
 * Shared student query normalizer.
 * Trims leading/trailing spaces, converts to lowercase, collapses repeated whitespace,
 * and removes unnecessary punctuation without mutating underlying database values.
 */
export function normalizeStudentQuery(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[!?.,;:'"’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
