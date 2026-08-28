import {
  SEED_USERS,
  SEED_DEPARTMENTS,
  SEED_CLASSES,
  SEED_STUDENTS,
  SEED_ATTENDANCE,
  SEED_FEES,
} from './seedData';
import {
  Student,
  Department,
  Class,
  User,
  StudentAttendanceSummary,
  StudentFeeSummary,
} from './types';

/**
 * Clean parameterized Database Abstraction Layer.
 * Guarantees zero raw user-controlled SQL execution.
 */
export class DatabaseClient {
  private users = [...SEED_USERS];
  private departments = [...SEED_DEPARTMENTS];
  private classes = [...SEED_CLASSES];
  private students = [...SEED_STUDENTS];
  private attendance = [...SEED_ATTENDANCE];
  private fees = [...SEED_FEES];

  // User & Auth queries
  public async getUserById(userId: string): Promise<User | null> {
    return this.users.find((u) => u.id === userId) || null;
  }

  // Student Queries
  public async findStudents(query: {
    studentId?: string;
    studentCode?: string;
    studentName?: string;
    classId?: string;
    departmentId?: string;
    limit?: number;
  }): Promise<Student[]> {
    let result = [...this.students];

    if (query.studentId) {
      result = result.filter((s) => s.id === query.studentId);
    }
    if (query.studentCode) {
      const codeUpper = query.studentCode.trim().toUpperCase();
      result = result.filter((s) => s.student_code.toUpperCase() === codeUpper);
    }
    if (query.studentName) {
      const nameClean = query.studentName.trim().toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(nameClean));
    }
    if (query.classId) {
      result = result.filter((s) => s.class_id === query.classId);
    }
    if (query.departmentId) {
      result = result.filter((s) => s.department_id === query.departmentId);
    }

    const limit = query.limit || 50;
    return result.slice(0, limit);
  }

  public async getDepartmentByCodeOrId(identifier: string): Promise<Department | null> {
    const clean = identifier.trim().toLowerCase();
    return (
      this.departments.find(
        (d) => d.id === identifier || d.code.toLowerCase() === clean || d.name.toLowerCase().includes(clean)
      ) || null
    );
  }

  public async getClassByCodeOrId(identifier: string): Promise<Class | null> {
    const clean = identifier.trim().toLowerCase();
    return (
      this.classes.find(
        (c) => c.id === identifier || c.code.toLowerCase() === clean || c.name.toLowerCase().includes(clean)
      ) || null
    );
  }

  // Attendance Tools
  public async getStudentAttendance(params: {
    studentId?: string;
    studentCode?: string;
    studentName?: string;
    semester?: string;
    academicYear?: string;
  }): Promise<{ student: Student; summary: StudentAttendanceSummary }[]> {
    const matchedStudents = await this.findStudents({
      studentId: params.studentId,
      studentCode: params.studentCode,
      studentName: params.studentName,
    });

    const results: { student: Student; summary: StudentAttendanceSummary }[] = [];

    for (const student of matchedStudents) {
      const records = this.attendance.filter((a) => {
        let match = a.student_id === student.id;
        if (params.semester) match = match && a.semester.toLowerCase() === params.semester.toLowerCase();
        if (params.academicYear) match = match && a.academic_year === params.academicYear;
        return match;
      });

      const totalClasses = records.length;
      const attendedClasses = records.filter((r) => r.status === 'PRESENT').length;
      const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      const cls = this.classes.find((c) => c.id === student.class_id);
      const dept = this.departments.find((d) => d.id === student.department_id);

      results.push({
        student,
        summary: {
          studentId: student.id,
          studentCode: student.student_code,
          studentName: student.name,
          className: cls?.code || 'N/A',
          departmentName: dept?.code || 'N/A',
          totalClasses,
          attendedClasses,
          percentage,
          semester: params.semester || 'S3',
          academicYear: params.academicYear || '2025-2026',
        },
      });
    }

    return results;
  }

  public async getClassAttendance(params: {
    classIdentifier: string;
    semester?: string;
    academicYear?: string;
  }): Promise<{ classInfo: Class; summaries: StudentAttendanceSummary[] }> {
    const cls = await this.getClassByCodeOrId(params.classIdentifier);
    if (!cls) {
      throw new Error(`Class '${params.classIdentifier}' not found.`);
    }

    const classStudents = await this.findStudents({ classId: cls.id });
    const summaries: StudentAttendanceSummary[] = [];

    for (const student of classStudents) {
      const studentAtt = await this.getStudentAttendance({
        studentId: student.id,
        semester: params.semester,
        academicYear: params.academicYear,
      });
      if (studentAtt.length > 0) {
        summaries.push(studentAtt[0].summary);
      }
    }

    return { classInfo: cls, summaries };
  }

  public async getDepartmentAttendance(params: {
    departmentIdentifier: string;
    semester?: string;
    academicYear?: string;
  }): Promise<{ departmentInfo: Department; summaries: StudentAttendanceSummary[] }> {
    const dept = await this.getDepartmentByCodeOrId(params.departmentIdentifier);
    if (!dept) {
      throw new Error(`Department '${params.departmentIdentifier}' not found.`);
    }

    const deptStudents = await this.findStudents({ departmentId: dept.id });
    const summaries: StudentAttendanceSummary[] = [];

    for (const student of deptStudents) {
      const studentAtt = await this.getStudentAttendance({
        studentId: student.id,
        semester: params.semester,
        academicYear: params.academicYear,
      });
      if (studentAtt.length > 0) {
        summaries.push(studentAtt[0].summary);
      }
    }

    return { departmentInfo: dept, summaries };
  }

  public async getLowAttendanceStudents(params: {
    departmentIdentifier?: string;
    classIdentifier?: string;
    threshold?: number; // e.g. 75
    semester?: string;
    academicYear?: string;
  }): Promise<StudentAttendanceSummary[]> {
    const threshold = params.threshold ?? 75;
    let studentsToFetch: Student[] = [];

    if (params.classIdentifier) {
      const cls = await this.getClassByCodeOrId(params.classIdentifier);
      if (cls) {
        studentsToFetch = await this.findStudents({ classId: cls.id });
      }
    } else if (params.departmentIdentifier) {
      const dept = await this.getDepartmentByCodeOrId(params.departmentIdentifier);
      if (dept) {
        studentsToFetch = await this.findStudents({ departmentId: dept.id });
      }
    } else {
      studentsToFetch = [...this.students];
    }

    const lowAttendanceList: StudentAttendanceSummary[] = [];

    for (const student of studentsToFetch) {
      const studentAtt = await this.getStudentAttendance({
        studentId: student.id,
        semester: params.semester,
        academicYear: params.academicYear,
      });
      if (studentAtt.length > 0 && studentAtt[0].summary.percentage < threshold) {
        lowAttendanceList.push(studentAtt[0].summary);
      }
    }

    return lowAttendanceList;
  }

  // Fees Tools
  public async getStudentFees(params: {
    studentId?: string;
    studentCode?: string;
    studentName?: string;
    status?: 'PAID' | 'PENDING' | 'PARTIAL';
    semester?: string;
    academicYear?: string;
  }): Promise<{ student: Student; summary: StudentFeeSummary }[]> {
    const matchedStudents = await this.findStudents({
      studentId: params.studentId,
      studentCode: params.studentCode,
      studentName: params.studentName,
    });

    const results: { student: Student; summary: StudentFeeSummary }[] = [];

    for (const student of matchedStudents) {
      const feeRecords = this.fees.filter((f) => {
        let match = f.student_id === student.id;
        if (params.status) match = match && f.status === params.status;
        if (params.semester) match = match && f.semester.toLowerCase() === params.semester.toLowerCase();
        if (params.academicYear) match = match && f.academic_year === params.academicYear;
        return match;
      });

      const totalAmount = feeRecords.reduce((sum, f) => sum + f.amount, 0);
      const paidAmount = feeRecords.reduce((sum, f) => sum + f.paid_amount, 0);
      const pendingAmount = totalAmount - paidAmount;

      let feeStatus: 'PAID' | 'PENDING' | 'PARTIAL' = 'PAID';
      if (pendingAmount > 0 && paidAmount > 0) feeStatus = 'PARTIAL';
      else if (pendingAmount > 0 && paidAmount === 0) feeStatus = 'PENDING';

      const cls = this.classes.find((c) => c.id === student.class_id);
      const dept = this.departments.find((d) => d.id === student.department_id);

      results.push({
        student,
        summary: {
          studentId: student.id,
          studentCode: student.student_code,
          studentName: student.name,
          className: cls?.code || 'N/A',
          departmentName: dept?.code || 'N/A',
          totalAmount,
          paidAmount,
          pendingAmount,
          status: feeStatus,
          semester: params.semester || 'S3',
          academicYear: params.academicYear || '2025-2026',
        },
      });
    }

    return results;
  }

  public async getPendingFees(params: {
    departmentIdentifier?: string;
    classIdentifier?: string;
    semester?: string;
    academicYear?: string;
  }): Promise<StudentFeeSummary[]> {
    let studentsToFetch: Student[] = [];

    if (params.classIdentifier) {
      const cls = await this.getClassByCodeOrId(params.classIdentifier);
      if (cls) studentsToFetch = await this.findStudents({ classId: cls.id });
    } else if (params.departmentIdentifier) {
      const dept = await this.getDepartmentByCodeOrId(params.departmentIdentifier);
      if (dept) studentsToFetch = await this.findStudents({ departmentId: dept.id });
    } else {
      studentsToFetch = [...this.students];
    }

    const pendingList: StudentFeeSummary[] = [];

    for (const student of studentsToFetch) {
      const studentFee = await this.getStudentFees({
        studentId: student.id,
        semester: params.semester,
        academicYear: params.academicYear,
      });
      if (studentFee.length > 0 && studentFee[0].summary.pendingAmount > 0) {
        pendingList.push(studentFee[0].summary);
      }
    }

    return pendingList;
  }
}

export const dbClient = new DatabaseClient();
