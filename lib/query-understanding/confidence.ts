import { ExtractedEntities } from './extractors';
import { ERPQueryIntent } from './types';
import { REGEX_PATTERNS } from './regexPatterns';

export class ConfidenceCalculator {
  public static calculate(
    intent: ERPQueryIntent,
    entities: ExtractedEntities,
    normalizedQuery: string
  ): number {
    if (intent === 'UNSUPPORTED') {
      return 0.0;
    }

    let score = 0.0;

    // 1. Entity Weightings
    if (entities.studentId) score += 0.40;
    if (entities.department) score += 0.15;
    if (entities.classId) score += 0.15;
    if (entities.threshold !== undefined) score += 0.15;
    if (entities.semester !== undefined) score += 0.10;
    if (entities.reportFormat) score += 0.10;
    if (entities.studentName) score += 0.20;

    // 2. Keyword Weightings
    if (REGEX_PATTERNS.ATTENDANCE_KEYWORDS.test(normalizedQuery)) score += 0.25;
    if (REGEX_PATTERNS.FEE_KEYWORDS.test(normalizedQuery)) score += 0.25;

    // 3. Special Intent Boosts
    if (intent === 'REPORT_REQUEST' && entities.reportFormat) score += 0.30;
    if (intent === 'PENDING_FEES' && entities.paymentStatus === 'PENDING') score += 0.25;
    if (intent === 'LOW_ATTENDANCE' && (entities.threshold !== undefined || /low|shortage/i.test(normalizedQuery))) score += 0.25;
    if (intent === 'STUDENTS_LIST' && (entities.department || /students/i.test(normalizedQuery))) score += 0.30;

    // Cap strictly at 1.00
    return Math.min(Math.round(score * 100) / 100, 1.0);
  }
}
