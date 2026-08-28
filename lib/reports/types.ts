import { z } from 'zod';

export interface ReportMetadata {
  studentName?: string;
  studentCode?: string;
  className?: string;
  department?: string;
}

export interface ReportRow {
  studentName?: string;
  studentCode?: string;
  className?: string;
  department?: string;
  attended?: number;
  total?: number;
  percentage?: number;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  status?: string;
  [key: string]: any;
}

export interface ReportData {
  reportType?: 'attendance' | 'fees' | 'students' | 'low_attendance' | 'pending_fees' | string;
  title: string;
  subtitle?: string;
  generatedBy: string;
  generatedDate?: string;
  generatedAt?: string;
  metadata?: ReportMetadata;
  columns: string[];
  rows: any[];
}

export const ReportMetadataSchema = z.object({
  studentName: z.string().optional(),
  studentCode: z.string().optional(),
  className: z.string().optional(),
  department: z.string().optional(),
});

export const ReportDataSchema = z.object({
  reportType: z.string().optional().default('attendance'),
  title: z.string(),
  subtitle: z.string().optional(),
  generatedBy: z.string(),
  generatedDate: z.string().optional(),
  generatedAt: z.string().optional(),
  metadata: ReportMetadataSchema.optional(),
  columns: z.array(z.string()),
  rows: z.array(z.any()),
});
