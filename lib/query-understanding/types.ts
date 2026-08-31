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
  'MULTI_INTENT',
  'BARE_ENTITY',
  'UNSUPPORTED',
]);

export type ERPQueryIntent = z.infer<typeof ERPQueryIntentEnum>;

export const PaymentStatusEnum = z.enum(['PAID', 'PENDING']);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const ReportFormatEnum = z.enum(['pdf', 'xlsx', 'docx']);
export type ReportFormat = z.infer<typeof ReportFormatEnum>;

export const QuerySourceEnum = z.enum(['REGEX', 'RULE', 'FUZZY', 'LLM']);
export type QuerySource = z.infer<typeof QuerySourceEnum>;

export const ThresholdFilterSchema = z.object({
  metric: z.enum(['attendance', 'fee', 'pending_fee']),
  operator: z.enum(['<', '<=', '>', '>=', '=', 'between']),
  value: z.number(),
  value2: z.number().optional(), // for 'between'
  unit: z.enum(['percent', 'inr', 'count']).default('percent'),
});
export type ThresholdFilter = z.infer<typeof ThresholdFilterSchema>;

export const StructuredParserEntitiesSchema = z.object({
  studentName: z.string().nullable().optional(),
  studentId: z.string().nullable().optional(),
  className: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  semester: z.number().int().min(1).max(8).nullable().optional(),
  academicYear: z.string().nullable().optional(),
});
export type StructuredParserEntities = z.infer<typeof StructuredParserEntitiesSchema>;

export const StructuredParserOutputSchema = z.object({
  intent: ERPQueryIntentEnum,
  originalQuery: z.string(),
  normalizedQuery: z.string(),
  entities: StructuredParserEntitiesSchema,
  filters: z.object({
    threshold: ThresholdFilterSchema.optional(),
    paymentStatus: PaymentStatusEnum.optional(),
  }),
  reportFormat: ReportFormatEnum.nullable().optional(),
  confidence: z.number().min(0).max(1.0),
  source: QuerySourceEnum,
  isMultiIntent: z.boolean().default(false),
  subIntents: z.array(ERPQueryIntentEnum).optional(),
});
export type StructuredParserOutput = z.infer<typeof StructuredParserOutputSchema>;

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
  thresholdFilter: ThresholdFilterSchema.optional(),
  paymentStatus: PaymentStatusEnum.optional(),
  reportFormat: ReportFormatEnum.optional(),
  confidence: z.number().min(0).max(1.0),
  source: QuerySourceEnum,
  isMultiIntent: z.boolean().optional(),
  subIntents: z.array(ERPQueryIntentEnum).optional(),
});
export type ERPQuery = z.infer<typeof ERPQuerySchema>;

export type ErrorClassification =
  | 'UNSUPPORTED_INTENT'
  | 'ENTITY_NOT_FOUND'
  | 'MULTIPLE_ENTITY_MATCH'
  | 'LOW_CONFIDENCE_ENTITY'
  | 'BARE_ENTITY_QUERY'
  | 'MULTI_INTENT_QUERY'
  | 'UNAUTHORIZED'
  | 'NO_RECORDS'
  | 'DATABASE_ERROR';

