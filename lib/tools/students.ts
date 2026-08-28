import { z } from 'zod';
import { dbClient } from '../db/client';
import { authorizeToolExecution, SecurityContext } from './rbac';
import { Student } from '../db/types';

export const StudentSearchSchema = z.object({
  query: z.string(),
  classIdentifier: z.string().optional(),
  departmentIdentifier: z.string().optional(),
});

export type StudentToolResult =
  | { type: 'SINGLE_STUDENT'; data: Student; confidence: number; matchType: 'EXACT_ID' | 'EXACT_NAME' | 'FUZZY'; fuzzySuggestedName?: string }
  | { type: 'MULTIPLE_STUDENTS'; count: number; matches: Student[] }
  | { type: 'LIST'; title: string; data: Student[] }
  | { type: 'NOT_FOUND'; message: string };

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function stringSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();
  if (str1 === str2) return 1.0;
  const dist = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Database-Aware Entity Resolution Pipeline.
 * Prioritizes Exact ID -> Exact Name -> Normalized Name -> Fuzzy Match -> Ambiguity -> Not Found.
 */
export async function findStudentTool(
  input: z.infer<typeof StudentSearchSchema>,
  context: SecurityContext
): Promise<StudentToolResult> {
  authorizeToolExecution(context, 'READ_STUDENTS');
  const validated = StudentSearchSchema.parse(input);
  const queryStr = validated.query.trim();

  if (!queryStr) {
    return { type: 'NOT_FOUND', message: "I couldn't find a student matching that name. Please check the name or provide the student ID." };
  }

  // Priority 1: Exact Student Code / ID
  const studentsByCode = await dbClient.findStudents({ studentCode: queryStr });
  if (studentsByCode.length === 1) {
    return { type: 'SINGLE_STUDENT', data: studentsByCode[0], confidence: 1.0, matchType: 'EXACT_ID' };
  }

  // Priority 2: Exact Full Name Match (Case-Insensitive)
  const studentsByName = await dbClient.findStudents({ studentName: queryStr });
  if (studentsByName.length === 1) {
    return { type: 'SINGLE_STUDENT', data: studentsByName[0], confidence: 1.0, matchType: 'EXACT_NAME' };
  }
  if (studentsByName.length > 1) {
    return { type: 'MULTIPLE_STUDENTS', count: studentsByName.length, matches: studentsByName };
  }

  // Priority 3 & 4: Partial Token & Fuzzy Name Matching across ALL Database Students
  const allStudents = await dbClient.findStudents({});
  const queryLower = queryStr.toLowerCase();

  // Partial Token Match (e.g. "Arun" matching "Arun Kumar")
  const partialMatches = allStudents.filter((s) => s.name.toLowerCase().includes(queryLower));
  if (partialMatches.length === 1) {
    return { type: 'SINGLE_STUDENT', data: partialMatches[0], confidence: 0.95, matchType: 'EXACT_NAME' };
  }
  if (partialMatches.length > 1) {
    return { type: 'MULTIPLE_STUDENTS', count: partialMatches.length, matches: partialMatches };
  }

  // Fuzzy Levenshtein Match against Student Names (e.g. "ARFUN" -> "Arun Kumar", "HARIN" -> "Harini")
  let bestMatch: Student | null = null;
  let highestSimilarity = 0;

  for (const student of allStudents) {
    const fullNameSim = stringSimilarity(queryLower, student.name);
    const firstNameSim = stringSimilarity(queryLower, student.name.split(' ')[0]);
    const maxSim = Math.max(fullNameSim, firstNameSim);

    if (maxSim > highestSimilarity) {
      highestSimilarity = maxSim;
      bestMatch = student;
    }
  }

  // Fuzzy Threshold Tiers: >=0.90 High, 0.75-0.89 Medium, <0.75 Low
  if (bestMatch && highestSimilarity >= 0.75) {
    return {
      type: 'SINGLE_STUDENT',
      data: bestMatch,
      confidence: Math.round(highestSimilarity * 100) / 100,
      matchType: 'FUZZY',
      fuzzySuggestedName: bestMatch.name,
    };
  }

  // Zero Matches
  return {
    type: 'NOT_FOUND',
    message: `I couldn't find a student matching '${queryStr}'. Please check the name or provide the student ID.`,
  };
}

export async function getStudentsByClassTool(
  classIdentifier: string,
  context: SecurityContext
): Promise<StudentToolResult> {
  authorizeToolExecution(context, 'READ_STUDENTS');
  const cls = await dbClient.getClassByCodeOrId(classIdentifier);
  if (!cls) {
    return { type: 'NOT_FOUND', message: `Class '${classIdentifier}' not found.` };
  }

  const students = await dbClient.findStudents({ classId: cls.id });
  return { type: 'LIST', title: `Students in ${cls.code}`, data: students };
}
