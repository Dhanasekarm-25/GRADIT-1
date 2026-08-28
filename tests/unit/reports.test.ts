import { describe, it, expect } from 'vitest';
import { generatePdfReportBuffer, ReportData } from '../../lib/reports/pdf';
import { generateExcelReportBuffer } from '../../lib/reports/excel';
import { generateDocxReportBuffer } from '../../lib/reports/docx';

const mockReportData: ReportData = {
  title: 'Test Attendance Report',
  generatedBy: 'FACULTY',
  generatedAt: '2026-08-28',
  columns: ['Student Name', 'Student Code', 'Class', 'Attendance %'],
  rows: [
    ['Rohan Sharma', '23CS101', '23CS101', '82%'],
    ['Arun Kumar', '23CS102', '23CS101', '90%'],
  ],
};

describe('Report Generators', () => {
  it('should generate a valid PDF Buffer', async () => {
    const pdfBuffer = await generatePdfReportBuffer(mockReportData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(100);
    // PDF Magic bytes %PDF
    expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF');
  });

  it('should generate a valid Excel XLSX Buffer', async () => {
    const xlsxBuffer = await generateExcelReportBuffer(mockReportData);
    expect(xlsxBuffer).toBeInstanceOf(Buffer);
    expect(xlsxBuffer.length).toBeGreaterThan(100);
    // ZIP Header PK..
    expect(xlsxBuffer.toString('utf-8', 0, 2)).toBe('PK');
  });

  it('should generate a valid DOCX Buffer', async () => {
    const docxBuffer = await generateDocxReportBuffer(mockReportData);
    expect(docxBuffer).toBeInstanceOf(Buffer);
    expect(docxBuffer.length).toBeGreaterThan(100);
    // ZIP Header PK..
    expect(docxBuffer.toString('utf-8', 0, 2)).toBe('PK');
  });
});
