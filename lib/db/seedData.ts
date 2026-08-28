import { Department, Class, Student, AttendanceRecord, FeeRecord, User } from './types';

export const SEED_USERS: User[] = [
  { id: 'usr-1', name: 'Dr. Sarah Connor', email: 'sarah.faculty@gradit.edu', role: 'FACULTY', department_id: 'dept-cse' },
  { id: 'usr-2', name: 'Admin Dean Vance', email: 'admin@gradit.edu', role: 'ADMIN' },
  { id: 'usr-3', name: 'Student Alex', email: 'alex@student.gradit.edu', role: 'STUDENT' },
];

export const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering' },
  { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering' },
  { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering' },
];

export const SEED_CLASSES: Class[] = [
  { id: 'cls-cs101', code: '23CS101', name: 'CSE Year 2 Sec A', department_id: 'dept-cse' },
  { id: 'cls-cs102', code: '23CS102', name: 'CSE Year 2 Sec B', department_id: 'dept-cse' },
  { id: 'cls-ec201', code: '23EC201', name: 'ECE Year 2 Sec A', department_id: 'dept-ece' },
  { id: 'cls-me301', code: '23ME301', name: 'MECH Year 3 Sec A', department_id: 'dept-mech' },
];

export const SEED_STUDENTS: Student[] = [
  // Unique & duplicate name test cases
  { id: 'std-23cs101', student_code: '23CS101', name: 'Rohan Sharma', department_id: 'dept-cse', class_id: 'cls-cs101' },
  { id: 'std-arun1', student_code: '23CS102', name: 'Arun Kumar', department_id: 'dept-cse', class_id: 'cls-cs101' },
  { id: 'std-arun2', student_code: '23EC205', name: 'Arun Kumar', department_id: 'dept-ece', class_id: 'cls-ec201' },
  { id: 'std-low1', student_code: '23CS103', name: 'Priya Verma', department_id: 'dept-cse', class_id: 'cls-cs101' },
  { id: 'std-low2', student_code: '23CS104', name: 'Vikram Singh', department_id: 'dept-cse', class_id: 'cls-cs102' },
  { id: 'std-high1', student_code: '23EC202', name: 'Ananya Roy', department_id: 'dept-ece', class_id: 'cls-ec201' },
  { id: 'std-mech1', student_code: '23ME302', name: 'Rahul Nair', department_id: 'dept-mech', class_id: 'cls-me301' },
  { id: 'std-harini', student_code: '23CS105', name: 'Harini', department_id: 'dept-cse', class_id: 'cls-cs101' },
];

// Seed attendance percentages:
// 23CS101 (Rohan): 82%
// 23CS102 (Arun CSE): 90%
// 23EC205 (Arun ECE): 70%
// 23CS103 (Priya): 60% (Low attendance)
// 23CS104 (Vikram): 40% (Low attendance)
// 23EC202 (Ananya): 96%
// 23ME302 (Rahul): 75%
export const SEED_ATTENDANCE: AttendanceRecord[] = [
  // Rohan Sharma (82%)
  ...Array.from({ length: 41 }, (_, i) => ({ id: `att-rohan-${i}`, student_id: 'std-23cs101', class_id: 'cls-cs101', date: `2026-08-${(i%25)+1}`, status: 'PRESENT' as const, semester: 'S3', academic_year: '2025-2026' })),
  ...Array.from({ length: 9 }, (_, i) => ({ id: `att-rohan-abs-${i}`, student_id: 'std-23cs101', class_id: 'cls-cs101', date: `2026-08-${(i%25)+1}`, status: 'ABSENT' as const, semester: 'S3', academic_year: '2025-2026' })),
  
  // Arun Kumar (CSE, 90%)
  ...Array.from({ length: 45 }, (_, i) => ({ id: `att-arun1-${i}`, student_id: 'std-arun1', class_id: 'cls-cs101', date: `2026-08-${(i%25)+1}`, status: 'PRESENT' as const, semester: 'S3', academic_year: '2025-2026' })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: `att-arun1-abs-${i}`, student_id: 'std-arun1', class_id: 'cls-cs101', date: `2026-08-${(i%25)+1}`, status: 'ABSENT' as const, semester: 'S3', academic_year: '2025-2026' })),

  // Arun Kumar (ECE, 70%)
  ...Array.from({ length: 35 }, (_, i) => ({ id: `att-arun2-${i}`, student_id: 'std-arun2', class_id: 'cls-ec201', date: `2026-08-${(i%25)+1}`, status: 'PRESENT' as const, semester: 'S3', academic_year: '2025-2026' })),
  ...Array.from({ length: 15 }, (_, i) => ({ id: `att-arun2-abs-${i}`, student_id: 'std-arun2', class_id: 'cls-ec201', date: `2026-08-${(i%25)+1}`, status: 'ABSENT' as const, semester: 'S3', academic_year: '2025-2026' })),

  // Priya Verma (60% - Low)
  ...Array.from({ length: 30 }, (_, i) => ({ id: `att-priya-${i}`, student_id: 'std-low1', class_id: 'cls-cs101', date: `2026-08-${(i%25)+1}`, status: 'PRESENT' as const, semester: 'S3', academic_year: '2025-2026' })),
  ...Array.from({ length: 20 }, (_, i) => ({ id: `att-priya-abs-${i}`, student_id: 'std-low1', class_id: 'cls-cs101', date: `2026-08-${(i%25)+1}`, status: 'ABSENT' as const, semester: 'S3', academic_year: '2025-2026' })),

  // Vikram Singh (40% - Low)
  ...Array.from({ length: 20 }, (_, i) => ({ id: `att-vikram-${i}`, student_id: 'std-low2', class_id: 'cls-cs102', date: `2026-08-${(i%25)+1}`, status: 'PRESENT' as const, semester: 'S3', academic_year: '2025-2026' })),
  ...Array.from({ length: 30 }, (_, i) => ({ id: `att-vikram-abs-${i}`, student_id: 'std-low2', class_id: 'cls-cs102', date: `2026-08-${(i%25)+1}`, status: 'ABSENT' as const, semester: 'S3', academic_year: '2025-2026' })),
];

export const SEED_FEES: FeeRecord[] = [
  { id: 'fee-1', student_id: 'std-23cs101', fee_type: 'Tuition Fee', amount: 85000, paid_amount: 85000, status: 'PAID', semester: 'S3', academic_year: '2025-2026' },
  { id: 'fee-2', student_id: 'std-arun1', fee_type: 'Tuition Fee', amount: 85000, paid_amount: 50000, status: 'PARTIAL', semester: 'S3', academic_year: '2025-2026' },
  { id: 'fee-3', student_id: 'std-arun2', fee_type: 'Tuition Fee', amount: 85000, paid_amount: 0, status: 'PENDING', semester: 'S3', academic_year: '2025-2026' },
  { id: 'fee-4', student_id: 'std-low1', fee_type: 'Tuition Fee', amount: 85000, paid_amount: 20000, status: 'PARTIAL', semester: 'S3', academic_year: '2025-2026' },
  { id: 'fee-5', student_id: 'std-low2', fee_type: 'Tuition Fee', amount: 85000, paid_amount: 0, status: 'PENDING', semester: 'S3', academic_year: '2025-2026' },
  { id: 'fee-6', student_id: 'std-high1', fee_type: 'Tuition Fee', amount: 85000, paid_amount: 85000, status: 'PAID', semester: 'S3', academic_year: '2025-2026' },
  { id: 'fee-7', student_id: 'std-mech1', fee_type: 'Tuition Fee', amount: 80000, paid_amount: 80000, status: 'PAID', semester: 'S3', academic_year: '2025-2026' },
];
