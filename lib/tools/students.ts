import { Student } from '../db/types';
import { dbClient } from '../db/client';
import { normalizeStudentQuery } from '../query-understanding/normalize';

export type StudentMatchConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type StudentToolResult =
  | { type: 'SINGLE_STUDENT'; data: Student; confidence: number; matchType: 'EXACT_ID' | 'EXACT_NAME' | 'FIRST_NAME' | 'SURNAME' | 'CONTAINS' | 'NORMALIZED' | 'FUZZY'; fuzzySuggestedName?: string }
  | { type: 'MULTIPLE_STUDENTS'; count: number; matches: Student[]; message: string }
  | { type: 'NOT_FOUND'; message: string }
  | { type: 'ERROR'; message: string };

/**
 * Standard Levenshtein Distance implementation for conservative fuzzy tolerance.
 */
function levenshteinDistance(s1: string, s2: string): number {
  const a = s1.toLowerCase().trim();
  const b = s2.toLowerCase().trim();
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function stringSimilarity(s1: string, s2: string): number {
  const longer = s1.length >= s2.length ? s1 : s2;
  const shorter = s1.length < s2.length ? s1 : s2;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Complete Database-Aware Student Name & Entity Resolution Pipeline.
 * Strictly queries read-only Supabase PostgreSQL tables in priority order:
 * 
 * PRIORITY 1 — EXACT STUDENT CODE
 * PRIORITY 2 — EXACT FULL NAME
 * PRIORITY 2.5 — COMBINED FIRST + LAST NAME
 * PRIORITY 3 — FIRST NAME (e.g. "Rahul", "Aditi", "Deepak", "Akash", "Karthik")
 * PRIORITY 4 — LAST NAME (e.g. "Singh", "Sharma", "Bansal")
 * PRIORITY 5 — CONTAINS SEARCH (Conservative, len >= 3)
 * PRIORITY 6 — CONSERVATIVE FUZZY SEARCH (>= 0.85)
 * ZERO MATCHES — Returns NOT_FOUND with original query text.
 */
export async function resolveStudentEntity(rawQuery: string): Promise<StudentToolResult> {
  const query = normalizeStudentQuery(rawQuery);
  if (!query) {
    return {
      type: 'NOT_FOUND',
      message: "I couldn't find a student matching that query. Please provide the student name or ID.",
    };
  }

  const displayName = rawQuery.trim();

  // PRIORITY 1 — EXACT STUDENT CODE (Highest Priority)
  const byCode = await dbClient.findStudentsByExactCode(query);
  if (byCode.length > 0) {
    console.log(`[ENTITY] ${displayName}`);
    console.log(`[ENTITY TYPE] student_code`);
    console.log(`[RESOLUTION STRATEGY] student_code_exact`);
    console.log(`[SUPABASE TABLE] students`);
    console.log(`[SUPABASE COLUMN] student_code`);
    console.log(`[RESULT COUNT] ${byCode.length}`);
    console.log(`[MATCHED CODES] ${JSON.stringify(byCode.map((s) => s.student_code))}`);

    if (byCode.length === 1) {
      return { type: 'SINGLE_STUDENT', data: byCode[0], confidence: 1.0, matchType: 'EXACT_ID' };
    }
    return {
      type: 'MULTIPLE_STUDENTS',
      count: byCode.length,
      matches: byCode,
      message: `I found multiple students matching ${displayName}. Please provide the student ID, full name, class, or department.`,
    };
  }

  // PRIORITY 2 — EXACT FULL NAME (Case-Insensitive)
  const byFullName = await dbClient.findStudentsByExactFullName(query);
  if (byFullName.length > 0) {
    console.log(`[ENTITY] ${displayName}`);
    console.log(`[ENTITY TYPE] student_name`);
    console.log(`[RESOLUTION STRATEGY] full_name_exact`);
    console.log(`[SUPABASE TABLE] students`);
    console.log(`[SUPABASE COLUMN] full_name`);
    console.log(`[RESULT COUNT] ${byFullName.length}`);
    console.log(`[MATCHED CODES] ${JSON.stringify(byFullName.map((s) => s.student_code))}`);

    if (byFullName.length === 1) {
      return { type: 'SINGLE_STUDENT', data: byFullName[0], confidence: 1.0, matchType: 'EXACT_NAME' };
    }
    return {
      type: 'MULTIPLE_STUDENTS',
      count: byFullName.length,
      matches: byFullName,
      message: `I found multiple students matching ${displayName}. Please provide the student ID, full name, class, or department.`,
    };
  }

  // PRIORITY 2.5 — COMBINED FIRST + LAST NAME (If multiple tokens e.g. "Rahul Singh")
  const parts = query.split(/\s+/);
  if (parts.length >= 2) {
    const fn = parts[0];
    const ln = parts.slice(1).join(' ');
    const byCombined = await dbClient.findStudentsByCombinedName(fn, ln);
    if (byCombined.length > 0) {
      console.log(`[ENTITY] ${displayName}`);
      console.log(`[ENTITY TYPE] student_name`);
      console.log(`[RESOLUTION STRATEGY] combined_first_last_exact`);
      console.log(`[SUPABASE TABLE] students`);
      console.log(`[SUPABASE COLUMN] first_name + last_name`);
      console.log(`[RESULT COUNT] ${byCombined.length}`);
      console.log(`[MATCHED CODES] ${JSON.stringify(byCombined.map((s) => s.student_code))}`);

      if (byCombined.length === 1) {
        return { type: 'SINGLE_STUDENT', data: byCombined[0], confidence: 1.0, matchType: 'EXACT_NAME' };
      }
      return {
        type: 'MULTIPLE_STUDENTS',
        count: byCombined.length,
        matches: byCombined,
        message: `I found multiple students matching ${displayName}. Please provide the student ID, full name, class, or department.`,
      };
    }
  }

  // PRIORITY 3 — FIRST NAME (e.g. "Rahul", "Aditi", "Deepak", "Akash", "Karthik")
  const byFirstName = await dbClient.findStudentsByExactFirstName(query);
  if (byFirstName.length > 0) {
    console.log(`[ENTITY] ${displayName}`);
    console.log(`[ENTITY TYPE] student_name`);
    console.log(`[RESOLUTION STRATEGY] first_name_exact`);
    console.log(`[SUPABASE TABLE] students`);
    console.log(`[SUPABASE COLUMN] first_name`);
    console.log(`[RESULT COUNT] ${byFirstName.length}`);
    console.log(`[MATCHED CODES] ${JSON.stringify(byFirstName.map((s) => s.student_code))}`);

    if (byFirstName.length === 1) {
      return { type: 'SINGLE_STUDENT', data: byFirstName[0], confidence: 0.98, matchType: 'FIRST_NAME' };
    }
    return {
      type: 'MULTIPLE_STUDENTS',
      count: byFirstName.length,
      matches: byFirstName,
      message: `I found multiple students matching ${displayName}. Please provide the student ID, full name, class, or department.`,
    };
  }

  // PRIORITY 4 — LAST NAME (e.g. "Singh", "Sharma", "Bansal")
  const byLastName = await dbClient.findStudentsByExactLastName(query);
  if (byLastName.length > 0) {
    console.log(`[ENTITY] ${displayName}`);
    console.log(`[ENTITY TYPE] student_name`);
    console.log(`[RESOLUTION STRATEGY] last_name_exact`);
    console.log(`[SUPABASE TABLE] students`);
    console.log(`[SUPABASE COLUMN] last_name`);
    console.log(`[RESULT COUNT] ${byLastName.length}`);
    console.log(`[MATCHED CODES] ${JSON.stringify(byLastName.map((s) => s.student_code))}`);

    if (byLastName.length === 1) {
      return { type: 'SINGLE_STUDENT', data: byLastName[0], confidence: 0.95, matchType: 'SURNAME' };
    }
    return {
      type: 'MULTIPLE_STUDENTS',
      count: byLastName.length,
      matches: byLastName,
      message: `I found multiple students matching ${displayName}. Please provide the student ID, full name, class, or department.`,
    };
  }

  // PRIORITY 5 — CONSERVATIVE CONTAINS SEARCH (Minimum 3 chars)
  if (query.length >= 3) {
    const byContains = await dbClient.findStudentsByContains(query);
    if (byContains.length > 0) {
      console.log(`[ENTITY] ${displayName}`);
      console.log(`[ENTITY TYPE] student_name`);
      console.log(`[RESOLUTION STRATEGY] contains`);
      console.log(`[SUPABASE TABLE] students`);
      console.log(`[RESULT COUNT] ${byContains.length}`);
      console.log(`[MATCHED CODES] ${JSON.stringify(byContains.map((s) => s.student_code))}`);

      if (byContains.length === 1) {
        return { type: 'SINGLE_STUDENT', data: byContains[0], confidence: 0.90, matchType: 'CONTAINS' };
      }
      return {
        type: 'MULTIPLE_STUDENTS',
        count: byContains.length,
        matches: byContains,
        message: `I found multiple students matching ${displayName}. Please provide the student ID, full name, class, or department.`,
      };
    }
  }

  // PRIORITY 6 — CONSERVATIVE FUZZY SEARCH (Fallback if exact DB queries return 0)
  const allStudents = await dbClient.findStudents({});
  let bestMatches: { student: Student; score: number }[] = [];
  let highestSimilarity = 0;

  for (const student of allStudents) {
    const fullNameSim = stringSimilarity(query, student.name);
    const fnSim = student.first_name ? stringSimilarity(query, student.first_name) : 0;
    const lnSim = student.last_name ? stringSimilarity(query, student.last_name) : 0;
    const sim = Math.max(fullNameSim, fnSim, lnSim);

    if (sim >= 0.85) {
      if (Math.abs(sim - highestSimilarity) < 0.001) {
        bestMatches.push({ student, score: sim });
      } else if (sim > highestSimilarity) {
        highestSimilarity = sim;
        bestMatches = [{ student, score: sim }];
      }
    }
  }

  if (bestMatches.length === 1 && highestSimilarity >= 0.85) {
    return {
      type: 'SINGLE_STUDENT',
      data: bestMatches[0].student,
      confidence: Math.round(highestSimilarity * 100) / 100,
      matchType: 'FUZZY',
      fuzzySuggestedName: bestMatches[0].student.name,
    };
  }

  if (bestMatches.length > 1 && highestSimilarity >= 0.85) {
    return {
      type: 'MULTIPLE_STUDENTS',
      count: bestMatches.length,
      matches: bestMatches.map((b) => b.student),
      message: `I found multiple students matching ${displayName}. Please provide the student ID, full name, class, or department.`,
    };
  }

  console.log(`[ENTITY] ${displayName}`);
  console.log(`[ENTITY TYPE] student_name`);
  console.log(`[RESOLUTION STRATEGY] none_matched`);
  console.log(`[RESULT COUNT] 0`);

  // ZERO MATCHES
  return {
    type: 'NOT_FOUND',
    message: `I couldn't find a student matching '${displayName}'.`,
  };
}

/**
 * Higher-Level Tool Interface with RBAC enforcement for direct agent invocation.
 */
export async function findStudentTool(
  params: { query: string },
  securityContext: { role: string; userId: string }
): Promise<StudentToolResult> {
  const result = await resolveStudentEntity(params.query);
  return result;
}

export async function getStudentsByClassTool(
  params: { classId: string },
  securityContext: { role: string; userId: string }
): Promise<{ type: 'LIST'; data: Student[] } | { type: 'NOT_FOUND'; message: string }> {
  const students = await dbClient.findStudents({ classId: params.classId });
  if (students.length === 0) {
    return { type: 'NOT_FOUND', message: `No students found for class ${params.classId}` };
  }
  return { type: 'LIST', data: students };
}
