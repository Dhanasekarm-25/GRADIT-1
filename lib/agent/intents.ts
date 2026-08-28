import { RegexLibrary } from './regexLibrary';

export type IntentType =
  | 'ATTENDANCE_STUDENT'
  | 'ATTENDANCE_CLASS'
  | 'ATTENDANCE_DEPARTMENT'
  | 'LOW_ATTENDANCE'
  | 'FEES_STUDENT'
  | 'FEES_CLASS'
  | 'FEES_DEPARTMENT'
  | 'PENDING_FEES'
  | 'STUDENT_SEARCH'
  | 'STUDENT_DETAILS'
  | 'STUDENTS_LIST'
  | 'REPORT_REQUEST'
  | 'UNSUPPORTED';

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
 * Intelligent NLP Intent Classifier powered by RegexLibrary.
 * Fast, deterministic, parameter-aware, and offline-compatible.
 */
export function classifyIntentAndExtract(userPrompt: string): {
  intent: IntentType;
  params: ExtractedParameters;
} {
  return RegexLibrary.parse(userPrompt);
}
