import { NextRequest, NextResponse } from 'next/server';
import { generateReportBuffer, ReportData } from '@/lib/reports';
import { authorizeToolExecution, SecurityContext } from '@/lib/tools/rbac';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { format, reportData, role = 'FACULTY', userId = 'usr-1' } = body;

    const securityContext: SecurityContext = { userId, role };
    authorizeToolExecution(securityContext, 'GENERATE_REPORTS');

    if (!reportData || !format) {
      return NextResponse.json({ error: 'Missing reportData or format parameter' }, { status: 400 });
    }

    // Build structured ReportData object
    const data: ReportData = {
      reportType: reportData.reportType || 'attendance',
      title: 'GRADit! College ERP Report',
      subtitle: reportData.title || reportData.subtitle || 'Summary Report',
      generatedBy: securityContext.role,
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
      metadata: reportData.metadata || {
        studentName: reportData.studentName,
        studentCode: reportData.studentCode,
        className: reportData.className,
        department: reportData.department,
      },
      columns: reportData.columns || ['Student Name', 'Student Code', 'Class', 'Department', 'Attended', 'Total', 'Percentage'],
      rows: reportData.rows || [],
    };

    const { buffer, contentType, filename } = await generateReportBuffer(format, data);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    if (err.name === 'AuthorizationError') {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message || 'Unable to generate the requested report right now.' }, { status: 500 });
  }
}
