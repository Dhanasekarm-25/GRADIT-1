import { SecurityContext } from '../tools/rbac';
import { DeterministicQueryClassifier } from '../query-understanding/classifier';
import { QueryValidator } from '../validation/queryValidator';
import { DeterministicFormatter, DeterministicResponse, PendingQuery } from '../validation/deterministicFormatter';
import { ResultValidator } from '../validation/resultValidator';
import {
  getStudentAttendanceTool,
  getClassAttendanceTool,
  getDepartmentAttendanceTool,
  getLowAttendanceStudentsTool,
} from '../tools/attendance';
import { getStudentFeesTool, getPendingFeesTool } from '../tools/fees';
import { findStudentTool, getStudentsByClassTool, resolveStudentEntity } from '../tools/students';
import { dbClient } from '../db/client';
import { Student, StudentFeeSummary, StudentAttendanceSummary } from '../db/types';
import { ReportData } from '../reports/pdf';

export interface AgentResponse extends DeterministicResponse {}
export type { PendingQuery };

/**
 * executeIntent Router — Routes a resolved student code and intent to the appropriate tool.
 * No tool may execute without an explicit intent.
 */
import { formatClassName, formatDepartmentName } from '../query-understanding/regexPatterns';

export async function executeIntent(params: {
  intent: PendingQuery['intent'];
  studentCode: string;
  securityContext: SecurityContext;
  originalMessage?: string;
  reportFormat?: 'pdf' | 'xlsx' | 'docx';
}): Promise<AgentResponse> {
  const { intent, studentCode, securityContext, reportFormat } = params;

  switch (intent) {
    case 'FEES': {
      const feeRecords = await dbClient.getStudentFees({ studentCode });
      if (feeRecords.length === 0) {
        return { type: 'TEXT', content: `No fee records found for student ${studentCode}.` };
      }
      return DeterministicFormatter.formatSingleFee(feeRecords[0].summary, securityContext.role);
    }

    case 'ATTENDANCE': {
      const attRecords = await dbClient.getStudentAttendance({ studentCode });
      if (attRecords.length === 0) {
        return { type: 'TEXT', content: `No attendance records found for student ${studentCode}.` };
      }
      return DeterministicFormatter.formatSingleAttendance(attRecords[0].summary, securityContext.role);
    }

    case 'STUDENT_DETAILS': {
      const students = await dbClient.findStudents({ studentCode });
      if (students.length === 0) {
        return { type: 'TEXT', content: `No student profile found for ${studentCode}.` };
      }
      const s = students[0];
      const deptObj = await dbClient.getDepartmentByCodeOrId(s.department_id);
      const classObj = await dbClient.getClassByCodeOrId(s.class_id);
      const deptName = deptObj ? deptObj.name : formatDepartmentName(s.department_id);
      const className = classObj ? classObj.name : formatClassName(s.class_id);

      const columns = ['Attribute', 'Value'];
      const displayRows: (string | number)[][] = [
        ['Student Name', s.name],
        ['Student Code', s.student_code],
        ['Department', deptName],
        ['Class', className],
      ];
      if (s.email) displayRows.push(['Email', s.email]);
      if (s.phone) displayRows.push(['Phone', s.phone]);
      if (s.date_of_birth) displayRows.push(['Date of Birth', s.date_of_birth]);
      if (s.year) displayRows.push(['Year', `Year ${s.year}`]);
      if (s.semester) displayRows.push(['Semester', s.semester]);
      if (s.section) displayRows.push(['Section', `Section ${s.section}`]);
      if (s.admission_year) displayRows.push(['Admission Year', s.admission_year]);
      if (s.status) displayRows.push(['Status', s.status]);

      let content = `Student Details for **${s.name}** (${s.student_code}):\n`;
      content += `- **Department**: ${deptName}\n`;
      content += `- **Class**: ${className}\n`;
      if (s.email) content += `- **Email**: ${s.email}\n`;
      if (s.phone) content += `- **Phone**: ${s.phone}\n`;
      if (s.date_of_birth) content += `- **Date of Birth**: ${s.date_of_birth}\n`;
      if (s.year) content += `- **Year**: Year ${s.year}\n`;
      if (s.semester) content += `- **Semester**: ${s.semester}\n`;
      if (s.section) content += `- **Section**: Section ${s.section}\n`;
      if (s.admission_year) content += `- **Admission Year**: ${s.admission_year}\n`;
      if (s.status) content += `- **Status**: ${s.status}\n`;

      const reportData: ReportData = {
        reportType: 'student_profile',
        title: 'GRADit! College ERP Report',
        subtitle: `Student Profile — ${s.name} (${s.student_code})`,
        generatedBy: securityContext.role,
        generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
        metadata: {
          studentName: s.name,
          studentCode: s.student_code,
          className,
          department: deptName,
        },
        columns,
        rows: displayRows.map(([attr, val]) => ({ attribute: String(attr), value: String(val) })),
      };

      return {
        type: 'TEXT',
        content,
        tableData: { columns, rows: displayRows },
        reportMetadata: reportData,
      };
    }

    case 'REPORT': {
      const isFee = /fee|fees|payment|paid|due/i.test(params.originalMessage || '');
      if (isFee) {
        const feeRecords = await dbClient.getStudentFees({ studentCode });
        if (feeRecords.length > 0) {
          const f = feeRecords[0].summary;
          const feeReportData: ReportData = {
            reportType: 'fees',
            title: 'GRADit! College ERP Fee Report',
            subtitle: `Fee Summary — ${f.studentName} (${f.studentCode})`,
            generatedBy: securityContext.role,
            generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
            metadata: {
              studentName: f.studentName,
              studentCode: f.studentCode,
              className: f.className,
              department: f.departmentName,
            },
            columns: ['Student Name', 'Student Code', 'Class', 'Department', 'Total Fee', 'Paid Amount', 'Status'],
            rows: [
              {
                studentName: f.studentName,
                studentCode: f.studentCode,
                className: f.className,
                department: f.departmentName,
                totalFee: f.totalAmount,
                paidAmount: f.paidAmount,
                status: f.status,
              },
            ],
          };
          return {
            type: 'REPORT_READY',
            content: `Fee report generated for **${f.studentName}** in ${(reportFormat || 'PDF').toUpperCase()} format.`,
            reportMetadata: feeReportData,
          };
        }
      } else {
        const attRecords = await dbClient.getStudentAttendance({ studentCode });
        if (attRecords.length > 0) {
          const att = attRecords[0].summary;
          const attReportData: ReportData = {
            reportType: 'attendance',
            title: 'GRADit! College ERP Attendance Report',
            subtitle: `Attendance Record — ${att.studentName} (${att.studentCode})`,
            generatedBy: securityContext.role,
            generatedDate: new Date().toLocaleDateString('en-US', { dateStyle: 'medium' }),
            metadata: {
              studentName: att.studentName,
              studentCode: att.studentCode,
              className: att.className,
              department: att.departmentName,
            },
            columns: ['Student Name', 'Student Code', 'Class', 'Department', 'Attended', 'Total', 'Percentage'],
            rows: [
              {
                studentName: att.studentName,
                studentCode: att.studentCode,
                className: att.className,
                department: att.departmentName,
                attended: att.attendedClasses,
                total: att.totalClasses,
                percentage: att.percentage / 100,
              },
            ],
          };
          return {
            type: 'REPORT_READY',
            content: `Attendance report generated for **${att.studentName}** in ${(reportFormat || 'PDF').toUpperCase()} format.`,
            reportMetadata: attReportData,
          };
        }
      }
      return { type: 'TEXT', content: `Unable to generate report for ${studentCode}.` };
    }

    default:
      return { type: 'TEXT', content: `Request processed for student ${studentCode}.` };
  }
}

/**
 * Hybrid Execution Engine with Deterministic Layer, Intent Memory, & Two-Stage Hallucination Protection.
 */
export async function runAgentWorkflow(
  userPrompt: string,
  securityContext: SecurityContext,
  lastReportData?: ReportData,
  pendingQuery?: PendingQuery
): Promise<AgentResponse> {
  try {
    const cleanPrompt = userPrompt.trim();

    // 0. Ambiguity Selection Resolution Check
    if (pendingQuery && pendingQuery.candidates && pendingQuery.candidates.length > 0) {
      // Check if user clicked or typed a candidate code, id, or name
      const matchedCandidate = pendingQuery.candidates.find(
        (c) =>
          c.code.toUpperCase() === cleanPrompt.toUpperCase() ||
          c.id === cleanPrompt ||
          c.name.toLowerCase() === cleanPrompt.toLowerCase()
      );

      if (matchedCandidate) {
        return executeIntent({
          intent: pendingQuery.intent,
          studentCode: matchedCandidate.code,
          securityContext,
          originalMessage: pendingQuery.originalMessage,
          reportFormat: pendingQuery.reportFormat,
        });
      }

      // Check if user entered just a student code e.g. "MCA23027" or "BCA23001"
      if (/^[A-Z0-9_-]+$/i.test(cleanPrompt)) {
        const students = await dbClient.findStudents({ studentCode: cleanPrompt });
        if (students.length > 0) {
          return executeIntent({
            intent: pendingQuery.intent,
            studentCode: students[0].student_code,
            securityContext,
            originalMessage: pendingQuery.originalMessage,
            reportFormat: pendingQuery.reportFormat,
          });
        }
      }
    }

    // 1. Stage 1: Deterministic Query Classification & Normalization
    const erpQuery = DeterministicQueryClassifier.classify(userPrompt);

    // 2. Stage 1 Validation & RBAC Check
    const validation = QueryValidator.validate(erpQuery, securityContext);
    if (!validation.valid) {
      return {
        type: 'ERROR',
        content: validation.reason || "Access Denied: You don't have permission to access this information.",
      };
    }

    // 3. High-Confidence Deterministic Execution (Confidence >= 0.70)
    if (erpQuery.confidence >= 0.70) {
      const response = await executeDeterministicQuery(erpQuery, securityContext, lastReportData);

      // Stage 2 Validation: Result & Hallucination Guard
      if (response.reportMetadata) {
        const check = ResultValidator.validateAnswer(response.content, response.reportMetadata);
        if (!check.passed) {
          return response;
        }
      }
      return response;
    }

    // 4. Low-Confidence Fallback Execution
    const fallbackResponse = await executeDeterministicQuery(erpQuery, securityContext, lastReportData);
    return fallbackResponse;
  } catch (err: any) {
    return {
      type: 'ERROR',
      content: `DATABASE_ERROR: ${err.message || "I couldn't retrieve the information right now. Please try again."}`,
    };
  }
}

async function buildCandidates(matches: Student[]) {
  return Promise.all(
    matches.map(async (s) => {
      const deptObj = await dbClient.getDepartmentByCodeOrId(s.department_id);
      const classObj = await dbClient.getClassByCodeOrId(s.class_id);
      return {
        id: s.id,
        code: s.student_code,
        name: s.name,
        class: classObj ? classObj.name : formatClassName(s.class_id),
        dept: deptObj ? deptObj.name : formatDepartmentName(s.department_id),
      };
    })
  );
}

async function executeDeterministicQuery(
  erpQuery: any,
  securityContext: SecurityContext,
  lastReportData?: ReportData
): Promise<AgentResponse> {
  const { intent, studentId, studentName, classId, department, threshold, reportFormat } = erpQuery;

  // Report Generation & Export Handler
  if (intent === 'REPORT_REQUEST') {
    if (studentId || studentName) {
      const targetQuery = studentId || studentName!;
      const result = await resolveStudentEntity(targetQuery);
      if (result.type === 'MULTIPLE_STUDENTS') {
        const candidates = await buildCandidates(result.matches);
        return {
          type: 'CLARIFICATION',
          content: result.message,
          matches: candidates,
          pendingQuery: {
            intent: 'REPORT',
            originalMessage: erpQuery.originalQuery,
            entity: targetQuery,
            candidates,
            reportFormat,
          },
        };
      }
      if (result.type === 'NOT_FOUND') {
        return { type: 'TEXT', content: result.message };
      }
      if (result.type === 'SINGLE_STUDENT') {
        return executeIntent({
          intent: 'REPORT',
          studentCode: result.data.student_code,
          securityContext,
          originalMessage: erpQuery.originalQuery,
          reportFormat,
        });
      }
    }

    if (department) {
      const isFee = /fee|fees|payment/i.test(erpQuery.originalQuery);
      const reportTitle = `${formatDepartmentName(department)} ${isFee ? 'Fee' : 'Attendance'} Report`;
      const deptReportData: ReportData = {
        title: reportTitle,
        generatedBy: securityContext.role,
        generatedDate: new Date().toLocaleDateString(),
        columns: ['Metric', 'Department', 'Status'],
        rows: [['Summary', formatDepartmentName(department), 'Active']],
      };
      return {
        type: 'REPORT_READY',
        content: `Report generated for **${formatDepartmentName(department)}** in ${(reportFormat || 'PDF').toUpperCase()} format.`,
        reportMetadata: deptReportData,
      };
    }

    if (!lastReportData) {
      return {
        type: 'TEXT',
        content: 'No prior report data available to generate a download. Please request student attendance or fees first.',
      };
    }
    return {
      type: 'REPORT_READY',
      content: `Report ready for download in ${(reportFormat || 'PDF').toUpperCase()} format.`,
      reportMetadata: lastReportData,
    };
  }

  switch (intent) {
    case 'STUDENT_DETAILS':
    case 'STUDENT_SEARCH': {
      const queryStr = studentId || studentName || erpQuery.originalQuery;
      const result = await resolveStudentEntity(queryStr);

      if (result.type === 'NOT_FOUND') {
        const cls = await dbClient.getClassByCodeOrId(queryStr);
        if (cls) {
          return executeDeterministicQuery(
            { ...erpQuery, intent: 'STUDENTS_LIST', classId: cls.code },
            securityContext,
            lastReportData
          );
        }
        return { type: 'TEXT', content: `I couldn't find a student or subject matching '${queryStr}'.` };
      }
      if (result.type === 'MULTIPLE_STUDENTS') {
        const candidates = await buildCandidates(result.matches);
        return {
          type: 'CLARIFICATION',
          content: result.message,
          matches: candidates,
          pendingQuery: {
            intent: 'STUDENT_DETAILS',
            originalMessage: erpQuery.originalQuery,
            entity: queryStr,
            candidates,
          },
        };
      }
      if (result.type === 'SINGLE_STUDENT') {
        return executeIntent({
          intent: 'STUDENT_DETAILS',
          studentCode: result.data.student_code,
          securityContext,
          originalMessage: erpQuery.originalQuery,
        });
      }
      return { type: 'TEXT', content: `I couldn't find a student matching '${queryStr}'.` };
    }

    case 'ATTENDANCE_STUDENT': {
      const targetQuery = studentId || studentName;
      if (!targetQuery) {
        return { type: 'TEXT', content: 'Please provide a student name or student ID to check attendance.' };
      }

      const result = await resolveStudentEntity(targetQuery);
      if (result.type === 'NOT_FOUND') {
        const cls = await dbClient.getClassByCodeOrId(targetQuery);
        if (cls) {
          return executeDeterministicQuery(
            { ...erpQuery, intent: 'ATTENDANCE_CLASS', classId: cls.code },
            securityContext,
            lastReportData
          );
        }
        return { type: 'TEXT', content: `I couldn't find a student or subject matching '${targetQuery}'.` };
      }
      if (result.type === 'MULTIPLE_STUDENTS') {
        const candidates = await buildCandidates(result.matches);
        return {
          type: 'CLARIFICATION',
          content: result.message,
          matches: candidates,
          pendingQuery: {
            intent: 'ATTENDANCE',
            originalMessage: erpQuery.originalQuery,
            entity: targetQuery,
            candidates,
          },
        };
      }
      if (result.type === 'SINGLE_STUDENT') {
        return executeIntent({
          intent: 'ATTENDANCE',
          studentCode: result.data.student_code,
          securityContext,
          originalMessage: erpQuery.originalQuery,
        });
      }
      return { type: 'TEXT', content: `I couldn't find a student or subject matching '${targetQuery}'.` };
    }

    case 'ATTENDANCE_CLASS': {
      const cls = classId ? await dbClient.getClassByCodeOrId(classId) : null;
      const title = cls ? `Attendance — Class ${formatClassName(cls.code)}` : 'Class Attendance';
      let classStudents = cls ? await dbClient.findStudents({ classId: cls.id }) : [];
      if (classStudents.length === 0 && cls?.department_id) {
        classStudents = await dbClient.findStudents({ departmentId: cls.department_id });
      }
      if (classStudents.length === 0) {
        classStudents = await dbClient.findStudents({});
      }

      const attResults = await Promise.all(
        classStudents.map((student) => dbClient.getStudentAttendance({ studentId: student.id }))
      );
      const summaries: StudentAttendanceSummary[] = [];
      for (const att of attResults) {
        if (att.length > 0) summaries.push(att[0].summary);
      }

      return DeterministicFormatter.formatAttendanceList(title, summaries, securityContext.role);
    }

    case 'ATTENDANCE_DEPARTMENT': {
      if (!department) {
        return { type: 'TEXT', content: 'Please specify a department (e.g. CSE, ECE, MECH).' };
      }
      const result = await getDepartmentAttendanceTool({ departmentIdentifier: department }, securityContext);
      if (result.type === 'LIST') {
        return DeterministicFormatter.formatAttendanceList(`Attendance — ${formatDepartmentName(department)} Department`, result.data, securityContext.role);
      }
      return { type: 'TEXT', content: 'Unable to retrieve department attendance.' };
    }

    case 'LOW_ATTENDANCE': {
      const result = await getLowAttendanceStudentsTool({ threshold, departmentIdentifier: department }, securityContext);
      if (result.type === 'LIST') {
        return DeterministicFormatter.formatAttendanceList(result.title, result.data, securityContext.role);
      }
      return { type: 'TEXT', content: 'Unable to retrieve low attendance list.' };
    }

    case 'FEES_STUDENT': {
      const targetQuery = studentId || studentName;
      if (!targetQuery) {
        return { type: 'TEXT', content: 'Please provide a student name or student ID to check fees.' };
      }

      const result = await resolveStudentEntity(targetQuery);
      if (result.type === 'NOT_FOUND') {
        return { type: 'TEXT', content: result.message };
      }
      if (result.type === 'MULTIPLE_STUDENTS') {
        const candidates = await buildCandidates(result.matches);
        return {
          type: 'CLARIFICATION',
          content: result.message,
          matches: candidates,
          pendingQuery: {
            intent: 'FEES',
            originalMessage: erpQuery.originalQuery,
            entity: targetQuery,
            candidates,
          },
        };
      }
      if (result.type === 'SINGLE_STUDENT') {
        return executeIntent({
          intent: 'FEES',
          studentCode: result.data.student_code,
          securityContext,
          originalMessage: erpQuery.originalQuery,
        });
      }
      return { type: 'TEXT', content: 'Unable to retrieve fee record.' };
    }

    case 'FEES_CLASS': {
      const cls = classId ? await dbClient.getClassByCodeOrId(classId) : null;
      const title = cls ? `Fee Details — Class ${cls.code}` : 'Class Fee Details';
      let classStudents = cls ? await dbClient.findStudents({ classId: cls.id }) : [];
      if (classStudents.length === 0 && cls?.department_id) {
        classStudents = await dbClient.findStudents({ departmentId: cls.department_id });
      }
      if (classStudents.length === 0) {
        classStudents = await dbClient.findStudents({});
      }

      const feeResults = await Promise.all(
        classStudents.map((student) => dbClient.getStudentFees({ studentId: student.id }))
      );
      const summaries: StudentFeeSummary[] = [];
      for (const fees of feeResults) {
        if (fees.length > 0) summaries.push(fees[0].summary);
      }

      return DeterministicFormatter.formatFeeList(title, summaries, securityContext.role);
    }

    case 'FEES_DEPARTMENT': {
      if (!department) {
        return { type: 'TEXT', content: 'Please specify a department (e.g. CSE, ECE, MECH).' };
      }
      const dept = await dbClient.getDepartmentByCodeOrId(department);
      if (!dept) {
        return { type: 'TEXT', content: `Department '${department}' not found.` };
      }

      const deptStudents = await dbClient.findStudents({ departmentId: dept.id });
      const summaries: StudentFeeSummary[] = [];
      for (const student of deptStudents) {
        const fees = await dbClient.getStudentFees({ studentId: student.id });
        if (fees.length > 0) summaries.push(fees[0].summary);
      }

      return DeterministicFormatter.formatFeeList(`Fee Details — ${dept.code} Department`, summaries, securityContext.role);
    }

    case 'PENDING_FEES': {
      const targetStudentQuery = studentId || studentName;
      if (targetStudentQuery) {
        const result = await resolveStudentEntity(targetStudentQuery);
        if (result.type === 'NOT_FOUND') {
          return { type: 'TEXT', content: result.message };
        }
        if (result.type === 'MULTIPLE_STUDENTS') {
          const candidates = result.matches.map((s) => ({
            id: s.id,
            code: s.student_code,
            name: s.name,
            class: formatClassName(s.class_id),
            dept: formatDepartmentName(s.department_id),
          }));
          return {
            type: 'CLARIFICATION',
            content: result.message,
            matches: candidates,
            pendingQuery: {
              intent: 'FEES',
              originalMessage: erpQuery.originalQuery,
              entity: targetStudentQuery,
              candidates,
            },
          };
        }
        if (result.type === 'SINGLE_STUDENT') {
          return executeIntent({
            intent: 'FEES',
            studentCode: result.data.student_code,
            securityContext,
            originalMessage: erpQuery.originalQuery,
          });
        }
      }

      const result = await getPendingFeesTool({ departmentIdentifier: department }, securityContext);
      if (result.type === 'LIST') {
        return DeterministicFormatter.formatFeeList(result.title, result.data, securityContext.role);
      }
      return { type: 'TEXT', content: 'Unable to retrieve pending fee list.' };
    }

    case 'STUDENTS_LIST': {
      let students: Student[] = [];
      let departmentName = '';

      if (classId) {
        const result = await getStudentsByClassTool(classId, securityContext);
        if (result.type === 'LIST') {
          students = result.data;
          departmentName = `Class ${formatClassName(classId)}`;
        }
      } else if (department) {
        const dept = await dbClient.getDepartmentByCodeOrId(department);
        if (dept) {
          students = await dbClient.findStudents({ departmentId: dept.id });
          departmentName = `${formatDepartmentName(dept.code)} Department`;
        }
      } else {
        students = await dbClient.findStudents({});
        departmentName = 'all departments';
      }

      if (students.length === 0) {
        return { type: 'TEXT', content: 'No students found matching your request.' };
      }

      const rows = students.map((s) => [s.name, s.student_code, formatClassName(s.class_id), formatDepartmentName(s.department_id)]);
      const reportData: ReportData = {
        title: `Student Directory — ${departmentName}`,
        generatedBy: securityContext.role,
        generatedAt: new Date().toLocaleDateString(),
        columns: ['Student Name', 'Student Code', 'Class', 'Department'],
        rows,
      };

      return {
        type: 'TEXT',
        content: `Found **${students.length}** students in ${departmentName}:`,
        tableData: { columns: reportData.columns, rows },
        reportMetadata: reportData,
      };
    }

    case 'BARE_ENTITY': {
      const targetQuery = studentId || studentName || erpQuery.originalQuery;
      const result = await resolveStudentEntity(targetQuery);
      if (result.type === 'NOT_FOUND') {
        return { type: 'TEXT', content: result.message };
      }
      if (result.type === 'MULTIPLE_STUDENTS') {
        const candidates = result.matches.map((s) => ({
          id: s.id,
          code: s.student_code,
          name: s.name,
          class: formatClassName(s.class_id),
          dept: formatDepartmentName(s.department_id),
        }));
        return {
          type: 'CLARIFICATION',
          content: result.message,
          matches: candidates,
          pendingQuery: {
            intent: 'STUDENT_DETAILS',
            originalMessage: erpQuery.originalQuery,
            entity: targetQuery,
            candidates,
          },
        };
      }
      if (result.type === 'SINGLE_STUDENT') {
        return executeIntent({
          intent: 'STUDENT_DETAILS',
          studentCode: result.data.student_code,
          securityContext,
          originalMessage: erpQuery.originalQuery,
        });
      }
      return {
        type: 'CLARIFICATION',
        content: `What would you like to know about ${targetQuery} — attendance, fees, or student details?`,
      };
    }

    case 'MULTI_INTENT': {
      return {
        type: 'CLARIFICATION',
        content: 'I can retrieve those records separately. Would you like attendance first or fees?',
      };
    }

    default:
      return {
        type: 'TEXT',
        content: "I can help with attendance, fees, student details, class information, department information, and reports. Please refine your query.",
      };
  }
}
