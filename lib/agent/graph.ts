import { SecurityContext } from '../tools/rbac';
import { DeterministicQueryClassifier } from '../query-understanding/classifier';
import { QueryValidator } from '../validation/queryValidator';
import { DeterministicFormatter, DeterministicResponse } from '../validation/deterministicFormatter';
import { ResultValidator } from '../validation/resultValidator';
import {
  getStudentAttendanceTool,
  getClassAttendanceTool,
  getDepartmentAttendanceTool,
  getLowAttendanceStudentsTool,
} from '../tools/attendance';
import { getStudentFeesTool, getPendingFeesTool } from '../tools/fees';
import { findStudentTool, getStudentsByClassTool } from '../tools/students';
import { dbClient } from '../db/client';
import { Student, StudentFeeSummary } from '../db/types';
import { ReportData } from '../reports/pdf';

export interface AgentResponse extends DeterministicResponse {}

/**
 * Hybrid Execution Engine with Deterministic Layer & Two-Stage Hallucination Protection.
 */
export async function runAgentWorkflow(
  userPrompt: string,
  securityContext: SecurityContext,
  lastReportData?: ReportData
): Promise<AgentResponse> {
  try {
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

async function executeDeterministicQuery(
  erpQuery: any,
  securityContext: SecurityContext,
  lastReportData?: ReportData
): Promise<AgentResponse> {
  const { intent, studentId, studentName, classId, department, threshold, reportFormat } = erpQuery;

  // Handle Report Requests
  if (intent === 'REPORT_REQUEST') {
    if (!lastReportData) {
      return {
        type: 'ERROR',
        content: 'No active report data available. Please perform an attendance, fees, or student lookup query first.',
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
      const result = await findStudentTool({ query: queryStr }, securityContext);

      if (result.type === 'NOT_FOUND') {
        return { type: 'TEXT', content: result.message };
      }
      if (result.type === 'MULTIPLE_STUDENTS') {
        return {
          type: 'CLARIFICATION',
          content: `I found multiple students matching '${queryStr}'. Please select the specific student ID, class, or department:`,
          matches: result.matches.map((s) => ({ id: s.id, code: s.student_code, name: s.name, class: s.class_id, dept: s.department_id })),
        };
      }
      if (result.type === 'SINGLE_STUDENT') {
        const s = result.data;
        let prefix = '';
        if (result.matchType === 'FUZZY' && result.fuzzySuggestedName) {
          prefix = `I think you mean **${result.fuzzySuggestedName}**. Here are ${result.fuzzySuggestedName}'s details:\n\n`;
        }

        const reportData: ReportData = {
          title: `Student Profile — ${s.name} (${s.student_code})`,
          generatedBy: securityContext.role,
          generatedAt: new Date().toLocaleDateString(),
          columns: ['Student Name', 'Student Code', 'Class ID', 'Department ID'],
          rows: [[s.name, s.student_code, s.class_id, s.department_id]],
        };

        return {
          type: 'TEXT',
          content: `${prefix}Student Profile for **${s.name}**:\n- **Student Code**: ${s.student_code}\n- **Class ID**: ${s.class_id}\n- **Department ID**: ${s.department_id}`,
          tableData: { columns: reportData.columns, rows: reportData.rows },
          reportMetadata: reportData,
        };
      }
      return { type: 'TEXT', content: "I couldn't find a student matching that name. Please check the name or provide the student ID." };
    }

    case 'ATTENDANCE_STUDENT': {
      const params = { studentCode: studentId, studentName };
      const result = await getStudentAttendanceTool(params, securityContext);

      if (result.type === 'NOT_FOUND') {
        return { type: 'TEXT', content: result.message };
      }
      if (result.type === 'AMBIGUOUS_STUDENTS') {
        return {
          type: 'CLARIFICATION',
          content: `I found ${result.count} students matching '${studentName || studentId}'. Please select the specific student ID or class:`,
          matches: result.matches,
        };
      }
      if (result.type === 'SINGLE_STUDENT') {
        return DeterministicFormatter.formatSingleAttendance(result.data, securityContext.role);
      }
      return { type: 'TEXT', content: 'Attendance record format unsupported.' };
    }

    case 'ATTENDANCE_CLASS': {
      if (!classId) {
        return { type: 'TEXT', content: 'Please provide a valid class code (e.g., 23CS101).' };
      }
      const result = await getClassAttendanceTool({ classIdentifier: classId }, securityContext);
      if (result.type === 'LIST') {
        return DeterministicFormatter.formatAttendanceList(result.title, result.data, securityContext.role);
      }
      return { type: 'TEXT', content: 'Unable to retrieve class attendance.' };
    }

    case 'ATTENDANCE_DEPARTMENT': {
      if (!department) {
        return { type: 'TEXT', content: 'Please specify a department (e.g. CSE, ECE, MECH).' };
      }
      const result = await getDepartmentAttendanceTool({ departmentIdentifier: department }, securityContext);
      if (result.type === 'LIST') {
        return DeterministicFormatter.formatAttendanceList(`Attendance — ${department} Department`, result.data, securityContext.role);
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
      const params = { studentCode: studentId, studentName };
      const result = await getStudentFeesTool(params, securityContext);

      if (result.type === 'NOT_FOUND') {
        return { type: 'TEXT', content: result.message };
      }
      if (result.type === 'AMBIGUOUS_STUDENTS') {
        return {
          type: 'CLARIFICATION',
          content: `Multiple students found. Please select student ID:`,
          matches: result.matches,
        };
      }
      if (result.type === 'SINGLE_STUDENT_FEE') {
        return DeterministicFormatter.formatSingleFee(result.data, securityContext.role);
      }
      return { type: 'TEXT', content: 'Unable to retrieve fee record.' };
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
          departmentName = `Class ${classId}`;
        }
      } else if (department) {
        const dept = await dbClient.getDepartmentByCodeOrId(department);
        if (dept) {
          students = await dbClient.findStudents({ departmentId: dept.id });
          departmentName = `${dept.code} Department`;
        }
      } else {
        students = await dbClient.findStudents({});
        departmentName = 'all departments';
      }

      if (students.length === 0) {
        return { type: 'TEXT', content: 'No students found matching your request.' };
      }

      const rows = students.map((s) => [s.name, s.student_code, s.class_id, s.department_id]);
      const reportData: ReportData = {
        title: `Student Directory — ${departmentName}`,
        generatedBy: securityContext.role,
        generatedAt: new Date().toLocaleDateString(),
        columns: ['Student Name', 'Student Code', 'Class ID', 'Department ID'],
        rows,
      };

      return {
        type: 'TEXT',
        content: `Found **${students.length}** students in ${departmentName}:`,
        tableData: { columns: reportData.columns, rows: reportData.rows },
        reportMetadata: reportData,
      };
    }

    default:
      return {
        type: 'TEXT',
        content: "I can help with attendance, fees, student details, class information, department information, and reports. Please refine your query.",
      };
  }
}
