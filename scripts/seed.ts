import * as fs from 'fs';
import * as path from 'path';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

export interface SeedDepartment {
  id: string;
  code: string;
  name: string;
}

export interface SeedClass {
  id: string;
  code: string;
  name: string;
  department_id: string;
}

export interface SeedSubject {
  id: string;
  code: string;
  name: string;
  department_id: string;
  semester: string;
}

export interface SeedStudent {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  department_id: string;
  class_id: string;
  year: number;
  semester: string;
  section: string;
  admission_year: number;
  status: string;
}

export interface SeedAttendance {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'OD' | 'LEAVE';
  semester: string;
  academic_year: string;
}

export interface SeedFeePayment {
  id: string;
  student_id: string;
  fee_category: string;
  amount_due: number;
  amount_paid: number;
  payment_status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  payment_date: string | null;
  payment_method: string | null;
  semester: string;
  academic_year: string;
}

export function generateDeterministicSeedData(): {
  departments: SeedDepartment[];
  classes: SeedClass[];
  subjects: SeedSubject[];
  students: SeedStudent[];
  attendance: SeedAttendance[];
  fees: SeedFeePayment[];
} {
  // 1. Departments (Exactly 4)
  const departments: SeedDepartment[] = [
    { id: 'dept-genai', code: 'GENAI', name: 'Generative AI' },
    { id: 'dept-mca', code: 'MCA', name: 'Master of Computer Applications' },
    { id: 'dept-bca', code: 'BCA', name: 'Bachelor of Computer Applications' },
    { id: 'dept-cs', code: 'CS', name: 'Computer Science' },
  ];

  // 2. Classes (8 classes: 2 sections per department)
  const classes: SeedClass[] = [
    { id: 'cls-genai-a', code: 'GENAI-A', name: 'GENAI Year 2 Sec A', department_id: 'dept-genai' },
    { id: 'cls-genai-b', code: 'GENAI-B', name: 'GENAI Year 2 Sec B', department_id: 'dept-genai' },
    { id: 'cls-mca-a', code: 'MCA-A', name: 'MCA Year 2 Sec A', department_id: 'dept-mca' },
    { id: 'cls-mca-b', code: 'MCA-B', name: 'MCA Year 2 Sec B', department_id: 'dept-mca' },
    { id: 'cls-bca-a', code: 'BCA-A', name: 'BCA Year 2 Sec A', department_id: 'dept-bca' },
    { id: 'cls-bca-b', code: 'BCA-B', name: 'BCA Year 2 Sec B', department_id: 'dept-bca' },
    { id: 'cls-cs-a', code: 'CS-A', name: 'CS Year 2 Sec A', department_id: 'dept-cs' },
    { id: 'cls-cs-b', code: 'CS-B', name: 'CS Year 2 Sec B', department_id: 'dept-cs' },
  ];

  // 3. Subjects (8 subjects per department)
  const subjects: SeedSubject[] = [
    // GENAI
    { id: 'sub-genai-1', code: 'GAI301', name: 'Python Programming', department_id: 'dept-genai', semester: 'S3' },
    { id: 'sub-genai-2', code: 'GAI302', name: 'Artificial Intelligence', department_id: 'dept-genai', semester: 'S3' },
    { id: 'sub-genai-3', code: 'GAI303', name: 'Machine Learning', department_id: 'dept-genai', semester: 'S3' },
    { id: 'sub-genai-4', code: 'GAI304', name: 'Deep Learning', department_id: 'dept-genai', semester: 'S3' },
    { id: 'sub-genai-5', code: 'GAI305', name: 'Generative AI', department_id: 'dept-genai', semester: 'S3' },
    { id: 'sub-genai-6', code: 'GAI306', name: 'Data Science', department_id: 'dept-genai', semester: 'S3' },
    { id: 'sub-genai-7', code: 'GAI307', name: 'Natural Language Processing', department_id: 'dept-genai', semester: 'S3' },
    { id: 'sub-genai-8', code: 'GAI308', name: 'Computer Vision', department_id: 'dept-genai', semester: 'S3' },

    // MCA
    { id: 'sub-mca-1', code: 'MCA301', name: 'Programming in Java', department_id: 'dept-mca', semester: 'S3' },
    { id: 'sub-mca-2', code: 'MCA302', name: 'Data Structures', department_id: 'dept-mca', semester: 'S3' },
    { id: 'sub-mca-3', code: 'MCA303', name: 'Database Management Systems', department_id: 'dept-mca', semester: 'S3' },
    { id: 'sub-mca-4', code: 'MCA304', name: 'Operating Systems', department_id: 'dept-mca', semester: 'S3' },
    { id: 'sub-mca-5', code: 'MCA305', name: 'Computer Networks', department_id: 'dept-mca', semester: 'S3' },
    { id: 'sub-mca-6', code: 'MCA306', name: 'Software Engineering', department_id: 'dept-mca', semester: 'S3' },
    { id: 'sub-mca-7', code: 'MCA307', name: 'Web Technologies', department_id: 'dept-mca', semester: 'S3' },
    { id: 'sub-mca-8', code: 'MCA308', name: 'Cloud Computing', department_id: 'dept-mca', semester: 'S3' },

    // BCA
    { id: 'sub-bca-1', code: 'BCA301', name: 'Programming in C', department_id: 'dept-bca', semester: 'S3' },
    { id: 'sub-bca-2', code: 'BCA302', name: 'Java Programming', department_id: 'dept-bca', semester: 'S3' },
    { id: 'sub-bca-3', code: 'BCA303', name: 'Web Development', department_id: 'dept-bca', semester: 'S3' },
    { id: 'sub-bca-4', code: 'BCA304', name: 'Database Systems', department_id: 'dept-bca', semester: 'S3' },
    { id: 'sub-bca-5', code: 'BCA305', name: 'Computer Networks', department_id: 'dept-bca', semester: 'S3' },
    { id: 'sub-bca-6', code: 'BCA306', name: 'Software Engineering', department_id: 'dept-bca', semester: 'S3' },
    { id: 'sub-bca-7', code: 'BCA307', name: 'Computer Fundamentals', department_id: 'dept-bca', semester: 'S3' },
    { id: 'sub-bca-8', code: 'BCA308', name: 'Data Structures', department_id: 'dept-bca', semester: 'S3' },

    // CS
    { id: 'sub-cs-1', code: 'CS301', name: 'Programming', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-2', code: 'CS302', name: 'Data Structures', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-3', code: 'CS303', name: 'Algorithms', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-4', code: 'CS304', name: 'Operating Systems', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-5', code: 'CS305', name: 'Computer Networks', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-6', code: 'CS306', name: 'Database Management Systems', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-7', code: 'CS307', name: 'Software Engineering', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-8', code: 'CS308', name: 'Artificial Intelligence', department_id: 'dept-cs', semester: 'S3' },
  ];

  // 4. Students (Exactly 200 Students: 50 per department)
  const firstNamesPool = [
    'Aarav', 'Aditya', 'Akash', 'Alok', 'Amit', 'Ananya', 'Archana', 'Arun', 'Bhavna', 'Deepa',
    'Deepak', 'Divya', 'Gaurav', 'Harini', 'Ishaan', 'Ishita', 'Kabir', 'Karthik', 'Kavya', 'Kunal',
    'Manish', 'Meera', 'Monika', 'Naveen', 'Neetu', 'Nikhil', 'Pallavi', 'Payal', 'Pooja', 'Prateek',
    'Preeti', 'Priya', 'Rahul', 'Rajesh', 'Rashmi', 'Ritu', 'Rohan', 'Sachin', 'Sandhya', 'Shilpa',
    'Shweta', 'Siddharth', 'Sneha', 'Sunil', 'Suresh', 'Swati', 'Tanvi', 'Tarun', 'Varun', 'Vikram'
  ];

  const lastNamesPool = [
    'Aggarwal', 'Arora', 'Bahl', 'Banerjee', 'Bansal', 'Bhat', 'Bhatia', 'Bose', 'Chadha', 'Chatterjee',
    'Chopra', 'Das', 'Deshmukh', 'Dutta', 'Ghosh', 'Goyal', 'Gupta', 'Iyer', 'Jain', 'Joshi',
    'Kapoor', 'Kohli', 'Kulkarni', 'Kumar', 'Malhotra', 'Mehta', 'Menon', 'Mishra', 'Mittal', 'Modi',
    'Mukherjee', 'Nair', 'Pandey', 'Parekh', 'Patel', 'Pillai', 'Rao', 'Reddy', 'Roy', 'Sarin',
    'Saxena', 'Sen', 'Sethi', 'Shah', 'Sharma', 'Singh', 'Singhal', 'Thakur', 'Verma', 'Vora'
  ];

  const deptConfigs = [
    { code: 'GENAI', deptId: 'dept-genai', classA: 'cls-genai-a', classB: 'cls-genai-b' },
    { code: 'MCA', deptId: 'dept-mca', classA: 'cls-mca-a', classB: 'cls-mca-b' },
    { code: 'BCA', deptId: 'dept-bca', classA: 'cls-bca-a', classB: 'cls-bca-b' },
    { code: 'CS', deptId: 'dept-cs', classA: 'cls-cs-a', classB: 'cls-cs-b' },
  ];

  const students: SeedStudent[] = [];
  let globalStudentCounter = 0;

  for (const dept of deptConfigs) {
    for (let i = 1; i <= 50; i++) {
      globalStudentCounter++;
      const codeNum = String(i).padStart(3, '0');
      const studentCode = `${dept.code}23${codeNum}`;
      
      let fn: string;
      let ln: string;

      // Deterministic Anchor & Ambiguity testing students
      if (dept.code === 'CS' && i === 1) {
        fn = 'Rohan';
        ln = 'Sharma';
      } else if (dept.code === 'CS' && i === 2) {
        fn = 'Arun';
        ln = 'Kumar';
      } else if (dept.code === 'BCA' && i === 2) {
        fn = 'Arun';
        ln = 'Raj'; // Ambiguity Arun
      } else if (dept.code === 'MCA' && i === 2) {
        fn = 'Arun';
        ln = 'Prakash'; // Ambiguity Arun
      } else if (dept.code === 'GENAI' && i === 2) {
        fn = 'Arun';
        ln = 'Kumar'; // 2nd Arun Kumar for multi-match testing
      } else if (dept.code === 'CS' && i === 3) {
        fn = 'Priya';
        ln = 'Verma';
      } else if (dept.code === 'CS' && i === 4) {
        fn = 'Vikram';
        ln = 'Singh';
      } else if (dept.code === 'CS' && i === 5) {
        fn = 'Ananya';
        ln = 'Roy';
      } else if (dept.code === 'CS' && i === 6) {
        fn = 'Rahul';
        ln = 'Nair';
      } else if (dept.code === 'CS' && i === 7) {
        fn = 'Harini';
        ln = 'Devi';
      } else if (dept.code === 'BCA' && i === 7) {
        fn = 'Harini';
        ln = 'Kumar'; // Ambiguity Harini
      } else if (dept.code === 'GENAI' && i === 1) {
        fn = 'Amit';
        ln = 'Sharma'; // Ambiguity Sharma
      } else if (dept.code === 'GENAI' && i === 27) {
        fn = 'Rahul';
        ln = 'Singh'; // GENAI23027
      } else if (dept.code === 'MCA' && i === 1) {
        fn = 'Priya';
        ln = 'Sharma'; // Ambiguity Sharma
      } else {
        const fnIdx = (globalStudentCounter * 7 + 13) % firstNamesPool.length;
        const lnIdx = (globalStudentCounter * 11 + 23) % lastNamesPool.length;
        fn = firstNamesPool[fnIdx];
        ln = lastNamesPool[lnIdx];
        // Prevent accidental unintended collision with primary anchors
        if (fn === 'Rohan' && ln === 'Sharma') fn = 'Karthik';
        if (fn === 'Priya' && ln === 'Verma') fn = 'Meera';
        if (fn === 'Vikram' && ln === 'Singh') fn = 'Siddharth';
        if (fn === 'Ananya' && ln === 'Roy') fn = 'Tanvi';
        if (fn === 'Rahul' && ln === 'Nair') fn = 'Nikhil';
      }

      const isSecA = i <= 25;
      const classId = isSecA ? dept.classA : dept.classB;
      const section = isSecA ? 'A' : 'B';
      
      // Logically consistent Year and Semester distribution (Years 1 to 4)
      const year = (i % 4) + 1;
      const semester = year === 1 ? 'S1' : year === 2 ? 'S3' : year === 3 ? 'S5' : 'S7';
      const admissionYear = 2025 - year;

      students.push({
        id: `std-${dept.code.toLowerCase()}-${codeNum}`,
        student_code: studentCode,
        first_name: fn,
        last_name: ln,
        full_name: `${fn} ${ln}`,
        email: `${studentCode.toLowerCase()}@gradit.edu.in`,
        phone: `+91 98${dept.code.length}${codeNum}${String(i * 3).padStart(4, '0')}`.slice(0, 15),
        date_of_birth: `200${year + 1}-${String(((i % 12) + 1)).padStart(2, '0')}-${String(((i % 28) + 1)).padStart(2, '0')}`,
        department_id: dept.deptId,
        class_id: classId,
        year,
        semester,
        section,
        admission_year: admissionYear,
        status: 'ACTIVE',
      });
    }
  }

  // 5. Attendance Generation (6 Months: 2026-03-01 to 2026-08-31, 50 sessions per student = 10,000 total)
  const attendance: SeedAttendance[] = [];
  
  // Target distribution buckets matching requirements:
  // 10% < 60%, 20% 60-74%, 40% 75-84%, 20% 85-94%, 10% 95-100%
  // Plus edge cases: 40%, 48%, 58%, 68%, 74%, 75%, 76%, 82%, 90%, 96%, 100%
  const targetPercentages = [
    40, 48, 56, 59, // <60% (10%)
    62, 65, 68, 70, 72, 74, // 60-74% (20% with edge case 74%)
    75, 75, 76, 78, 80, 82, 82, 84, // 75-84% (40% with edge cases 75%, 76%, Rohan 82%)
    86, 88, 90, 90, 92, 94, // 85-94% (20% with edge case 90%)
    96, 98, 100 // 95-100% (10% with edge case 100%)
  ];

  const dates: string[] = [];
  const startDate = new Date('2026-03-02');
  for (let d = 0; d < 50; d++) {
    const cur = new Date(startDate);
    cur.setDate(cur.getDate() + Math.floor(d * 3.5));
    dates.push(cur.toISOString().split('T')[0]);
  }

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const deptSubjects = subjects.filter((s) => s.department_id === student.department_id);
    
    // Explicit anchor percentage overrides
    let targetPct = targetPercentages[sIdx % targetPercentages.length];
    if (student.student_code === 'CS23001') targetPct = 82; // Rohan Sharma 82%
    if (student.student_code === 'CS23002') targetPct = 90; // Arun Kumar (CS) 90%
    if (student.student_code === 'CS23003') targetPct = 60; // Priya Verma 60%
    if (student.student_code === 'CS23004') targetPct = 40; // Vikram Singh 40%
    if (student.student_code === 'CS23005') targetPct = 96; // Ananya Roy 96%
    if (student.student_code === 'CS23006') targetPct = 75; // Rahul Nair exactly 75%
    if (student.student_code === 'CS23007') targetPct = 85; // Harini Devi 85%

    const presentCount = Math.round((targetPct / 100) * dates.length);

    for (let dIdx = 0; dIdx < dates.length; dIdx++) {
      const isPresent = dIdx < presentCount;
      const sub = deptSubjects[dIdx % deptSubjects.length] || deptSubjects[0];
      const status: 'PRESENT' | 'ABSENT' | 'OD' | 'LEAVE' = isPresent
        ? 'PRESENT'
        : dIdx % 8 === 0
        ? 'OD'
        : dIdx % 6 === 0
        ? 'LEAVE'
        : 'ABSENT';

      attendance.push({
        id: `att-${student.id}-${dIdx + 1}`,
        student_id: student.id,
        subject_id: sub.id,
        class_id: student.class_id,
        date: dates[dIdx],
        status,
        semester: student.semester,
        academic_year: '2025-2026',
      });
    }
  }

  // 6. Fee Generation (Multiple fee records per student: Tuition, Examination, Library, Transport/Hostel)
  const fees: SeedFeePayment[] = [];
  const feeStatusCycles: ('PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE')[] = [
    'PAID', 'PAID', 'PARTIAL', 'PENDING', 'OVERDUE', 'PAID', 'PARTIAL', 'PAID'
  ];

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const statusCycle = feeStatusCycles[sIdx % feeStatusCycles.length];

    // Record 1: Tuition Fee
    let tuitionDue = 65000;
    let tuitionPaid = 65000;
    let tuitionStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' = 'PAID';
    let tuitionDate: string | null = '2026-03-15';
    let tuitionMethod: string | null = 'ONLINE_TRANSFER';

    if (student.student_code === 'CS23001') {
      // Rohan Sharma: fully paid
      tuitionDue = 85000;
      tuitionPaid = 85000;
      tuitionStatus = 'PAID';
    } else if (student.student_code === 'CS23002') {
      // Arun Kumar: partial
      tuitionDue = 85000;
      tuitionPaid = 50000;
      tuitionStatus = 'PARTIAL';
      tuitionDate = '2026-04-10';
      tuitionMethod = 'UPI';
    } else if (statusCycle === 'PARTIAL') {
      tuitionPaid = 35000;
      tuitionStatus = 'PARTIAL';
      tuitionDate = '2026-04-12';
      tuitionMethod = 'UPI';
    } else if (statusCycle === 'PENDING') {
      tuitionPaid = 0;
      tuitionStatus = 'PENDING';
      tuitionDate = null;
      tuitionMethod = null;
    } else if (statusCycle === 'OVERDUE') {
      tuitionPaid = 0;
      tuitionStatus = 'OVERDUE';
      tuitionDate = null;
      tuitionMethod = null;
    }

    fees.push({
      id: `fee-${student.id}-tuition`,
      student_id: student.id,
      fee_category: 'Tuition',
      amount_due: tuitionDue,
      amount_paid: tuitionPaid,
      payment_status: tuitionStatus,
      payment_date: tuitionDate,
      payment_method: tuitionMethod,
      semester: student.semester,
      academic_year: '2025-2026',
    });

    // Record 2: Examination Fee
    const examDue = 4500;
    const examPaid = tuitionStatus === 'PENDING' || tuitionStatus === 'OVERDUE' ? 0 : 4500;
    const examStatus = examPaid === 4500 ? 'PAID' : 'PENDING';
    fees.push({
      id: `fee-${student.id}-exam`,
      student_id: student.id,
      fee_category: 'Examination',
      amount_due: examDue,
      amount_paid: examPaid,
      payment_status: examStatus,
      payment_date: examPaid > 0 ? '2026-05-10' : null,
      payment_method: examPaid > 0 ? 'NET_BANKING' : null,
      semester: student.semester,
      academic_year: '2025-2026',
    });

    // Record 3: Library / Laboratory Fee
    const auxCategory = sIdx % 2 === 0 ? 'Library' : 'Laboratory';
    const auxDue = 3500;
    const auxPaid = tuitionStatus === 'PAID' ? 3500 : 0;
    const auxStatus = auxPaid === 3500 ? 'PAID' : 'PENDING';
    fees.push({
      id: `fee-${student.id}-aux`,
      student_id: student.id,
      fee_category: auxCategory,
      amount_due: auxDue,
      amount_paid: auxPaid,
      payment_status: auxStatus,
      payment_date: auxPaid > 0 ? '2026-03-20' : null,
      payment_method: auxPaid > 0 ? 'CARD' : null,
      semester: student.semester,
      academic_year: '2025-2026',
    });

    // Record 4: Optional Transport / Hostel Fee for a subset of students
    if (sIdx % 3 === 0) {
      const facilityCategory = sIdx % 6 === 0 ? 'Hostel' : 'Transport';
      const facilityDue = 28000;
      const facilityPaid = tuitionStatus === 'PAID' ? 28000 : tuitionStatus === 'PARTIAL' ? 14000 : 0;
      const facilityStatus = facilityPaid === 28000 ? 'PAID' : facilityPaid > 0 ? 'PARTIAL' : 'PENDING';
      fees.push({
        id: `fee-${student.id}-facility`,
        student_id: student.id,
        fee_category: facilityCategory,
        amount_due: facilityDue,
        amount_paid: facilityPaid,
        payment_status: facilityStatus,
        payment_date: facilityPaid > 0 ? '2026-04-05' : null,
        payment_method: facilityPaid > 0 ? 'CHEQUE' : null,
        semester: student.semester,
        academic_year: '2025-2026',
      });
    }
  }

  return { departments, classes, subjects, students, attendance, fees };
}

export function generateSeedSQL(): string {
  const data = generateDeterministicSeedData();
  const sqlLines: string[] = [
    '-- ============================================================',
    '-- GRADit! ERP — Realistic Deterministic Supabase Seed Data',
    '-- 200 Students | 4 Departments | 8 Classes | 10,000 Attendance | Multiple Fees',
    '-- ============================================================',
    '',
  ];

  // 1. Departments
  sqlLines.push('-- 1. Departments (4 Core)');
  for (const d of data.departments) {
    sqlLines.push(
      `INSERT INTO departments (id, code, name) VALUES ('${d.id}', '${d.code}', '${d.name}') ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;`
    );
  }
  sqlLines.push('');

  // 2. Classes
  sqlLines.push('-- 2. Classes (8 Sections)');
  for (const c of data.classes) {
    sqlLines.push(
      `INSERT INTO classes (id, code, name, department_id) VALUES ('${c.id}', '${c.code}', '${c.name}', '${c.department_id}') ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, department_id = EXCLUDED.department_id;`
    );
  }
  sqlLines.push('');

  // 3. Subjects
  sqlLines.push('-- 3. Subjects (32 Total: 8 per department)');
  for (const s of data.subjects) {
    sqlLines.push(
      `INSERT INTO subjects (id, code, name, department_id, semester) VALUES ('${s.id}', '${s.code}', '${s.name}', '${s.department_id}', '${s.semester}') ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;`
    );
  }
  sqlLines.push('');

  // 4. Students
  sqlLines.push('-- 4. Students (200 Records: 50 per department)');
  for (const st of data.students) {
    sqlLines.push(
      `INSERT INTO students (id, student_code, first_name, last_name, full_name, email, phone, date_of_birth, department_id, class_id, year, semester, section, admission_year, status) VALUES ('${st.id}', '${st.student_code}', '${st.first_name}', '${st.last_name}', '${st.full_name}', '${st.email}', '${st.phone}', '${st.date_of_birth}', '${st.department_id}', '${st.class_id}', ${st.year}, '${st.semester}', '${st.section}', ${st.admission_year}, '${st.status}') ON CONFLICT (id) DO UPDATE SET student_code = EXCLUDED.student_code, full_name = EXCLUDED.full_name;`
    );
  }
  sqlLines.push('');

  // 5. Fee Payments
  sqlLines.push(`-- 5. Fee Payments (${data.fees.length} Records: Multiple per student)`);
  for (const f of data.fees) {
    const pDate = f.payment_date ? `'${f.payment_date}'` : 'NULL';
    const pMethod = f.payment_method ? `'${f.payment_method}'` : 'NULL';
    sqlLines.push(
      `INSERT INTO fee_payments (id, student_id, fee_category, amount_due, amount_paid, payment_status, payment_date, payment_method, semester, academic_year) VALUES ('${f.id}', '${f.student_id}', '${f.fee_category}', ${f.amount_due}, ${f.amount_paid}, '${f.payment_status}', ${pDate}, ${pMethod}, '${f.semester}', '${f.academic_year}') ON CONFLICT (id) DO UPDATE SET amount_due = EXCLUDED.amount_due, amount_paid = EXCLUDED.amount_paid, payment_status = EXCLUDED.payment_status;`
    );
  }
  sqlLines.push('');

  // 6. Attendance Records
  sqlLines.push(`-- 6. Attendance Records (${data.attendance.length} Total: 50 per student)`);
  for (const a of data.attendance) {
    sqlLines.push(
      `INSERT INTO attendance_records (id, student_id, subject_id, class_id, date, status, semester, academic_year) VALUES ('${a.id}', '${a.student_id}', '${a.subject_id}', '${a.class_id}', '${a.date}', '${a.status}', '${a.semester}', '${a.academic_year}') ON CONFLICT (id) DO NOTHING;`
    );
  }
  sqlLines.push('');

  return sqlLines.join('\n');
}

async function runSeed() {
  console.log('Generating deterministic Supabase seed data...');
  const sql = generateSeedSQL();

  const supabaseDir = path.resolve(__dirname, '../supabase');
  if (!fs.existsSync(supabaseDir)) {
    fs.mkdirSync(supabaseDir, { recursive: true });
  }

  const seedFilePath = path.join(supabaseDir, 'seed.sql');
  fs.writeFileSync(seedFilePath, sql, 'utf-8');
  console.log(`✓ Seed SQL written to ${seedFilePath}`);

  if (isSupabaseConfigured()) {
    console.log('Connecting to live Supabase instance to apply seed...');
    const client = getSupabaseClient()!;
    const data = generateDeterministicSeedData();

    // 1. Departments
    console.log('Seeding departments...');
    const { error: deptErr } = await client.from('departments').upsert(data.departments);
    if (deptErr) console.error('Error seeding departments:', deptErr.message);

    // 2. Classes
    console.log('Seeding classes...');
    const { error: clsErr } = await client.from('classes').upsert(data.classes);
    if (clsErr) console.error('Error seeding classes:', clsErr.message);

    // 3. Subjects
    console.log('Seeding subjects...');
    const { error: subErr } = await client.from('subjects').upsert(data.subjects);
    if (subErr) console.error('Error seeding subjects:', subErr.message);

    // 4. Students
    console.log('Seeding 200 students...');
    const { error: stdErr } = await client.from('students').upsert(data.students);
    if (stdErr) console.error('Error seeding students:', stdErr.message);

    // 5. Fees
    console.log(`Seeding ${data.fees.length} fee records...`);
    const { error: feeErr } = await client.from('fee_payments').upsert(data.fees);
    if (feeErr) console.error('Error seeding fees:', feeErr.message);

    // 6. Attendance in chunks of 500
    console.log(`Seeding ${data.attendance.length} attendance records in batches...`);
    const chunkSize = 500;
    for (let i = 0; i < data.attendance.length; i += chunkSize) {
      const chunk = data.attendance.slice(i, i + chunkSize);
      const { error: attErr } = await client.from('attendance_records').upsert(chunk);
      if (attErr) console.error(`Error seeding attendance chunk ${i}:`, attErr.message);
    }

    console.log('✓ Supabase live seeding attempted.');
  } else {
    console.log('ℹ Supabase credentials not configured. Seed SQL generated for manual execution or automated migration.');
  }
}

if (require.main === module) {
  runSeed().catch(console.error);
}
