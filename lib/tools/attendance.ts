import { z } from 'zod';
import { dbClient } from '../db/client';
import { authorizeToolExecution, SecurityContext } from './rbac';
import { StudentAttendanceSummary } from '../db/types';

export const GetStudentAttendanceSchema = z.object({
  studentId: z.string().optional(),
  studentCode: z.string().optional(),
  studentName: z.string().optional(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});

export const GetClassAttendanceSchema = z.object({
  classIdentifier: z.string(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});

export const GetDepartmentAttendanceSchema = z.object({
  departmentIdentifier: z.string(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});

export const GetLowAttendanceSchema = z.object({
  departmentIdentifier: z.string().optional(),
  classIdentifier: z.string().optional(),
  threshold: z.number().min(0).max(100).default(75).optional(),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});

export type AttendanceToolResult =
  | { type: 'SINGLE_STUDENT'; data: StudentAttendanceSummary }
  | { type: 'AMBIGUOUS_STUDENTS'; count: number; matches: { id: string; code: string; name: string; class: string; dept: string }[] }
  | { type: 'LIST'; data: StudentAttendanceSummary[]; title: string }
  | { type: 'NOT_FOUND'; message: string };

export async function getStudentAttendanceTool(
  input: z.infer<typeof GetStudentAttendanceSchema>,
  context: SecurityContext
): Promise<AttendanceToolResult> {
  authorizeToolExecution(context, 'READ_ATTENDANCE');
  const validated = GetStudentAttendanceSchema.parse(input);

  const records = await dbClient.getStudentAttendance(validated);

  if (records.length === 0) {
    return { type: 'NOT_FOUND', message: `No attendance records found matching query.` };
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

  return { type: 'SINGLE_STUDENT', data: records[0].summary };
}

export async function getClassAttendanceTool(
  input: z.infer<typeof GetClassAttendanceSchema>,
  context: SecurityContext
): Promise<AttendanceToolResult> {
  authorizeToolExecution(context, 'READ_ATTENDANCE');
  const validated = GetClassAttendanceSchema.parse(input);

  const result = await dbClient.getClassAttendance(validated);
  return {
    type: 'LIST',
    title: `Attendance for Class ${result.classInfo.code}`,
    data: result.summaries,
  };
}

export async function getDepartmentAttendanceTool(
  input: z.infer<typeof GetDepartmentAttendanceSchema>,
  context: SecurityContext
): Promise<AttendanceToolResult> {
  authorizeToolExecution(context, 'READ_ATTENDANCE');
  const validated = GetDepartmentAttendanceSchema.parse(input);

  const result = await dbClient.getDepartmentAttendance(validated);
  return {
    type: 'LIST',
    title: `Attendance for Department ${result.departmentInfo.code}`,
    data: result.summaries,
  };
}

export async function getLowAttendanceStudentsTool(
  input: z.infer<typeof GetLowAttendanceSchema>,
  context: SecurityContext
): Promise<AttendanceToolResult> {
  authorizeToolExecution(context, 'READ_ATTENDANCE');
  const validated = GetLowAttendanceSchema.parse(input);

  const lowList = await dbClient.getLowAttendanceStudents(validated);
  const thresh = validated.threshold ?? 75;

  return {
    type: 'LIST',
    title: `Students with Attendance below ${thresh}%`,
    data: lowList,
  };
}
