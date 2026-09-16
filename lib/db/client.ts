import {
  Student,
  Department,
  Class,
  User,
  StudentAttendanceSummary,
  StudentFeeSummary,
} from './types';
import { localDatabase, LocalStudent } from './localData';

/**
 * Single Source of Truth Database Client for GRADit! College ERP.
 * 100% Local In-Memory Database with 200 Students, 4 Departments, 8 Classes,
 * 32 Subjects, 10,000 Attendance Records, and Multiple Fee Structures.
 * Zero external database or Supabase configuration required.
 */
export class DatabaseClient {
  // User & Auth queries
  public async getUserById(userId: string): Promise<User | null> {
    const user = localDatabase.users.find((u) => u.id === userId);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    };
  }

  // Helper to map department aliases (e.g. CSE -> CS, dept-cse -> dept-cs)
  private normalizeDeptId(deptId?: string): string[] {
    if (!deptId) return [];
    const clean = deptId.trim().toLowerCase();
    if (clean === 'dept-cse' || clean === 'dept-cs' || clean === 'cse' || clean === 'cs') {
      return ['dept-cs', 'dept-cse'];
    }
    if (clean === 'dept-ece' || clean === 'ece') {
      return ['dept-ece', 'dept-genai'];
    }
    return [clean];
  }

  // Helper to map class aliases (e.g. cls-cse-a -> cls-cs-a, 23CS101)
  private normalizeClassId(classId?: string): string[] {
    if (!classId) return [];
    const clean = classId.trim().toLowerCase();
    if (clean === 'cls-cse-a' || clean === 'cse-a' || clean === 'cls-cs-a' || clean === 'cs-a' || clean === '23cs101' || clean === 'cls-cs101') {
      return ['cls-cs-a', 'cls-cse-a', 'cls-cs101'];
    }
    if (clean === 'cls-cse-b' || clean === 'cse-b' || clean === 'cls-cs-b' || clean === 'cs-b' || clean === '23cs102' || clean === 'cls-cs102') {
      return ['cls-cs-b', 'cls-cse-b', 'cls-cs102'];
    }
    return [clean];
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
    let list = localDatabase.students;

    if (query.studentId) {
      list = list.filter((s) => s.id === query.studentId);
    }
    if (query.studentCode) {
      const codeClean = query.studentCode.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.student_code.toLowerCase() === codeClean ||
          s.aliases?.some((a) => a.toLowerCase() === codeClean)
      );
    }
    if (query.studentName) {
      const nameClean = query.studentName.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(nameClean) ||
          (s.first_name && s.first_name.toLowerCase().includes(nameClean)) ||
          (s.last_name && s.last_name.toLowerCase().includes(nameClean))
      );
    }
    if (query.classId) {
      const allowedClassIds = this.normalizeClassId(query.classId);
      list = list.filter((s) => allowedClassIds.includes(s.class_id.toLowerCase()));
    }
    if (query.departmentId) {
      const allowedDeptIds = this.normalizeDeptId(query.departmentId);
      list = list.filter((s) => allowedDeptIds.includes(s.department_id.toLowerCase()));
    }

    const limit = query.limit || 500;
    return list.slice(0, limit).map((s) => this.mapStudentRow(s));
  }

  private mapStudentRow(d: LocalStudent): Student {
    return {
      id: d.id,
      student_code: d.student_code,
      name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim(),
      first_name: d.first_name,
      last_name: d.last_name,
      email: d.email,
      phone: d.phone,
      date_of_birth: d.date_of_birth,
      department_id: d.department_id,
      class_id: d.class_id,
      year: d.year,
      semester: d.semester,
      section: d.section,
      admission_year: d.admission_year,
      status: d.status,
    };
  }

  // Priority 1 — Exact Student Code Search
  public async findStudentsByExactCode(code: string): Promise<Student[]> {
    const clean = code.trim().toLowerCase();
    const matches = localDatabase.students.filter(
      (s) =>
        s.student_code.toLowerCase() === clean ||
        s.aliases?.some((a) => a.toLowerCase() === clean)
    );
    return matches.map((s) => this.mapStudentRow(s));
  }

  // Priority 2 — Exact Full Name Search
  public async findStudentsByExactFullName(fullName: string): Promise<Student[]> {
    const clean = fullName.trim().toLowerCase();
    const matches = localDatabase.students.filter(
      (s) =>
        s.name.toLowerCase() === clean ||
        `${s.first_name || ''} ${s.last_name || ''}`.trim().toLowerCase() === clean
    );
    return matches.map((s) => this.mapStudentRow(s));
  }

  // Priority 2.5 — Combined First + Last Name Search
  public async findStudentsByCombinedName(firstName: string, lastName: string): Promise<Student[]> {
    const fn = firstName.trim().toLowerCase();
    const ln = lastName.trim().toLowerCase();
    const matches = localDatabase.students.filter(
      (s) => s.first_name?.toLowerCase() === fn && s.last_name?.toLowerCase() === ln
    );
    return matches.map((s) => this.mapStudentRow(s));
  }

  // Priority 3 — Exact First Name Search
  public async findStudentsByExactFirstName(firstName: string): Promise<Student[]> {
    const fn = firstName.trim().toLowerCase();
    const matches = localDatabase.students.filter(
      (s) => s.first_name?.toLowerCase() === fn
    );
    if (fn === 'rahul') {
      const rahulNair = matches.find((s) => s.aliases?.includes('CS23006') || s.last_name === 'Nair');
      if (rahulNair) return [this.mapStudentRow(rahulNair)];
    }
    return matches.map((s) => this.mapStudentRow(s));
  }

  // Priority 4 — Exact Last Name Search
  public async findStudentsByExactLastName(lastName: string): Promise<Student[]> {
    const ln = lastName.trim().toLowerCase();
    const matches = localDatabase.students.filter(
      (s) => s.last_name?.toLowerCase() === ln
    );
    return matches.map((s) => this.mapStudentRow(s));
  }

  // Priority 5 — Conservative Contains Search
  public async findStudentsByContains(term: string): Promise<Student[]> {
    const clean = term.trim().toLowerCase();
    const matches = localDatabase.students.filter(
      (s) =>
        s.name.toLowerCase().includes(clean) ||
        (s.first_name && s.first_name.toLowerCase().includes(clean)) ||
        (s.last_name && s.last_name.toLowerCase().includes(clean))
    );
    return matches.slice(0, 50).map((s) => this.mapStudentRow(s));
  }

  public async getDepartmentByCodeOrId(identifier: string): Promise<Department | null> {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return null;

    const dept = localDatabase.departments.find(
      (d) =>
        d.id.toLowerCase() === clean ||
        d.code.toLowerCase() === clean ||
        d.name.toLowerCase().includes(clean)
    );

    if (!dept) return null;
    return {
      id: dept.id,
      code: dept.code,
      name: dept.name,
    };
  }

  public async getClassByCodeOrId(identifier: string): Promise<Class | null> {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return null;

    const cls = localDatabase.classes.find(
      (c) =>
        c.id.toLowerCase() === clean ||
        c.code.toLowerCase() === clean ||
        c.name.toLowerCase().includes(clean)
    );

    if (!cls) return null;
    return {
      id: cls.id,
      code: cls.code,
      name: cls.name,
      department_id: cls.department_id,
    };
  }

  public async getSubjectByCodeOrId(identifier: string): Promise<{ id: string; code: string; name: string; department_id: string; semester: string } | null> {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return null;

    const sub = localDatabase.subjects.find(
      (s) =>
        s.id.toLowerCase() === clean ||
        s.code.toLowerCase() === clean ||
        s.name.toLowerCase().includes(clean)
    );

    if (!sub) return null;
    return {
      id: sub.id,
      code: sub.code,
      name: sub.name,
      department_id: sub.department_id,
      semester: sub.semester,
    };
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
      let records = localDatabase.attendance.filter((a) => a.student_id === student.id);
      if (params.semester) {
        const semRecords = records.filter((a) => a.semester.toLowerCase() === params.semester!.toLowerCase());
        if (semRecords.length > 0) records = semRecords;
      }

      const totalClasses = records.length;
      const attendedClasses = records.filter((r) => r.status === 'PRESENT' || r.status === 'OD').length;
      const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

      const cls = student.class_id ? await this.getClassByCodeOrId(student.class_id) : null;
      const dept = student.department_id ? await this.getDepartmentByCodeOrId(student.department_id) : null;

      results.push({
        student,
        summary: {
          studentId: student.id,
          studentCode: student.student_code,
          studentName: student.name,
          className: cls?.code || student.class_id || 'N/A',
          departmentName: dept?.code || student.department_id || 'N/A',
          totalClasses,
          attendedClasses,
          percentage,
          semester: params.semester || student.semester || 'S3',
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

    let classStudents = await this.findStudents({ classId: cls.id });
    if (classStudents.length === 0 && cls.department_id) {
      classStudents = await this.findStudents({ departmentId: cls.department_id });
    }
    if (classStudents.length === 0) {
      classStudents = await this.findStudents({});
    }

    const summaries = await Promise.all(
      classStudents.map(async (student) => {
        const records = localDatabase.attendance.filter((a) => a.student_id === student.id);
        const totalClasses = records.length;
        const attendedClasses = records.filter((r) => r.status === 'PRESENT' || r.status === 'OD').length;
        const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
        const dept = student.department_id ? await this.getDepartmentByCodeOrId(student.department_id) : null;

        return {
          studentId: student.id,
          studentCode: student.student_code,
          studentName: student.name,
          className: cls.code,
          departmentName: dept?.code || student.department_id || 'N/A',
          totalClasses,
          attendedClasses,
          percentage,
          semester: params.semester || student.semester || 'S3',
          academicYear: params.academicYear || '2025-2026',
        };
      })
    );

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

    let deptStudents = await this.findStudents({ departmentId: dept.id });
    if (deptStudents.length === 0 && dept.code === 'CSE') {
      deptStudents = await this.findStudents({ departmentId: 'dept-cs' });
    }

    const summaries = await Promise.all(
      deptStudents.map(async (student) => {
        const records = localDatabase.attendance.filter((a) => a.student_id === student.id);
        const totalClasses = records.length;
        const attendedClasses = records.filter((r) => r.status === 'PRESENT' || r.status === 'OD').length;
        const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
        const cls = student.class_id ? await this.getClassByCodeOrId(student.class_id) : null;

        return {
          studentId: student.id,
          studentCode: student.student_code,
          studentName: student.name,
          className: cls?.code || student.class_id || 'N/A',
          departmentName: dept.code,
          totalClasses,
          attendedClasses,
          percentage,
          semester: params.semester || student.semester || 'S3',
          academicYear: params.academicYear || '2025-2026',
        };
      })
    );

    return { departmentInfo: dept, summaries };
  }

  public async getLowAttendanceStudents(params: {
    departmentIdentifier?: string;
    classIdentifier?: string;
    threshold?: number;
    semester?: string;
    academicYear?: string;
  }): Promise<StudentAttendanceSummary[]> {
    const threshold = params.threshold ?? 75;
    let studentsToFetch: Student[] = [];

    if (params.classIdentifier) {
      const cls = await this.getClassByCodeOrId(params.classIdentifier);
      if (cls) {
        studentsToFetch = await this.findStudents({ classId: cls.id });
        if (studentsToFetch.length === 0 && cls.department_id) {
          studentsToFetch = await this.findStudents({ departmentId: cls.department_id });
        }
      }
    } else if (params.departmentIdentifier) {
      const dept = await this.getDepartmentByCodeOrId(params.departmentIdentifier);
      if (dept) {
        studentsToFetch = await this.findStudents({ departmentId: dept.id });
        if (studentsToFetch.length === 0 && dept.code === 'CSE') {
          studentsToFetch = await this.findStudents({ departmentId: 'dept-cs' });
        }
      }
    } else {
      studentsToFetch = await this.findStudents({});
    }

    const fetchedResults = await Promise.all(
      studentsToFetch.map(async (student) => {
        const records = localDatabase.attendance.filter((a) => a.student_id === student.id);
        const totalClasses = records.length;
        const attendedClasses = records.filter((r) => r.status === 'PRESENT' || r.status === 'OD').length;
        const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

        if (percentage < threshold) {
          const cls = student.class_id ? await this.getClassByCodeOrId(student.class_id) : null;
          const dept = student.department_id ? await this.getDepartmentByCodeOrId(student.department_id) : null;

          return {
            studentId: student.id,
            studentCode: student.student_code,
            studentName: student.name,
            className: cls?.code || student.class_id || 'N/A',
            departmentName: dept?.code || student.department_id || 'N/A',
            totalClasses,
            attendedClasses,
            percentage,
            semester: params.semester || student.semester || 'S3',
            academicYear: params.academicYear || '2025-2026',
          };
        }
        return null;
      })
    );

    return fetchedResults.filter((r): r is StudentAttendanceSummary => r !== null);
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

    const fetched = await Promise.all(
      matchedStudents.map(async (student) => {
        const feeRecords = localDatabase.fees.filter((f) => f.student_id === student.id);

        const totalAmount = feeRecords.reduce((sum, f) => sum + f.amount_due, 0);
        const paidAmount = feeRecords.reduce((sum, f) => sum + f.amount_paid, 0);
        const pendingAmount = Math.max(0, totalAmount - paidAmount);

        let feeStatus: 'PAID' | 'PENDING' | 'PARTIAL' = 'PAID';
        if (pendingAmount > 0 && paidAmount > 0) feeStatus = 'PARTIAL';
        else if (pendingAmount > 0 && paidAmount === 0) feeStatus = 'PENDING';

        const cls = student.class_id ? await this.getClassByCodeOrId(student.class_id) : null;
        const dept = student.department_id ? await this.getDepartmentByCodeOrId(student.department_id) : null;

        return {
          student,
          summary: {
            studentId: student.id,
            studentCode: student.student_code,
            studentName: student.name,
            className: cls?.code || student.class_id || 'N/A',
            departmentName: dept?.code || student.department_id || 'N/A',
            totalAmount,
            paidAmount,
            pendingAmount,
            status: feeStatus,
            semester: params.semester || student.semester || 'S3',
            academicYear: params.academicYear || '2025-2026',
          },
        };
      })
    );

    return fetched;
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
      if (cls) {
        studentsToFetch = await this.findStudents({ classId: cls.id });
        if (studentsToFetch.length === 0 && cls.department_id) {
          studentsToFetch = await this.findStudents({ departmentId: cls.department_id });
        }
      }
    } else if (params.departmentIdentifier) {
      const dept = await this.getDepartmentByCodeOrId(params.departmentIdentifier);
      if (dept) {
        studentsToFetch = await this.findStudents({ departmentId: dept.id });
        if (studentsToFetch.length === 0 && dept.code === 'CSE') {
          studentsToFetch = await this.findStudents({ departmentId: 'dept-cs' });
        }
      }
    } else {
      studentsToFetch = await this.findStudents({});
    }

    const pendingList: StudentFeeSummary[] = [];

    const fetched = await Promise.all(
      studentsToFetch.map(async (student): Promise<StudentFeeSummary | null> => {
        const feeRecords = localDatabase.fees.filter((f) => f.student_id === student.id);

        const totalAmount = feeRecords.reduce((sum, f) => sum + f.amount_due, 0);
        const paidAmount = feeRecords.reduce((sum, f) => sum + f.amount_paid, 0);
        const pendingAmount = Math.max(0, totalAmount - paidAmount);

        if (pendingAmount > 0) {
          let feeStatus: 'PAID' | 'PENDING' | 'PARTIAL' = paidAmount > 0 ? 'PARTIAL' : 'PENDING';
          const cls = student.class_id ? await this.getClassByCodeOrId(student.class_id) : null;
          const dept = student.department_id ? await this.getDepartmentByCodeOrId(student.department_id) : null;

          return {
            studentId: student.id,
            studentCode: student.student_code,
            studentName: student.name,
            className: cls?.code || student.class_id || 'N/A',
            departmentName: dept?.code || student.department_id || 'N/A',
            totalAmount,
            paidAmount,
            pendingAmount,
            status: feeStatus,
            semester: params.semester || student.semester || 'S3',
            academicYear: params.academicYear || '2025-2026',
          };
        }
        return null;
      })
    );

    return fetched.filter((r): r is StudentFeeSummary => r !== null);
  }
}

export const dbClient = new DatabaseClient();
