import { DeterministicQueryClassifier } from '../query-understanding/classifier';
import { ERPQueryIntent } from '../query-understanding/types';

export type IntentType = ERPQueryIntent;

export interface ExtractedParameters {
  query?: string;
  studentId?: string;
  studentCode?: string;
  studentName?: string;
  classIdentifier?: string;
  departmentIdentifier?: string;
  threshold?: number;
  semester?: string;
  academicYear?: string;
  reportFormat?: 'pdf' | 'xlsx' | 'docx';
}

/**
 * Intelligent NLP Intent Classifier powered by DeterministicQueryClassifier.
 * Fast, deterministic, parameter-aware, and offline-compatible.
 */
export function classifyIntentAndExtract(userPrompt: string): {
  intent: IntentType;
  params: ExtractedParameters;
} {
  const erp = DeterministicQueryClassifier.classify(userPrompt);
  return {
    intent: erp.intent,
    params: {
      query: erp.normalizedQuery,
      studentId: erp.studentId,
      studentCode: erp.studentId,
      studentName: erp.studentName,
      departmentIdentifier: erp.department,
      classIdentifier: erp.classId,
      threshold: erp.threshold,
      semester: erp.semester !== undefined ? `S${erp.semester}` : undefined,
      academicYear: erp.academicYear,
      reportFormat: erp.reportFormat,
    },
  };
}

