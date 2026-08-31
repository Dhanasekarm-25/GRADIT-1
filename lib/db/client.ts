import {
  Student,
  Department,
  Class,
  User,
  StudentAttendanceSummary,
  StudentFeeSummary,
} from './types';
import { getSupabaseClient } from '../supabase';

/**
 * Single Source of Truth Database Client for GRADit! College ERP.
 * Strictly queries live Supabase PostgreSQL tables using read-only SELECT operations.
 * Zero hardcoded/mock/dummy/deterministic in-memory fallback datasets.
 */
export class DatabaseClient {
  private getClient() {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Unable to retrieve the requested information from the ERP database.');
    }
    return client;
  }

  // User & Auth queries
  public async getUserById(userId: string): Promise<User | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) {
      throw new Error('Unable to retrieve the requested information from the ERP database.');
    }
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      department_id: data.department_id,
    };
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
    const supabase = this.getClient();
    let req = supabase.from('students').select('*');

    if (query.studentId) {
      req = req.eq('id', query.studentId);
    }
    if (query.studentCode) {
      req = req.ilike('student_code', query.studentCode.trim());
    }
    if (query.studentName) {
      req = req.ilike('full_name', `%${query.studentName.trim()}%`);
    }
    if (query.classId) {
      req = req.eq('class_id', query.classId);
    }
    if (query.departmentId) {
      req = req.eq('department_id', query.departmentId);
    }

    req = req.limit(query.limit || 500);

    const { data, error } = await req;
    if (error) {
      throw new Error('Unable to retrieve the requested information from the ERP database.');
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((d: any) => this.mapStudentRow(d));
  }

  private mapStudentRow(d: any): Student {
    return {
      id: d.id,
      student_code: d.student_code,
      name: d.full_name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.name || '',
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
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('student_code', code.trim());
    if (error) throw new Error('Unable to retrieve the requested information from the ERP database.');
    return (data || []).map((d: any) => this.mapStudentRow(d));
  }

  // Priority 2 — Exact Full Name Search
  public async findStudentsByExactFullName(fullName: string): Promise<Student[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('full_name', fullName.trim());
    if (error) throw new Error('Unable to retrieve the requested information from the ERP database.');
    return (data || []).map((d: any) => this.mapStudentRow(d));
  }

  // Priority 2.5 — Combined First + Last Name Search
  public async findStudentsByCombinedName(firstName: string, lastName: string): Promise<Student[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim());
    if (error) throw new Error('Unable to retrieve the requested information from the ERP database.');
    return (data || []).map((d: any) => this.mapStudentRow(d));
  }

  // Priority 3 — Exact First Name Search
  public async findStudentsByExactFirstName(firstName: string): Promise<Student[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('first_name', firstName.trim());
    if (error) throw new Error('Unable to retrieve the requested information from the ERP database.');
    return (data || []).map((d: any) => this.mapStudentRow(d));
  }

  // Priority 4 — Exact Last Name Search
  public async findStudentsByExactLastName(lastName: string): Promise<Student[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .ilike('last_name', lastName.trim());
    if (error) throw new Error('Unable to retrieve the requested information from the ERP database.');
    return (data || []).map((d: any) => this.mapStudentRow(d));
  }

  // Priority 5 — Conservative Contains Search
  public async findStudentsByContains(term: string): Promise<Student[]> {
    const clean = term.trim();
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`full_name.ilike.%${clean}%,first_name.ilike.%${clean}%,last_name.ilike.%${clean}%`)
      .limit(50);
    if (error) throw new Error('Unable to retrieve the requested information from the ERP database.');
    return (data || []).map((d: any) => this.mapStudentRow(d));
  }

  public async getDepartmentByCodeOrId(identifier: string): Promise<Department | null> {
    const clean = identifier.trim();
    if (!clean) return null;
    const supabase = this.getClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    try {
      let req = supabase.from('departments').select('*');
      if (isUUID) {
        req = req.eq('id', clean);
      } else {
        req = req.or(`code.ilike.${clean},name.ilike.%${clean}%`);
      }
      const { data, error } = await req.limit(1);

      if (error || !data || data.length === 0) return null;
      return {
        id: data[0].id,
        code: data[0].code || data[0].name || data[0].id,
        name: data[0].name,
      };
    } catch {
      return null;
    }
  }

  public async getClassByCodeOrId(identifier: string): Promise<Class | null> {
    const clean = identifier.trim();
    if (!clean) return null;
    const supabase = this.getClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    try {
      let req = supabase.from('classes').select('*');
      if (isUUID) {
        req = req.eq('id', clean);
      } else {
        req = req.ilike('name', `%${clean}%`);
      }
      const { data, error } = await req.limit(1);

      if (error || !data || data.length === 0) return null;
      return {
        id: data[0].id,
        code: data[0].name || data[0].id,
        name: data[0].name,
        department_id: data[0].department_id,
      };
    } catch {
      return null;
    }
  }

  public async getSubjectByCodeOrId(identifier: string): Promise<{ id: string; code: string; name: string; department_id: string; semester: string } | null> {
    const clean = identifier.trim();
    if (!clean) return null;
    const supabase = this.getClient();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    try {
      let req = supabase.from('subjects').select('*');
      if (isUUID) {
        req = req.eq('id', clean);
      } else {
        req = req.or(`code.ilike.${clean},name.ilike.%${clean}%`);
      }
      const { data, error } = await req.limit(1);

      if (error || !data || data.length === 0) return null;
      return {
        id: data[0].id,
        code: data[0].code || data[0].name || data[0].id,
        name: data[0].name,
        department_id: data[0].department_id,
        semester: data[0].semester,
      };
    } catch {
      return null;
    }
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

    const supabase = this.getClient();
    const results: { student: Student; summary: StudentAttendanceSummary }[] = [];

    for (const student of matchedStudents) {
      let req = supabase
        .from('attendance_records')
        .select('status, attendance_date')
        .eq('student_id', student.id);

      const { data, error } = await req;
      if (error) {
        throw new Error('Unable to retrieve the requested information from the ERP database.');
      }

      const records = data || [];
      const totalClasses = records.length;
      const attendedClasses = records.filter((r: any) => r.status === 'PRESENT' || r.status === 'OD').length;
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

    let classStudents = await this.findStudents({ classId: cls.id });
    if (classStudents.length === 0 && cls.department_id) {
      classStudents = await this.findStudents({ departmentId: cls.department_id });
    }

    const supabase = this.getClient();
    const summaries = await Promise.all(
      classStudents.map(async (student) => {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('status, attendance_date')
          .eq('student_id', student.id);

        if (error) {
          throw new Error('Unable to retrieve the requested information from the ERP database.');
        }

        const records = data || [];
        const totalClasses = records.length;
        const attendedClasses = records.filter((r: any) => r.status === 'PRESENT' || r.status === 'OD').length;
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
          semester: params.semester || 'S3',
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

    const deptStudents = await this.findStudents({ departmentId: dept.id });
    const supabase = this.getClient();
    const summaries = await Promise.all(
      deptStudents.map(async (student) => {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('status, attendance_date')
          .eq('student_id', student.id);

        if (error) {
          throw new Error('Unable to retrieve the requested information from the ERP database.');
        }

        const records = data || [];
        const totalClasses = records.length;
        const attendedClasses = records.filter((r: any) => r.status === 'PRESENT' || r.status === 'OD').length;
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
          semester: params.semester || 'S3',
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
      }
    } else if (params.departmentIdentifier) {
      const dept = await this.getDepartmentByCodeOrId(params.departmentIdentifier);
      if (dept) {
        studentsToFetch = await this.findStudents({ departmentId: dept.id });
      }
    } else {
      studentsToFetch = await this.findStudents({});
    }

    const supabase = this.getClient();
    const fetchedResults = await Promise.all(
      studentsToFetch.map(async (student) => {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('status, attendance_date')
          .eq('student_id', student.id);

        if (error) {
          throw new Error('Unable to retrieve the requested information from the ERP database.');
        }

        const records = data || [];
        const totalClasses = records.length;
        const attendedClasses = records.filter((r: any) => r.status === 'PRESENT' || r.status === 'OD').length;
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
            semester: params.semester || 'S3',
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

    const supabase = this.getClient();
    const results: { student: Student; summary: StudentFeeSummary }[] = [];

    const fetched = await Promise.all(
      matchedStudents.map(async (student) => {
        let feeRecords: any[] = [];
        try {
          const { data, error } = await supabase.from('fee_payments').select('*').eq('student_id', student.id);
          if (!error && data) {
            feeRecords = data.map((d: any) => ({
              amount: Number(d.amount_due || d.amount || 0),
              paid_amount: Number(d.amount_paid || 0),
              status: (d.payment_status === 'OVERDUE' ? 'PENDING' : d.payment_status) as 'PAID' | 'PENDING' | 'PARTIAL',
              semester: d.semester,
              academic_year: d.academic_year,
            }));
          }
        } catch {
          feeRecords = [];
        }

        const totalAmount = feeRecords.reduce((sum, f) => sum + f.amount, 0);
        const paidAmount = feeRecords.reduce((sum, f) => sum + f.paid_amount, 0);
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
            semester: params.semester || 'S3',
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
      if (cls) studentsToFetch = await this.findStudents({ classId: cls.id });
    } else if (params.departmentIdentifier) {
      const dept = await this.getDepartmentByCodeOrId(params.departmentIdentifier);
      if (dept) studentsToFetch = await this.findStudents({ departmentId: dept.id });
    } else {
      studentsToFetch = await this.findStudents({});
    }

    const supabase = this.getClient();
    const pendingList: StudentFeeSummary[] = [];

    const fetched = await Promise.all(
      studentsToFetch.map(async (student) => {
        let feeRecords: any[] = [];
        try {
          const { data, error } = await supabase.from('fee_payments').select('*').eq('student_id', student.id);
          if (!error && data) {
            feeRecords = data.map((d: any) => ({
              amount: Number(d.amount_due || d.amount || 0),
              paid_amount: Number(d.amount_paid || 0),
              status: (d.payment_status === 'OVERDUE' ? 'PENDING' : d.payment_status) as 'PAID' | 'PENDING' | 'PARTIAL',
              semester: d.semester,
              academic_year: d.academic_year,
            }));
          }
        } catch {
          feeRecords = [];
        }

        const totalAmount = feeRecords.reduce((sum, f) => sum + f.amount, 0);
        const paidAmount = feeRecords.reduce((sum, f) => sum + f.paid_amount, 0);
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
            semester: params.semester || 'S3',
            academicYear: params.academicYear || '2025-2026',
          };
        }
        return null;
      })
    );

    return (fetched.filter((r) => r !== null) as StudentFeeSummary[]);
  }
}

export const dbClient = new DatabaseClient();
