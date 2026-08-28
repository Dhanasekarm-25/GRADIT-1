import { ERPQueryIntent } from './types';
import { ExtractedEntities } from './extractors';

export interface IntentRule {
  intent: ERPQueryIntent;
  regexes: RegExp[];
  condition?: (entities: ExtractedEntities, query: string) => boolean;
}

export const INTENT_RULES: IntentRule[] = [
  {
    intent: 'UNSUPPORTED',
    regexes: [
      /\b(?:select|insert|update|delete|drop|alter|truncate|exec|union)\b/i,
    ],
  },
  {
    intent: 'REPORT_REQUEST',
    regexes: [
      /\b(?:pdf|excel|xlsx|word|docx|spreadsheet|document)\b/i,
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
    condition: (e) => !!e.department,
  },
  {
    intent: 'FEES_CLASS',
    regexes: [
      /\bclass\s+fee(?:s)?\b/i,
      /\bfee(?:s)?\s+of\s+class\b/i,
    ],
    condition: (e) => !!e.classId,
  },
  {
    intent: 'FEES_STUDENT',
    regexes: [
      /\bfee(?:s)?\s+(?:status|details|record)?\s+(?:of|for)\b/i,
      /\bhow\s+much\s+fee\s+paid\b/i,
      /\bfee(?:s)?\s+of\b/i,
    ],
    condition: (e) => !!e.studentId || !!e.studentName,
  },
  {
    intent: 'ATTENDANCE_DEPARTMENT',
    regexes: [
      /\battendance\s+(?:details|status|record|summary)?\s+(?:of|for|in)?\s*(cse|ece|mech|eee|it|civil)\b/i,
      /\b(cse|ece|mech|eee|it|civil)\s+(?:dept|department)?\s+attendance\b/i,
      /\bdepartment\s+attendance\b/i,
    ],
    condition: (e) => !!e.department,
  },
  {
    intent: 'ATTENDANCE_CLASS',
    regexes: [
      /\bclass\s+attendance\b/i,
      /\battendance\s+of\s+class\b/i,
      /\bsection\s+[a-z]\s+attendance\b/i,
    ],
    condition: (e) => !!e.classId,
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
    intent: 'STUDENT_DETAILS',
    regexes: [
      /\b(?:student\s+)?(?:details?|info|information|profile)\s*(?:of|for)?\b/i,
      /\b(?:show|get|display|check)\s+(?:me\s+)?(?:student\s+)?(?:details?|info|information|profile)\b/i,
      /\b(?:details?|info|information|profile)\b/i,
    ],
  },
  {
    intent: 'STUDENTS_LIST',
    regexes: [
      /\bstudents?\s+(?:of|in|from|for)\b/i,
      /\b(?:list|show|get|display)\s+students?\b/i,
      /\b(?:cse|ece|mech|eee|it|civil)\s+students?\b/i,
      /\bstudents?\s+(?:cse|ece|mech|eee|it|civil)\b/i,
      /\b(?:show|get|list)?\s*(?:all\s+)?student\s+(?:data|records?|list)\b/i,
    ],
  },
  {
    intent: 'STUDENT_SEARCH',
    regexes: [
      /\b(?:find|search|lookup)\s+(?:student)?\b/i,
      /\bwho\s+is\b/i,
    ],
  },
];
