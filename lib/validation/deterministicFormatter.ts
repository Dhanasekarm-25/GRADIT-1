import { ReportData } from '../reports/types';

export interface DeterministicResponse {
  type: 'TEXT' | 'CLARIFICATION' | 'REPORT_READY' | 'ERROR';
  content: string;
  tableData?: {
    columns: string[];
    rows: (string | number)[][];
  };
  matches?: { id: string; code: string; name: string; class: string; dept: string }[];
  reportMetadata?: ReportData;
}

export class DeterministicFormatter {
  public static formatSingleAttendance(data: any, role: string): DeterministicResponse {
    const columns = ['Student Name', 'Student Code', 'Class', 'Department', 'Attended', 'Total', 'Percentage'];
    const displayRows = [[data.studentName, data.studentCode, data.className, data.departmentName, data.attendedClasses, data.totalClasses, `${data.percentage}%`]];

    const reportData: ReportData = {
      reportType: 'attendance',
      title: 'GRADit! College ERP Report',
      subtitle: `Attendance Record — ${data.studentName} (${data.studentCode})`,
      generatedBy: role,
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
      metadata: {
        studentName: data.studentName,
        studentCode: data.studentCode,
        className: data.className,
        department: data.departmentName,
      },
      columns,
      rows: [
        {
          studentName: data.studentName,
          studentCode: data.studentCode,
          className: data.className,
          department: data.departmentName,
          attended: data.attendedClasses,
          total: data.totalClasses,
          percentage: data.percentage > 1 ? data.percentage / 100 : data.percentage,
        },
      ],
    };

    return {
      type: 'TEXT',
      content: `Attendance for **${data.studentName}** (${data.studentCode}): **${data.percentage}%** (${data.attendedClasses}/${data.totalClasses} classes attended).`,
      tableData: { columns, rows: displayRows },
      reportMetadata: reportData,
    };
  }

  public static formatAttendanceList(title: string, data: any[], role: string): DeterministicResponse {
    const columns = ['Student Name', 'Student Code', 'Class', 'Department', 'Attended', 'Total', 'Percentage'];
    const displayRows = data.map((s) => [s.studentName, s.studentCode, s.className, s.departmentName || '', s.attendedClasses || 0, s.totalClasses || 0, `${s.percentage}%`]);

    const reportRows = data.map((s) => ({
      studentName: s.studentName,
      studentCode: s.studentCode,
      className: s.className,
      department: s.departmentName || '',
      attended: s.attendedClasses || 0,
      total: s.totalClasses || 0,
      percentage: s.percentage > 1 ? s.percentage / 100 : s.percentage,
    }));

    const reportData: ReportData = {
      reportType: 'low_attendance',
      title: 'GRADit! College ERP Report',
      subtitle: title,
      generatedBy: role,
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
      columns,
      rows: reportRows,
    };

    return {
      type: 'TEXT',
      content: `Found **${data.length}** records for ${title}:`,
      tableData: { columns, rows: displayRows },
      reportMetadata: reportData,
    };
  }

  public static formatSingleFee(data: any, role: string): DeterministicResponse {
    const columns = ['Student Name', 'Student Code', 'Class', 'Department', 'Total Fee', 'Paid Amount', 'Pending Amount', 'Status'];
    const displayRows = [[data.studentName, data.studentCode, data.className || '', data.departmentName || '', `₹${data.totalAmount}`, `₹${data.paidAmount}`, `₹${data.pendingAmount}`, data.status]];

    const reportData: ReportData = {
      reportType: 'fees',
      title: 'GRADit! College ERP Report',
      subtitle: `Fee Status — ${data.studentName} (${data.studentCode})`,
      generatedBy: role,
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
      metadata: {
        studentName: data.studentName,
        studentCode: data.studentCode,
        className: data.className,
        department: data.departmentName,
      },
      columns,
      rows: [
        {
          studentName: data.studentName,
          studentCode: data.studentCode,
          className: data.className || '',
          department: data.departmentName || '',
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          pendingAmount: data.pendingAmount,
          status: data.status,
        },
      ],
    };

    return {
      type: 'TEXT',
      content: `Fee status for **${data.studentName}** (${data.studentCode}): Total: ₹${data.totalAmount} | Paid: ₹${data.paidAmount} | Pending: **₹${data.pendingAmount}** (${data.status}).`,
      tableData: { columns, rows: displayRows },
      reportMetadata: reportData,
    };
  }

  public static formatFeeList(title: string, data: any[], role: string): DeterministicResponse {
    const columns = ['Student Name', 'Student Code', 'Class', 'Department', 'Total Fee', 'Paid Amount', 'Pending Amount', 'Status'];
    const displayRows = data.map((f) => [f.studentName, f.studentCode, f.className || '', f.departmentName || '', `₹${f.totalAmount || 0}`, `₹${f.paidAmount || 0}`, `₹${f.pendingAmount}`, f.status]);

    const reportRows = data.map((f) => ({
      studentName: f.studentName,
      studentCode: f.studentCode,
      className: f.className || '',
      department: f.departmentName || '',
      totalAmount: f.totalAmount || 0,
      paidAmount: f.paidAmount || 0,
      pendingAmount: f.pendingAmount,
      status: f.status,
    }));

    const reportData: ReportData = {
      reportType: 'pending_fees',
      title: 'GRADit! College ERP Report',
      subtitle: title,
      generatedBy: role,
      generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
      columns,
      rows: reportRows,
    };

    return {
      type: 'TEXT',
      content: `Found **${data.length}** records for ${title}:`,
      tableData: { columns, rows: displayRows },
      reportMetadata: reportData,
    };
  }
}
