import { QueryNormalizer } from './normalize';
import { EntityExtractor } from './extractors';
import { INTENT_RULES } from './intentRules';
import { ConfidenceCalculator } from './confidence';
import { ERPQuery, ERPQueryIntent, ERPQuerySchema } from './types';

export class DeterministicQueryClassifier {
  public static classify(userPrompt: string): ERPQuery {
    const { originalQuery, normalizedQuery } = QueryNormalizer.normalizeQuery(userPrompt);

    if (!normalizedQuery) {
      return ERPQuerySchema.parse({
        intent: 'UNSUPPORTED',
        originalQuery,
        normalizedQuery: '',
        confidence: 0,
        source: 'REGEX',
      });
    }

    // 0. Immediate Security Guard against SQL Injection & Arbitrary SQL Execution
    if (/\b(?:select|insert|update|delete|drop|alter|truncate|exec|union)\b/i.test(normalizedQuery)) {
      return ERPQuerySchema.parse({
        intent: 'UNSUPPORTED',
        originalQuery,
        normalizedQuery,
        confidence: 1.0,
        source: 'REGEX',
      });
    }

    // 1. Extract Entities
    const entities = EntityExtractor.extractAll(normalizedQuery);

    // 2. Determine Intent via Intent Rules
    let detectedIntent: ERPQueryIntent = 'UNSUPPORTED';

    for (const rule of INTENT_RULES) {
      if (rule.condition && !rule.condition(entities, normalizedQuery)) {
        continue;
      }
      for (const regex of rule.regexes) {
        if (regex.test(normalizedQuery)) {
          detectedIntent = rule.intent;
          break;
        }
      }
      if (detectedIntent !== 'UNSUPPORTED') {
        break;
      }
    }

    // Fallback Intent Logic based on extracted entities
    if (detectedIntent === 'UNSUPPORTED') {
      if (entities.studentId || entities.studentName) {
        if (/fee|fees|paid|due|payment/i.test(normalizedQuery)) {
          detectedIntent = 'FEES_STUDENT';
        } else if (/attendance|present|absent/i.test(normalizedQuery)) {
          detectedIntent = 'ATTENDANCE_STUDENT';
        } else {
          detectedIntent = 'STUDENT_DETAILS'; // default fallback for student ID / candidate name
        }
      } else if (entities.department) {
        if (/fee|fees/i.test(normalizedQuery)) {
          detectedIntent = 'FEES_DEPARTMENT';
        } else if (/attendance/i.test(normalizedQuery)) {
          detectedIntent = 'ATTENDANCE_DEPARTMENT';
        } else {
          detectedIntent = 'STUDENTS_LIST';
        }
      } else if (entities.classId) {
        if (/fee|fees/i.test(normalizedQuery)) {
          detectedIntent = 'FEES_CLASS';
        } else {
          detectedIntent = 'ATTENDANCE_CLASS';
        }
      }
    }

    // 3. Calculate Confidence Score
    const confidence = ConfidenceCalculator.calculate(detectedIntent, entities, normalizedQuery);

    // 4. Construct & Validate ERPQuery Object using Zod
    const rawQuery: ERPQuery = {
      intent: detectedIntent,
      originalQuery,
      normalizedQuery,
      studentId: entities.studentId,
      studentName: entities.studentName,
      classId: entities.classId,
      department: entities.department,
      semester: entities.semester,
      academicYear: entities.academicYear,
      threshold: entities.threshold,
      paymentStatus: entities.paymentStatus,
      reportFormat: entities.reportFormat,
      confidence,
      source: 'REGEX',
    };

    return ERPQuerySchema.parse(rawQuery);
  }
}
