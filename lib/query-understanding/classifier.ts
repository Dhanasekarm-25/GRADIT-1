import { QueryNormalizer } from './normalize';
import { EntityExtractor } from './extractors';
import { INTENT_RULES } from './intentRules';
import { ConfidenceCalculator } from './confidence';
import {
  ERPQuery,
  ERPQueryIntent,
  ERPQuerySchema,
  StructuredParserOutput,
  StructuredParserOutputSchema,
} from './types';

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

    // 0. Immediate Security Guard against SQL Injection & Arbitrary Unsupported Prompts
    if (/\b(?:select|insert|update|delete|drop|alter|truncate|exec|union|weather|joke|president|cake|bake|python|script|poem|story|song|movie|game)\b/i.test(normalizedQuery)) {
      return ERPQuerySchema.parse({
        intent: 'UNSUPPORTED',
        originalQuery,
        normalizedQuery,
        confidence: 1.0,
        source: 'REGEX',
      });
    }

    // 1. Extract Entities & Filters
    const entities = EntityExtractor.extractAll(normalizedQuery);

    // 2. Check for Multi-Intent Queries (Section 22)
    if (entities.isMultiIntent && entities.subIntents && entities.subIntents.length > 1) {
      return ERPQuerySchema.parse({
        intent: 'MULTI_INTENT',
        originalQuery,
        normalizedQuery,
        studentId: entities.studentId,
        studentName: entities.studentName,
        classId: entities.classId,
        department: entities.department,
        isMultiIntent: true,
        subIntents: entities.subIntents,
        confidence: 0.95,
        source: 'RULE',
      });
    }

    // 3. Check for Short / Bare Entity Queries (Section 21)
    // If the input is just a student name/id with no action or request keywords (e.g. "arun", "sharma", "rohan")
    const actionWordsPattern = /\b(?:fee|fees|paid|due|payment|pending|attendance|attend|present|absent|details?|info|information|profile|report|download|pdf|xlsx|excel|word|docx|class|students?|dept|department|show|tell|lookup|find|search|give|check|get|who|what|how|where|is|was)\b/i;
    const isBareEntity =
      (entities.studentName || entities.studentId) &&
      !actionWordsPattern.test(normalizedQuery) &&
      !entities.department &&
      !entities.classId;

    if (isBareEntity) {
      return ERPQuerySchema.parse({
        intent: 'BARE_ENTITY',
        originalQuery,
        normalizedQuery,
        studentId: entities.studentId,
        studentName: entities.studentName,
        confidence: 0.95,
        source: 'RULE',
      });
    }

    // 4. Determine Intent via Intent Rules
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
          detectedIntent = 'STUDENT_DETAILS';
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

    // 5. Calculate Confidence Score
    const confidence = ConfidenceCalculator.calculate(detectedIntent, entities, normalizedQuery);

    // 6. Construct & Validate ERPQuery Object using Zod
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
      thresholdFilter: entities.thresholdFilter,
      paymentStatus: entities.paymentStatus,
      reportFormat: entities.reportFormat,
      confidence,
      source: 'REGEX',
    };

    return ERPQuerySchema.parse(rawQuery);
  }

  /**
   * Returns StructuredParserOutput validated via Zod Schema (Section 34).
   */
  public static classifyStructured(userPrompt: string): StructuredParserOutput {
    const erp = this.classify(userPrompt);
    return StructuredParserOutputSchema.parse({
      intent: erp.intent,
      originalQuery: erp.originalQuery,
      normalizedQuery: erp.normalizedQuery,
      entities: {
        studentName: erp.studentName || null,
        studentId: erp.studentId || null,
        className: erp.classId || null,
        department: erp.department || null,
        semester: erp.semester || null,
        academicYear: erp.academicYear || null,
      },
      filters: {
        threshold: erp.thresholdFilter,
        paymentStatus: erp.paymentStatus,
      },
      reportFormat: erp.reportFormat || null,
      confidence: erp.confidence,
      source: erp.source,
      isMultiIntent: erp.isMultiIntent || false,
      subIntents: erp.subIntents,
    });
  }
}

