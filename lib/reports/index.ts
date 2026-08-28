import { ReportData } from './types';
import { generatePdfReportBuffer } from './pdf';
import { generateExcelReportBuffer } from './excel';
import { generateDocxReportBuffer } from './docx';

export * from './types';
export * from './pdf';
export * from './excel';
export * from './docx';

/**
 * Sanitizes input strings for safe cross-platform filenames without path traversal risks.
 */
export function sanitizeFilename(input: string): string {
  if (!input) return 'GRADit_Report';
  // Remove path traversal and unsafe characters
  let safe = input.replace(/\.\./g, '');
  safe = safe.replace(/[\/\\:*?"<>|]/g, '_');
  safe = safe.replace(/\s+/g, '_');
  safe = safe.replace(/[^a-zA-Z0-9_\-]/g, '');
  return safe.substring(0, 80) || 'GRADit_Report';
}

/**
 * Programmatically validates generated document buffers to prevent corrupted file output.
 */
export function validateReportBuffer(buffer: Buffer, format: string): boolean {
  if (!buffer || buffer.length === 0) return false;

  const fmt = format.toLowerCase();
  if (fmt === 'pdf') {
    return buffer.toString('utf-8', 0, 4) === '%PDF';
  } else if (fmt === 'xlsx' || fmt === 'docx' || fmt === 'excel' || fmt === 'word') {
    return buffer.toString('utf-8', 0, 2) === 'PK';
  }
  return true;
}

/**
 * Master multi-format report exporter.
 */
export async function generateReportBuffer(
  format: 'pdf' | 'xlsx' | 'docx',
  data: ReportData
): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  let buffer: Buffer;
  let contentType: string;
  let ext: string;

  const titleSlug = sanitizeFilename(data.subtitle || data.title || 'Report');
  const timestamp = Date.now();

  switch (format.toLowerCase()) {
    case 'pdf':
      buffer = await generatePdfReportBuffer(data);
      contentType = 'application/pdf';
      ext = 'pdf';
      break;
    case 'xlsx':
    case 'excel':
      buffer = await generateExcelReportBuffer(data);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext = 'xlsx';
      break;
    case 'docx':
    case 'word':
      buffer = await generateDocxReportBuffer(data);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      ext = 'docx';
      break;
    default:
      throw new Error(`Unsupported report format: '${format}'`);
  }

  if (!validateReportBuffer(buffer, ext)) {
    throw new Error(`Failed to generate a valid ${ext.toUpperCase()} document.`);
  }

  const filename = `GRADit_${titleSlug}_${timestamp}.${ext}`;
  return { buffer, contentType, filename };
}
