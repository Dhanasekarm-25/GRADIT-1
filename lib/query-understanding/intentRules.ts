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
      /\b(?:weather|joke|president|cake|bake|python|script|poem|story|song|movie|game)\b/i,
    ],
  },
  {
    intent: 'REPORT_REQUEST',
    regexes: [
      /\b(?:pdf|excel|xlsx|word|docx|spreadsheet|document)\b/i,
      /\b(?:download|export|generate|create|make)\s+.*(?:report|pdf|excel|xlsx|word|docx)\b/i,
      /\b(?:download|export|generate|create|make)\s+(?:a\s+)?report\b/i,
      /\b(?:give|save)\s+this\s+as\b/i,
      /\b(?:attendance|fee|fees)\s+report\b/i,
    ],
  },
  {
    intent: 'LOW_ATTENDANCE',
    regexes: [
      /\b(?:low|shortage|defaulter|defaulters|poor)\s+attendance\b/i,
      /\b(?:below|under|<|less\s+than)\s*\d{1,3}%?\b/i,
      /\bwho\s+is\s+below\b/i,
      /\bwho\s+is\s+under\b/i,
      /\bstudents\s+below\b/i,
      /\b(?:overall\s+)?absentees?\b/i,
      /\bwho\s+(?:is|are)\s+absent\b/i,
      /\babsent\s+students?\b/i,
    ],
  },
  {
    intent: 'PENDING_FEES',
    regexes: [
      /\b(?:pending|unpaid|due|dues|outstanding|balance)\s*(?:fees?|payment|dues?)?\b/i,
      /\bwho\s+has\s+(?:pending|unpaid|due|not\s+paid)\b/i,
      /\bwho\s+has\s+not\s+paid\s+fees?\b/i,
      /\bunpaid\s+students?\b/i,
      /\bstudents\s+with\s+pending\s+fees?\b/i,
      /\bshow\s+(?:all\s+)?pending\s+fees?\b/i,
      /\bfee\s+(?:defaulters|dues)\b/i,
      /\bhow\s+much\s+(?:.*)?(?:owe|pending)\b/i,
      /\b(?:bca|mca|gen\s*ai|genai|cs|cse)\s+(?:pending\s+fees?|unpaid\s+fees?)\b/i,
    ],
  },
  {
    intent: 'FEES_CLASS',
    regexes: [
      /\bclass\s+(?:wise\s+)?fee(?:s)?\b/i,
      /\bfee(?:s)?\s+(?:of|for|by)\s+class\b/i,
      /\b(?:genai|gen\s*ai|mca|bca|cs|cse|ece|mech|eee|it|civil)[-_ ]*[a-b0-9]\s+fee(?:s)?\b/i,
      /\bfee(?:s)?\s+(?:for|of|in)\s+(?:genai|gen\s*ai|mca|bca|cs|cse|ece|mech|eee|it|civil)[-_ ]*[a-b0-9]\b/i,
      /\bfee(?:s)?\b/i,
    ],
    condition: (e, q) => (!!e.classId && !e.studentName && !e.studentId) || /\bclass\s+(?:wise\s+)?fee/i.test(q) || /\bfee.*class/i.test(q),
  },
  {
    intent: 'FEES_DEPARTMENT',
    regexes: [
      /\bfee(?:s)?\s+(?:details|status|record|summary)?\s+(?:of|for|in)?\s*(gen\s*ai|genai|mca|bca|cs|cse|ece|mech|eee|it|civil)\b/i,
      /\b(gen\s*ai|genai|mca|bca|cs|cse|ece|mech|eee|it|civil)\s+(?:dept|department)?\s+fee(?:s)?\b/i,
      /\b(gen\s*ai|genai|mca|bca|cs|cse|ece|mech|eee|it|civil)\s+(?:pending\s+fees?|unpaid\s+fees?)\b/i,
      /\bdepartment\s+fee(?:s)?\b/i,
    ],
    condition: (e) => !!e.department && !e.classId && !e.studentName && !e.studentId,
  },
  {
    intent: 'FEES_STUDENT',
    regexes: [
      /\bfee(?:s)?\b/i,
      /\bpayment\b/i,
      /\bpaid\b/i,
      /\bhow\s+much\s+fee\b/i,
    ],
    condition: (e) => (!e.department && !e.classId) || !!e.studentName || !!e.studentId,
  },
  {
    intent: 'ATTENDANCE_CLASS',
    regexes: [
      /\bclass\s+(?:wise\s+)?attendance\b/i,
      /\battendance\s+(?:of|for|by)\s+class\b/i,
      /\bsection\s+[a-z]\s+attendance\b/i,
      /\b(?:genai|gen\s*ai|mca|bca|cs|cse|ece|mech|eee|it|civil)[-_ ]*[a-b0-9]\s+(?:overall\s+)?(?:attendance|absentees?)\b/i,
      /\b(?:overall\s+)?absentees?\s+(?:in|of|for)\s+(?:genai|gen\s*ai|mca|bca|cs|cse|ece|mech|eee|it|civil)[-_ ]*[a-b0-9]\b/i,
      /\bwho\s+(?:is|are)\s+absent\s+in\s+(?:genai|gen\s*ai|mca|bca|cs|cse|ece|mech|eee|it|civil)[-_ ]*[a-b0-9]\b/i,
      /\battendance\s+(?:for|of|in)\s+(?:genai|gen\s*ai|mca|bca|cs|cse|ece|mech|eee|it|civil)[-_ ]*[a-b0-9]\b/i,
      /\bshow\s+attendance\b/i,
      /\battendance\b/i,
    ],
    condition: (e, q) => (!!e.classId && !e.studentName && !e.studentId) || /\b(?:class|section)\b/i.test(q) || /\babsent/i.test(q),
  },
  {
    intent: 'ATTENDANCE_DEPARTMENT',
    regexes: [
      /\battendance\s+(?:details|status|record|summary)?\s+(?:of|for|in)?\s*(gen\s*ai|genai|mca|bca|cs|cse|ece|mech|eee|it|civil)\b/i,
      /\b(gen\s*ai|genai|mca|bca|cs|cse|ece|mech|eee|it|civil)\s+(?:dept|department)?\s+attendance\b/i,
      /\bdepartment\s+attendance\b/i,
    ],
    condition: (e) => !!e.department && !e.classId && !e.studentName && !e.studentId,
  },
  {
    intent: 'ATTENDANCE_STUDENT',
    regexes: [
      /\battendance\b/i,
      /\bpercentage\b/i,
      /\bhow\s+many\s+classes\b/i,
      /\bpresent\b/i,
    ],
    condition: (e) => (!e.department && !e.classId) || !!e.studentName || !!e.studentId,
  },
  {
    intent: 'STUDENTS_LIST',
    regexes: [
      /\b(?:all\s+)?students\s+(?:in|of|from)\b/i,
      /\blist\s+(?:all\s+)?students\b/i,
      /\bshow\s+(?:all\s+)?students\b/i,
      /\b(?:gen\s*ai|genai|mca|bca|cs|cse|ece|mech|eee|it|civil)\s+students\b/i,
      /\bstudents\s+in\s+(?:gen\s*ai|genai|mca|bca|cs|cse|ece|mech|eee|it|civil)\b/i,
      /\b(?:genai|gen\s*ai|mca|bca|cs|cse|ece|mech|eee|it|civil)[-_ ]*[a-b0-9]\s+students\b/i,
    ],
    condition: (e) => !!e.department || !!e.classId,
  },
  {
    intent: 'STUDENT_DETAILS',
    regexes: [
      /\bdetails?\b/i,
      /\bdetials\b/i,
      /\binfo\b/i,
      /\binformation\b/i,
      /\bprofile\b/i,
      /\babout\b/i,
      /\bwho\s+is\b/i,
    ],
  },
  {
    intent: 'STUDENT_SEARCH',
    regexes: [
      /\bsearch\b/i,
      /\bfind\b/i,
      /\blookup\b/i,
    ],
  },
];
