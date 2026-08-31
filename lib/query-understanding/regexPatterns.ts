export const REGEX_PATTERNS = {
  STUDENT_ID: /\b(?:[A-Z]{2,5}\d{4,5}|\d{2}[A-Z]{2,4}\d{3}|STD-?\d{3,4}|[A-Z]{2,4}-?\d{3})\b/i,
  DEPARTMENT: /\b(?:GEN\s*AI|GENAI|MCA|BCA|CS|CSE|ECE|MECH|EEE|IT|CIVIL|Generative\s+AI|Computer\s+Applications|Computer\s+Science|Electronics|Mechanical|Electrical|Civil)\b/i,
  CLASS_ID: /\b(?:cls-[a-z0-9]+|23[a-z]{2}\d{3}|(?:genai|gen\s*ai|mca|bca|cs|cse|ece|mech|eee|it|civil)[-_ ]+[a-b0-9]|sec(?:tion)?\s*[a-z]|year\s*\d\s*sec\s*[a-z])\b/i,
  THRESHOLD: /(?:below|under|<|less\s+than|shortage\s+of)?\s*(\d{1,3})\s*(?:%|percent|percentage)?\b/i,
  SEMESTER: /\b(?:s([1-8])|sem(?:ester)?\s*([1-8])|([1-8])(?:st|nd|rd|th)?\s*sem(?:ester)?)\b/i,
  ACADEMIC_YEAR: /\b(20\d{2}[-/–]\d{2,4})\b/i,
  PAYMENT_STATUS: /\b(pending|unpaid|due|outstanding|paid|completed)\b/i,
  REPORT_FORMAT: /\b(pdf|excel|xlsx|spreadsheet|word|docx|document)\b/i,
  ATTENDANCE_KEYWORDS: /\b(attendance|present|absent|absentees?|percentage|shortage|defaulter)\b/i,
  FEE_KEYWORDS: /\b(fee|fees|payment|paid|pending|due|balance|outstanding|unpaid|tuition)\b/i,
  STUDENT_DETAILS_KEYWORDS: /\b(details?|info|information|profile|student\s+details?|student\s+info|student\s+profile)\b/i,
  NAME_ATTENDANCE: /(?:attendance\s+(?:of|for)|show|get|check)\s+([a-z]+(?:\s+[a-z]+)?)\b/i,
  NAME_FEE: /(?:fee(?:s)?\s+(?:of|for|status|details)|paid\s+by)\s+([a-z]+(?:\s+[a-z]+)?)\b/i,
  NAME_SEARCH: /(?:find|search|lookup|details\s+of|details\s+for|show|get)\s+([a-z]+(?:\s+[a-z]+)?)\b/i,
};

export const DEPARTMENT_MAP: Record<string, string> = {
  'GENERATIVE AI': 'GENAI',
  'GEN AI': 'GENAI',
  GENAI: 'GENAI',
  MCA: 'MCA',
  'MASTER OF COMPUTER APPLICATIONS': 'MCA',
  BCA: 'BCA',
  'BACHELOR OF COMPUTER APPLICATIONS': 'BCA',
  'COMPUTER SCIENCE': 'CS',
  'COMPUTER SCIENCE ENGINEERING': 'CS',
  CS: 'CS',
  CSE: 'CS',
  ELECTRONICS: 'ECE',
  ECE: 'ECE',
  MECHANICAL: 'MECH',
  MECH: 'MECH',
  ELECTRICAL: 'EEE',
  EEE: 'EEE',
  CIVIL: 'CIVIL',
  IT: 'IT',
};

export const DEPARTMENT_DISPLAY_MAP: Record<string, string> = {
  GENAI: 'GEN AI',
  MCA: 'MCA',
  BCA: 'BCA',
  CS: 'Computer Science',
  CSE: 'Computer Science',
  ECE: 'Electronics',
  MECH: 'Mechanical',
  EEE: 'Electrical',
  CIVIL: 'Civil',
  IT: 'Information Technology',
};

export function formatDepartmentName(dept: string | undefined | null): string {
  if (!dept) return '';
  const clean = dept.replace(/^dept-/i, '').toUpperCase().replace(/\s+/g, '');
  return DEPARTMENT_DISPLAY_MAP[clean] || dept;
}

export function formatClassName(cls: string | undefined | null): string {
  if (!cls) return '';
  let clean = cls.replace(/^cls-/i, '').toUpperCase().trim();
  // If e.g. MCA-A, GENAI-B, CS-A
  if (/^GENAI[-_ ]?([AB])$/i.test(clean)) return `GENAI-${clean.slice(-1)}`;
  if (/^MCA[-_ ]?([AB])$/i.test(clean)) return `MCA-${clean.slice(-1)}`;
  if (/^BCA[-_ ]?([AB])$/i.test(clean)) return `BCA-${clean.slice(-1)}`;
  if (/^CS[-_ ]?([AB])$/i.test(clean)) return `CS-${clean.slice(-1)}`;
  if (/^CSE[-_ ]?([AB])$/i.test(clean)) return `CS-${clean.slice(-1)}`;
  return clean.replace(/[-_ ]+/g, '-');
}
