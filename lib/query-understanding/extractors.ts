import { REGEX_PATTERNS, DEPARTMENT_MAP } from './regexPatterns';
import { PaymentStatus, ReportFormat, ThresholdFilter, ERPQueryIntent } from './types';

export interface ExtractedEntities {
  studentId?: string;
  studentName?: string;
  classId?: string;
  department?: string;
  semester?: number;
  academicYear?: string;
  threshold?: number;
  thresholdFilter?: ThresholdFilter;
  paymentStatus?: PaymentStatus;
  reportFormat?: ReportFormat;
  isMultiIntent?: boolean;
  subIntents?: ERPQueryIntent[];
}

export class EntityExtractor {
  public static readonly STOP_WORDS = new Set([
    'show',
    'me',
    'get',
    'give',
    'check',
    'find',
    'search',
    'lookup',
    'tell',
    'display',
    'list',
    'of',
    'od',
    'og',
    'ot',
    'ov',
    'fo',
    'for',
    'fro',
    'fpr',
    'fot',
    'fir',
    'fr',
    'from',
    'frm',
    'fron',
    'fom',
    'in',
    'by',
    'to',
    'at',
    'on',
    'the',
    'teh',
    'thw',
    'tge',
    'a',
    'an',
    'with',
    'wth',
    'wit',
    'about',
    'abot',
    'abotu',
    'abut',
    'regarding',
    'regard',
    'types',
    'type',
    'typesof',
    'typeof',
    'kind',
    'kinds',
    'kindof',
    'student',
    'students',
    'studnt',
    'studnts',
    'details',
    'detail',
    'detials',
    'info',
    'information',
    'attendance',
    'attend',
    'atendance',
    'attendence',
    'atendence',
    'attandance',
    'fees',
    'fee',
    'ffe',
    'fess',
    'feee',
    'feess',
    'feez',
    'fes',
    'fae',
    'fiee',
    'payment',
    'paymnt',
    'payemnt',
    'pymnt',
    'paymt',
    'paid',
    'paied',
    'payed',
    'pending',
    'peding',
    'panding',
    'due',
    'dues',
    'balance',
    'unpaid',
    'outstanding',
    'report',
    'data',
    'records',
    'record',
    'status',
    'is',
    'was',
    'are',
    'were',
    'what',
    'whats',
    'how',
    'much',
    'many',
    'present',
    'absent',
    'absentees',
    'absentee',
    'who',
    'whos',
    'whose',
    'whom',
    'has',
    'have',
    'had',
    'having',
    'where',
    'when',
    'why',
    'weather',
    'can',
    'you',
    'please',
    'all',
    'any',
    'every',
    'each',
    'which',
    'not',
    'summary',
    'overall',
    'defaulter',
    'defaulters',
    'shortage',
    'poor',
    'low',
    'high',
    'average',
    'percentage',
    'percent',
    'below',
    'above',
    'under',
    'over',
    'less',
    'than',
    'more',
    'class',
    'department',
    'dept',
    'section',
    'sec',
    'year',
    'sem',
    'semester',
    'download',
    'export',
    'save',
    'create',
    'generate',
    'pdf',
    'excel',
    'xlsx',
    'word',
    'docx',
  ]);

  /**
   * Generic candidate name extractor.
   * Removes stop words, connectors, and intent keywords to isolate candidate student name token(s).
   * Does NOT hardcode specific student names.
   */
  public static extractStudentNameCandidate(text: string): string | undefined {
    let cleaned = text;

    // Remove Student IDs, Class IDs (which can include dept prefixes like CSE-A), and Departments
    cleaned = cleaned.replace(REGEX_PATTERNS.STUDENT_ID, ' ');
    cleaned = cleaned.replace(REGEX_PATTERNS.CLASS_ID, ' ');
    cleaned = cleaned.replace(REGEX_PATTERNS.DEPARTMENT, ' ');
    cleaned = cleaned.replace(/\b\d+(?:%|percent)?\b/gi, ' ');

    const tokens = cleaned
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter((token) => token.length > 1 && !this.STOP_WORDS.has(token));

    if (tokens.length === 0) {
      return undefined;
    }

    return tokens.join(' ');
  }

  /**
   * Extract threshold metric, comparison operator, numeric value, and unit.
   */
  public static extractThresholdFilter(text: string): ThresholdFilter | undefined {
    // 1. Attendance percentage comparison: e.g. "below 75%", "<75", "under 75", "above 90%", ">90", "less than 75"
    const attLessThan = text.match(/\b(?:attendance\s+)?(?:below|under|less\s+than|<|<=)\s*(\d{1,3})(?:%|percent)?\b/i);
    if (attLessThan) {
      const val = parseInt(attLessThan[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        return {
          metric: 'attendance',
          operator: text.includes('<=') ? '<=' : '<',
          value: val,
          unit: 'percent',
        };
      }
    }

    const attGreaterThan = text.match(/\b(?:attendance\s+)?(?:above|over|greater\s+than|>|>=)\s*(\d{1,3})(?:%|percent)?\b/i);
    if (attGreaterThan) {
      const val = parseInt(attGreaterThan[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        return {
          metric: 'attendance',
          operator: text.includes('>=') ? '>=' : '>',
          value: val,
          unit: 'percent',
        };
      }
    }

    // 2. Fee amount comparison: e.g. "fees above 50000", "pending fee greater than 10000", "fees < 20000"
    const feeGreaterThan = text.match(/\b(?:pending\s+)?fees?\s*(?:above|over|greater\s+than|>|>=)\s*(\d+)\b/i);
    if (feeGreaterThan) {
      const val = parseInt(feeGreaterThan[1], 10);
      if (!isNaN(val)) {
        return {
          metric: /pending/i.test(text) ? 'pending_fee' : 'fee',
          operator: '>',
          value: val,
          unit: 'inr',
        };
      }
    }

    const feeLessThan = text.match(/\b(?:pending\s+)?fees?\s*(?:below|under|less\s+than|<|<=)\s*(\d+)\b/i);
    if (feeLessThan) {
      const val = parseInt(feeLessThan[1], 10);
      if (!isNaN(val)) {
        return {
          metric: /pending/i.test(text) ? 'pending_fee' : 'fee',
          operator: '<',
          value: val,
          unit: 'inr',
        };
      }
    }

    return undefined;
  }

  /**
   * Detect multi-intent compound query (e.g. "show arun attendance and fees")
   * Requires an explicit coordinating conjunction (and, &, as well as, also)
   */
  public static extractMultiIntents(text: string): { isMultiIntent: boolean; subIntents: ERPQueryIntent[] } {
    const hasConjunction = /\b(?:and|&|as\s+well\s+as|also)\b/i.test(text);
    if (!hasConjunction) {
      return { isMultiIntent: false, subIntents: [] };
    }

    const hasAttendance = /\battendance\b/i.test(text);
    const hasFees = /\b(?:fees?|payment|paid|due)\b/i.test(text);
    const hasDetails = /\b(?:details?|info|profile)\b/i.test(text);

    const subIntents: ERPQueryIntent[] = [];
    if (hasAttendance && hasFees) {
      subIntents.push('ATTENDANCE_STUDENT', 'FEES_STUDENT');
    } else if (hasAttendance && hasDetails) {
      subIntents.push('ATTENDANCE_STUDENT', 'STUDENT_DETAILS');
    } else if (hasFees && hasDetails) {
      subIntents.push('FEES_STUDENT', 'STUDENT_DETAILS');
    }

    return {
      isMultiIntent: subIntents.length > 1,
      subIntents,
    };
  }

  public static extractAll(text: string): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // 1. Student ID (Highest Priority)
    const studentMatch = text.match(REGEX_PATTERNS.STUDENT_ID);
    if (studentMatch) {
      entities.studentId = studentMatch[0].toUpperCase();
    }

    // 2. Class ID (Higher priority than raw department to capture CSE-A, ECE-B, MCA-A)
    const classMatch = text.match(REGEX_PATTERNS.CLASS_ID);
    if (classMatch && !entities.studentId) {
      const rawClass = classMatch[0].trim();
      if (!REGEX_PATTERNS.STUDENT_ID.test(rawClass)) {
        entities.classId = rawClass.replace(/\s+/g, '-').toUpperCase();
        if (/^(?:GENAI|MCA|BCA|CS|CSE)[-_ ]?[AB]$/i.test(rawClass)) {
          const letter = rawClass.slice(-1).toUpperCase();
          const prefix = rawClass.slice(0, -1).replace(/[-_ ]+/g, '').toUpperCase();
          entities.classId = `${prefix === 'CSE' ? 'CS' : prefix}-${letter}`;
        }
      }
    }

    // 3. Department
    const deptMatch = text.match(REGEX_PATTERNS.DEPARTMENT);
    if (deptMatch) {
      const rawDept = deptMatch[0].toUpperCase();
      entities.department = DEPARTMENT_MAP[rawDept] || rawDept;
    }

    // 4. Threshold & Filter
    const filter = this.extractThresholdFilter(text);
    if (filter) {
      entities.thresholdFilter = filter;
      if (filter.metric === 'attendance') {
        entities.threshold = filter.value;
      }
    } else {
      const threshMatch = text.match(REGEX_PATTERNS.THRESHOLD);
      if (threshMatch) {
        const val = parseInt(threshMatch[1], 10);
        if (!isNaN(val) && val >= 0 && val <= 100) {
          entities.threshold = val;
        }
      }
    }

    // 5. Semester (1 <= semester <= 8)
    const semMatch = text.match(REGEX_PATTERNS.SEMESTER);
    if (semMatch) {
      const semNum = parseInt(semMatch[1] || semMatch[2] || semMatch[3], 10);
      if (!isNaN(semNum) && semNum >= 1 && semNum <= 8) {
        entities.semester = semNum;
      }
    }

    // 6. Academic Year
    const ayMatch = text.match(REGEX_PATTERNS.ACADEMIC_YEAR);
    if (ayMatch) {
      entities.academicYear = ayMatch[1];
    }

    // 7. Payment Status
    const payMatch = text.match(REGEX_PATTERNS.PAYMENT_STATUS);
    if (payMatch) {
      const payWord = payMatch[1].toLowerCase();
      if (['pending', 'unpaid', 'due', 'outstanding'].includes(payWord)) {
        entities.paymentStatus = 'PENDING';
      } else if (['paid', 'completed'].includes(payWord)) {
        entities.paymentStatus = 'PAID';
      }
    }

    // 8. Report Format
    const fmtMatch = text.match(REGEX_PATTERNS.REPORT_FORMAT);
    if (fmtMatch) {
      const rawFmt = fmtMatch[1].toLowerCase();
      if (['pdf'].includes(rawFmt)) entities.reportFormat = 'pdf';
      else if (['excel', 'xlsx', 'csv'].includes(rawFmt)) entities.reportFormat = 'xlsx';
      else if (['word', 'docx', 'doc'].includes(rawFmt)) entities.reportFormat = 'docx';
    }

    // 9. Multi-intent check
    const multi = this.extractMultiIntents(text);
    if (multi.isMultiIntent) {
      entities.isMultiIntent = true;
      entities.subIntents = multi.subIntents;
    }

    // 10. Student Candidate Name (Fallback when not a student ID)
    const isAggregateQuery =
      /\b(?:who\s+has\s+pending|pending\s+fees?|unpaid\s+fees?|overall\s+absentees?|absentees?|who\s+is\s+absent|students\s+below|defaulters?)\b/i.test(text) ||
      ((entities.department || entities.classId) && /\b(?:attendance|fees?|students?|absentees?|below|above)\b/i.test(text) && !/\b(?:of|for)\s+[a-z]+/i.test(text.replace(REGEX_PATTERNS.DEPARTMENT, '').replace(REGEX_PATTERNS.CLASS_ID, '')));

    if (!entities.studentId && !isAggregateQuery) {
      entities.studentName = this.extractStudentNameCandidate(text);
    }

    return entities;
  }
}

