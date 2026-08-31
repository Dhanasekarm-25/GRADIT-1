import { IntentType, ExtractedParameters } from './intents';

/**
 * Intelligent Fuzzy NLP & Regular Expression Engine.
 * Discriminates between Student vs Class vs Department queries accurately.
 */
export class RegexLibrary {
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

  public static preprocessAndNormalize(rawInput: string): string {
    let text = rawInput.trim();

    // 1. Separate concatenated student codes e.g. ATTENDANCE23CS101 -> ATTENDANCE 23CS101
    text = text.replace(/([a-zA-Z]+)(\d{2}[a-zA-Z]{2,4}\d{3})/g, '$1 $2');
    text = text.replace(/(\d{2}[a-zA-Z]{2,4}\d{3})([a-zA-Z]+)/g, '$1 $2');

    // 2. Separate concatenated department words e.g. CSESTUDENTS -> CSE STUDENTS, CSEFEES -> CSE FEES
    text = text.replace(/(CSE|ECE|MECH|EEE|IT|CIVIL)(ATTENDANCE|FEE|FEES|STUDENTS?|DETAILS?)/gi, '$1 $2');
    text = text.replace(/(STUDENTS?|ATTENDANCE|FEE|FEES|DETAILS?)(CSE|ECE|MECH|EEE|IT|CIVIL)/gi, '$1 $2');
    text = text.replace(/(LOW|PENDING|UNPAID)(ATTENDANCE|FEE|FEES|DUES)/gi, '$1 $2');

    // 3. Replace separators with space
    text = text.replace(/[-_:\/\\]/g, ' ');

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

    const tokens = text.split(/\s+/);
    const correctedTokens = tokens.map((token) => {
      const lower = token.toLowerCase();
      if (this.TYPO_DICTIONARY[lower]) {
        return this.TYPO_DICTIONARY[lower];
      }
      if (!STOP_WORDS.has(lower) && lower.length >= 5) {
        for (const [typo, target] of Object.entries(this.TYPO_DICTIONARY)) {
          if (typo.length >= 5 && this.levenshteinDistance(lower, typo) <= 1) {
            return target;
          }
        }
      }
      return token;
    });

    return correctedTokens.join(' ');
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

  public static readonly PATTERNS = {
    STUDENT_CODE: /\b(?:\d{2}[A-Z]{2,4}\d{3}|STD-?\d{3,4}|[A-Z]{2,4}-?\d{3})\b/i,
    DEPARTMENT: /\b(?:CSE|ECE|MECH|EEE|IT|CIVIL|Computer\s+Science|Electronics|Mechanical|Electrical|Civil)\b/i,
    CLASS: /\b(?:23[A-Z]{2}\d{3}|Sec(?:tion)?\s*[A-Z]|Year\s*\d\s*Sec\s*[A-Z])\b/i,
    THRESHOLD: /(?:below|under|<|less\s+than|shortage\s+of)?\s*(\d{1,3})\s*%/i,
    THRESHOLD_NUMERIC: /(?:below|under|<|less\s+than)\s*(\d{1,2})\b/i,
    SEMESTER: /\b(?:S[1-8]|Sem(?:ester)?\s*[1-8]|\d(?:st|nd|rd|th)?\s*sem(?:ester)?)\b/i,
    REPORT_FORMAT: /\b(pdf|xlsx|excel|docx|word)\b/i,
    NAME_ATTENDANCE: /(?:attendance\s+(?:of|for)|show|get|check)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
    NAME_POSSESSIVE: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:'s|s')\s+attendance\b/i,
    NAME_FEE: /(?:fee(?:s)?\s+(?:of|for|status|details)|paid\s+by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
    NAME_SEARCH: /(?:find|search|lookup|details\s+of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/i,
  };

  private static readonly INTENT_RULES: { intent: IntentType; regexes: RegExp[] }[] = [
    {
      intent: 'REPORT_REQUEST',
      regexes: [
        /\b(?:pdf|excel|xlsx|word|docx)\b/i,
        /\b(?:download|export|generate|create)\s+(?:a\s+)?report\b/i,
        /\b(?:give|save)\s+this\s+as\b/i,
      ],
    },
    {
      intent: 'LOW_ATTENDANCE',
      regexes: [
        /\b(?:low|shortage|defaulter|poor)\s+attendance\b/i,
        /\b(?:below|under|<|less\s+than)\s*\d{1,3}%?\b/i,
        /\bwho\s+is\s+below\b/i,
      ],
    },
    {
      intent: 'PENDING_FEES',
      regexes: [
        /\b(?:pending|unpaid|due|outstanding|balance)\s+fees?\b/i,
        /\bwho\s+has\s+(?:pending|unpaid|due)\b/i,
        /\bfee\s+(?:defaulters|dues)\b/i,
      ],
    },
    {
      intent: 'FEES_DEPARTMENT',
      regexes: [
        /\bfee(?:s)?\s+(?:details|status|record|summary)?\s+(?:of|for|in)?\s*(cse|ece|mech|eee|it|civil)\b/i,
        /\b(cse|ece|mech|eee|it|civil)\s+(?:dept|department)?\s+fee(?:s)?\b/i,
        /\bdepartment\s+fee(?:s)?\b/i,
      ],
    },
    {
      intent: 'ATTENDANCE_DEPARTMENT',
      regexes: [
        /\battendance\s+(?:details|status|record|summary)?\s+(?:of|for|in)?\s*(cse|ece|mech|eee|it|civil)\b/i,
        /\b(cse|ece|mech|eee|it|civil)\s+(?:dept|department)?\s+attendance\b/i,
        /\bdepartment\s+attendance\b/i,
      ],
    },
    {
      intent: 'STUDENTS_LIST',
      regexes: [
        /\bstudents?\s+(?:of|in|from|for)\b/i,
        /\b(?:list|show|get|display)\s+students?\b/i,
        /\b(?:cse|ece|mech|eee|it|civil)\s+students?\b/i,
        /\bstudents?\s+(?:cse|ece|mech|eee|it|civil)\b/i,
      ],
    },
    {
      intent: 'ATTENDANCE_STUDENT',
      regexes: [
        /\battendance\s+(?:of|for)\b/i,
        /\bhow\s+much\s+attendance\b/i,
        /\bwhat(?:'s|\s+is)\s+.*\s+attendance\b/i,
        /\b\d{2}[A-Z]{2,4}\d{3}\s+attendance\b/i,
        /\b(?:is|was)\s+.*\s+present\b/i,
      ],
    },
    {
      intent: 'FEES_STUDENT',
      regexes: [
        /\bfee(?:s)?\s+(?:status|details|record)\s+(?:of|for)\s+[a-z0-9]+/i,
        /\bhow\s+much\s+fee\s+paid\b/i,
        /\bfee(?:s)?\s+of\b/i,
      ],
    },
    {
      intent: 'STUDENT_SEARCH',
      regexes: [
        /\b(?:find|search|lookup)\s+(?:student)?\b/i,
        /\bwho\s+is\b/i,
        /\bdetails\s+of\b/i,
      ],
    },
  ];

  public static parse(userPrompt: string): {
    intent: IntentType;
    params: ExtractedParameters;
  } {
    const normalizedInput = this.preprocessAndNormalize(userPrompt);
    const params: ExtractedParameters = {};

    // 1. Extract Student Code
    const codeMatch = normalizedInput.match(this.PATTERNS.STUDENT_CODE);
    if (codeMatch) {
      params.studentCode = codeMatch[0].toUpperCase();
    }

    // 2. Extract Department
    const deptMatch = normalizedInput.match(this.PATTERNS.DEPARTMENT);
    if (deptMatch) {
      params.departmentIdentifier = deptMatch[0].toUpperCase();
      if (params.departmentIdentifier.includes('COMPUTER')) params.departmentIdentifier = 'CSE';
      if (params.departmentIdentifier.includes('ELECTRONIC')) params.departmentIdentifier = 'ECE';
      if (params.departmentIdentifier.includes('MECHANICAL')) params.departmentIdentifier = 'MECH';
    }

    // 3. Extract Threshold Percentage
    const threshMatch = normalizedInput.match(this.PATTERNS.THRESHOLD) || normalizedInput.match(this.PATTERNS.THRESHOLD_NUMERIC);
    if (threshMatch) {
      params.threshold = parseInt(threshMatch[1], 10);
    }

    // 4. Extract Semester
    const semMatch = normalizedInput.match(this.PATTERNS.SEMESTER);
    if (semMatch) {
      const raw = semMatch[0].toUpperCase();
      params.semester = raw.startsWith('S') ? raw : `S${raw.replace(/\D/g, '')}`;
    }

    // 5. Extract Report Format
    const fmtMatch = normalizedInput.match(this.PATTERNS.REPORT_FORMAT);
    if (fmtMatch) {
      const fmt = fmtMatch[0].toLowerCase();
      if (fmt === 'excel') params.reportFormat = 'xlsx';
      else if (fmt === 'word') params.reportFormat = 'docx';
      else if (fmt === 'pdf' || fmt === 'xlsx' || fmt === 'docx') params.reportFormat = fmt;
    }

    // 6. Extract Student Name (ONLY IF NOT A DEPARTMENT CODE OR KEYWORD)
    const nameMatch =
      normalizedInput.match(this.PATTERNS.NAME_ATTENDANCE) ||
      normalizedInput.match(this.PATTERNS.NAME_POSSESSIVE) ||
      normalizedInput.match(this.PATTERNS.NAME_FEE) ||
      normalizedInput.match(this.PATTERNS.NAME_SEARCH);

    if (nameMatch && nameMatch[1]) {
      const candidate = nameMatch[1].trim();
      const candUpper = candidate.toUpperCase();
      if (
        !this.PATTERNS.DEPARTMENT.test(candidate) &&
        !['CSE', 'ECE', 'MECH', 'EEE', 'IT', 'CIVIL'].includes(candUpper) &&
        !/attendance|fees|report|class|details|status/i.test(candidate)
      ) {
        params.studentName = candidate;
      }
    }

    if (!params.studentCode && !params.studentName) {
      params.query = normalizedInput;
    }

    // 7. Intent Rule Evaluation
    for (const rule of this.INTENT_RULES) {
      for (const regex of rule.regexes) {
        if (regex.test(normalizedInput)) {
          return { intent: rule.intent, params };
        }
      }
    }

    const lowerNormalized = normalizedInput.toLowerCase();

    if (params.studentCode) {
      if (/fee|fees|paid|due|payment/i.test(lowerNormalized)) {
        return { intent: 'FEES_STUDENT', params };
      }
      return { intent: 'ATTENDANCE_STUDENT', params };
    }

    if (params.departmentIdentifier) {
      if (/fee|fees/i.test(lowerNormalized)) {
        return { intent: 'FEES_DEPARTMENT', params };
      }
      if (/attendance/i.test(lowerNormalized)) {
        return { intent: 'ATTENDANCE_DEPARTMENT', params };
      }
      return { intent: 'STUDENTS_LIST', params };
    }

    if (/student/i.test(lowerNormalized)) {
      return { intent: 'STUDENTS_LIST', params };
    }

    return { intent: 'UNSUPPORTED', params };
  }
}
