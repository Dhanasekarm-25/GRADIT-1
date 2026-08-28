import { z } from 'zod';
import { dbClient } from '../db/client';
import { authorizeToolExecution, SecurityContext } from './rbac';
import { StudentFeeSummary } from '../db/types';

export const GetStudentFeesSchema = z.object({
  studentId: z.string().optional(),
  studentCode: z.string().optional(),
  studentName: z.string().optional(),
  status: z.enum(['PAID', 'PENDING', 'PARTIAL']).optional(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});

export const GetPendingFeesSchema = z.object({
  departmentIdentifier: z.string().optional(),
  classIdentifier: z.string().optional(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});

export type FeeToolResult =
  | { type: 'SINGLE_STUDENT_FEE'; data: StudentFeeSummary }
  | { type: 'AMBIGUOUS_STUDENTS'; count: number; matches: { id: string; code: string; name: string; class: string; dept: string }[] }
  | { type: 'LIST'; data: StudentFeeSummary[]; title: string }
  | { type: 'NOT_FOUND'; message: string };

export async function getStudentFeesTool(
  input: z.infer<typeof GetStudentFeesSchema>,
  context: SecurityContext
): Promise<FeeToolResult> {
  authorizeToolExecution(context, 'READ_FEES');
  const validated = GetStudentFeesSchema.parse(input);

  const records = await dbClient.getStudentFees(validated);

  if (records.length === 0) {
    return { type: 'NOT_FOUND', message: `No fee records found matching query.` };
  }

  if (records.length > 1) {
    return {
      type: 'AMBIGUOUS_STUDENTS',
      count: records.length,
      matches: records.map((r) => ({
        id: r.student.id,
        code: r.student.student_code,
        name: r.student.name,
        class: r.summary.className,
        dept: r.summary.departmentName,
      })),
    };
  }

  return { type: 'SINGLE_STUDENT_FEE', data: records[0].summary };
}

export async function getPendingFeesTool(
  input: z.infer<typeof GetPendingFeesSchema>,
  context: SecurityContext
): Promise<FeeToolResult> {
  authorizeToolExecution(context, 'READ_FEES');
  const validated = GetPendingFeesSchema.parse(input);

  const pendingList = await dbClient.getPendingFees(validated);

  return {
    type: 'LIST',
    title: `Pending & Partial Fee Records`,
    data: pendingList,
  };
}
