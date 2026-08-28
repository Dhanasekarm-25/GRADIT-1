import { describe, it, expect } from 'vitest';
import { getStudentAttendanceTool, getLowAttendanceStudentsTool } from '../../lib/tools/attendance';
import { getStudentFeesTool, getPendingFeesTool } from '../../lib/tools/fees';
import { findStudentTool } from '../../lib/tools/students';
import { SecurityContext } from '../../lib/tools/rbac';

const facultyContext: SecurityContext = { userId: 'usr-1', role: 'FACULTY' };
const adminContext: SecurityContext = { userId: 'usr-2', role: 'ADMIN' };
const studentContext: SecurityContext = { userId: 'usr-3', role: 'STUDENT' };

describe('Attendance Tools', () => {
  it('should fetch single student attendance for valid code (23CS101)', async () => {
    const result = await getStudentAttendanceTool({ studentCode: '23CS101' }, facultyContext);
    expect(result.type).toBe('SINGLE_STUDENT');
    if (result.type === 'SINGLE_STUDENT') {
      expect(result.data.studentCode).toBe('23CS101');
      expect(result.data.percentage).toBe(82);
    }
  });

  it('should handle duplicate student names (Arun Kumar) with ambiguity flag', async () => {
    const result = await getStudentAttendanceTool({ studentName: 'Arun' }, facultyContext);
    expect(result.type).toBe('AMBIGUOUS_STUDENTS');
    if (result.type === 'AMBIGUOUS_STUDENTS') {
      expect(result.count).toBeGreaterThan(1);
    }
  });

  it('should list low attendance students below 75%', async () => {
    const result = await getLowAttendanceStudentsTool({ threshold: 75 }, adminContext);
    expect(result.type).toBe('LIST');
    if (result.type === 'LIST') {
      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((s) => expect(s.percentage).toBeLessThan(75));
    }
  });
});

describe('Fees Tools', () => {
  it('should fetch student fee status correctly', async () => {
    const result = await getStudentFeesTool({ studentCode: '23CS101' }, facultyContext);
    expect(result.type).toBe('SINGLE_STUDENT_FEE');
    if (result.type === 'SINGLE_STUDENT_FEE') {
      expect(result.data.status).toBe('PAID');
      expect(result.data.pendingAmount).toBe(0);
    }
  });

  it('should list pending fee records', async () => {
    const result = await getPendingFeesTool({}, adminContext);
    expect(result.type).toBe('LIST');
    if (result.type === 'LIST') {
      expect(result.data.length).toBeGreaterThan(0);
    }
  });
});

describe('Student Lookup Tools', () => {
  it('should find student by exact code', async () => {
    const result = await findStudentTool({ query: '23CS101' }, facultyContext);
    expect(result.type).toBe('SINGLE_STUDENT');
    if (result.type === 'SINGLE_STUDENT') {
      expect(result.data.name).toBe('Rohan Sharma');
    }
  });
});
