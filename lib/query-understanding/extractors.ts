import { REGEX_PATTERNS, DEPARTMENT_MAP } from './regexPatterns';
import { PaymentStatus, ReportFormat } from './types';

export interface ExtractedEntities {
  studentId?: string;
  studentName?: string;
  classId?: string;
  department?: string;
  semester?: number;
  academicYear?: string;
  threshold?: number;
  paymentStatus?: PaymentStatus;
  reportFormat?: ReportFormat;
}

export class EntityExtractor {
  private static readonly STOP_WORDS = new Set([
    'show',
    'me',
    'get',
    'check',
    'find',
    'search',
    'lookup',
    'of',
    'for',
    'the',
    'a',
    'an',
    'in',
    'student',
    'students',
    'details',
    'detail',
    'info',
    'information',
    'profile',
    'attendance',
    'fees',
    'fee',
    'report',
    'data',
    'records',
    'record',
    'status',
    'is',
    'was',
    'what',
    'whats',
    'how',
    'much',
    'many',
    'present',
    'absent',
    'who',
    'where',
    'when',
    'why',
    'weather',
    'can',
    'you',
    'tell',
    'please',
    'give',
    'display',
    'ignore',
    'permissions',
    'all',
  ]);

  /**
   * Generic candidate name extractor.
   * Removes stop words and intent keywords to isolate candidate student name token(s).
   * Does NOT hardcode specific student names.
   */
  public static extractStudentNameCandidate(text: string): string | undefined {
    let cleaned = text.replace(REGEX_PATTERNS.STUDENT_ID, '');
    cleaned = cleaned.replace(REGEX_PATTERNS.DEPARTMENT, '');
    cleaned = cleaned.replace(REGEX_PATTERNS.CLASS_ID, '');

    const tokens = cleaned.split(/\s+/).filter((token) => {
      const lower = token.toLowerCase();
      return lower.length > 0 && !this.STOP_WORDS.has(lower);
    });

    if (tokens.length === 0) {
      return undefined;
    }

    return tokens.join(' ');
  }

  public static extractAll(text: string): ExtractedEntities {
    const entities: ExtractedEntities = {};

    // 1. Student ID
    const studentMatch = text.match(REGEX_PATTERNS.STUDENT_ID);
    if (studentMatch) {
      entities.studentId = studentMatch[0].toUpperCase();
    }

    // 2. Department
    const deptMatch = text.match(REGEX_PATTERNS.DEPARTMENT);
    if (deptMatch) {
      const rawDept = deptMatch[0].toUpperCase();
      entities.department = DEPARTMENT_MAP[rawDept] || rawDept;
    }

    // 3. Class ID
    const classMatch = text.match(REGEX_PATTERNS.CLASS_ID);
    if (classMatch && !entities.studentId) {
      entities.classId = classMatch[0].toUpperCase();
    }

    // 4. Threshold (0 <= threshold <= 100)
    const threshMatch = text.match(REGEX_PATTERNS.THRESHOLD);
    if (threshMatch) {
      const val = parseInt(threshMatch[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        entities.threshold = val;
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
      const fmtWord = fmtMatch[1].toLowerCase();
      if (['excel', 'xlsx', 'spreadsheet'].includes(fmtWord)) {
        entities.reportFormat = 'xlsx';
      } else if (['word', 'docx', 'document'].includes(fmtWord)) {
        entities.reportFormat = 'docx';
      } else if (fmtWord === 'pdf') {
        entities.reportFormat = 'pdf';
      }
    }

    // 9. Generic Student Name Candidate Extraction
    if (!entities.studentId) {
      const candidate = this.extractStudentNameCandidate(text);
      if (candidate) {
        entities.studentName = candidate;
      }
    }

    return entities;
  }
}
