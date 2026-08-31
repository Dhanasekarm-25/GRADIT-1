export type UserRole = 'FACULTY' | 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Class {
  id: string;
  code: string;
  name: string;
  department_id: string;
}

export interface Student {
  id: string;
  student_code: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  department_id: string;
  class_id: string;
  year?: number;
  semester?: string;
  section?: string;
  admission_year?: number;
  status?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'OD' | 'LEAVE';
  semester: string;
  academic_year: string;
}

export interface FeeRecord {
  id: string;
  student_id: string;
  fee_type: string;
  amount: number;
  paid_amount: number;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
  semester: string;
  academic_year: string;
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  departmentName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  semester: string;
  academicYear: string;
}

export interface StudentFeeSummary {
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  departmentName: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'PAID' | 'PENDING' | 'PARTIAL';
  semester: string;
  academicYear: string;
}
