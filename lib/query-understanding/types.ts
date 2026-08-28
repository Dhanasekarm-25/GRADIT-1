import { z } from 'zod';

export const ERPQueryIntentEnum = z.enum([
  'ATTENDANCE_STUDENT',
  'ATTENDANCE_CLASS',
  'ATTENDANCE_DEPARTMENT',
  'LOW_ATTENDANCE',
  'FEES_STUDENT',
  'FEES_CLASS',
  'FEES_DEPARTMENT',
  'PENDING_FEES',
  'STUDENT_SEARCH',
  'STUDENT_DETAILS',
  'CLASS_LOOKUP',
  'DEPARTMENT_LOOKUP',
  'STUDENTS_LIST',
  'REPORT_REQUEST',
  'UNSUPPORTED',
]);

export type ERPQueryIntent = z.infer<typeof ERPQueryIntentEnum>;

export const PaymentStatusEnum = z.enum(['PAID', 'PENDING']);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const ReportFormatEnum = z.enum(['pdf', 'xlsx', 'docx']);
export type ReportFormat = z.infer<typeof ReportFormatEnum>;

export const QuerySourceEnum = z.enum(['REGEX', 'RULE', 'LLM']);
export type QuerySource = z.infer<typeof QuerySourceEnum>;

export const ERPQuerySchema = z.object({
  intent: ERPQueryIntentEnum,
  originalQuery: z.string(),
  normalizedQuery: z.string(),
  studentId: z.string().optional(),
  studentName: z.string().optional(),
  classId: z.string().optional(),
  department: z.string().optional(),
  semester: z.number().int().min(1).max(8).optional(),
  academicYear: z.string().optional(),
  threshold: z.number().min(0).max(100).optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  reportFormat: ReportFormatEnum.optional(),
  confidence: z.number().min(0).max(1.0),
  source: QuerySourceEnum,
});

export type ERPQuery = z.infer<typeof ERPQuerySchema>;
