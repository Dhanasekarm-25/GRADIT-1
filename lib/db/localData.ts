import { Student, Department, Class, User } from './types';

export interface LocalDepartment extends Department {}
export interface LocalClass extends Class {}
export interface LocalSubject {
  id: string;
  code: string;
  name: string;
  department_id: string;
  semester: string;
}

export interface LocalStudent extends Student {
  aliases?: string[];
}

export interface LocalAttendanceRecord {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'OD' | 'LEAVE';
  semester: string;
  academic_year: string;
}

export interface LocalFeeRecord {
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

export interface LocalDatabase {
  departments: LocalDepartment[];
  classes: LocalClass[];
  subjects: LocalSubject[];
  students: LocalStudent[];
  attendance: LocalAttendanceRecord[];
  fees: LocalFeeRecord[];
  users: User[];
}

/**
 * Generates the complete, deterministic 200-student dataset for GRADit! College ERP.
 * 4 Departments: GENAI, MCA, BCA, CS (50 students each = 200 total).
 * 8 Classes, 32 Subjects, 10,000 Attendance records (50 dates x 200 students), Multiple Fee structures.
 */
export function buildLocalDatabase(): LocalDatabase {
  // 1. Departments
  const departments: LocalDepartment[] = [
    { id: 'dept-genai', code: 'GENAI', name: 'Generative AI' },
    { id: 'dept-mca', code: 'MCA', name: 'Master of Computer Applications' },
    { id: 'dept-bca', code: 'BCA', name: 'Bachelor of Computer Applications' },
    { id: 'dept-cs', code: 'CS', name: 'Computer Science' },
    // Aliases commonly queried in ERP
    { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering' },
    { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering' },
    { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering' },
    { id: 'dept-eee', code: 'EEE', name: 'Electrical & Electronics Engineering' },
    { id: 'dept-it', code: 'IT', name: 'Information Technology' },
    { id: 'dept-civil', code: 'CIVIL', name: 'Civil Engineering' },
  ];

  // 2. Classes (8 core sections + section aliases)
  const classes: LocalClass[] = [
    { id: 'cls-genai-a', code: 'GENAI-A', name: 'GENAI Year 2 Sec A', department_id: 'dept-genai' },
    { id: 'cls-genai-b', code: 'GENAI-B', name: 'GENAI Year 2 Sec B', department_id: 'dept-genai' },
    { id: 'cls-mca-a', code: 'MCA-A', name: 'MCA Year 2 Sec A', department_id: 'dept-mca' },
    { id: 'cls-mca-b', code: 'MCA-B', name: 'MCA Year 2 Sec B', department_id: 'dept-mca' },
    { id: 'cls-bca-a', code: 'BCA-A', name: 'BCA Year 2 Sec A', department_id: 'dept-bca' },
    { id: 'cls-bca-b', code: 'BCA-B', name: 'BCA Year 2 Sec B', department_id: 'dept-bca' },
    { id: 'cls-cs-a', code: 'CS-A', name: 'CS Year 2 Sec A', department_id: 'dept-cs' },
    { id: 'cls-cs-b', code: 'CS-B', name: 'CS Year 2 Sec B', department_id: 'dept-cs' },
    // Aliases
    { id: 'cls-cse-a', code: 'CSE-A', name: 'CSE Section A', department_id: 'dept-cs' },
    { id: 'cls-cse-b', code: 'CSE-B', name: 'CSE Section B', department_id: 'dept-cs' },
    { id: 'cls-cs101', code: '23CS101', name: 'CSE Year 2 Sec A', department_id: 'dept-cs' },
    { id: 'cls-cs102', code: '23CS102', name: 'CSE Year 2 Sec B', department_id: 'dept-cs' },
    { id: 'cls-ec201', code: '23EC201', name: 'ECE Year 2 Sec A', department_id: 'dept-ece' },
    { id: 'cls-me301', code: '23ME301', name: 'MECH Year 3 Sec A', department_id: 'dept-mech' },
  ];

  // 3. Subjects (8 per department)
  const subjects: LocalSubject[] = [
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
    { id: 'sub-cs-1', code: 'CS301', name: 'Programming in C++', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-2', code: 'CS302', name: 'Data Structures & Algorithms', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-3', code: 'CS303', name: 'Design and Analysis of Algorithms', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-4', code: 'CS304', name: 'Operating Systems', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-5', code: 'CS305', name: 'Computer Networks', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-6', code: 'CS306', name: 'Database Management Systems', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-7', code: 'CS307', name: 'Software Engineering', department_id: 'dept-cs', semester: 'S3' },
    { id: 'sub-cs-8', code: 'CS308', name: 'Artificial Intelligence', department_id: 'dept-cs', semester: 'S3' },
  ];

  // 4. Students (Exactly 200 Students: 50 per department)
  const firstNamesPool = [
    'Aarav', 'Aditya', 'Akash', 'Alok', 'Amit', 'Archana', 'Bhavna', 'Deepa',
    'Deepak', 'Divya', 'Gaurav', 'Ishaan', 'Ishita', 'Kabir', 'Karthik', 'Kavya', 'Kunal',
    'Manish', 'Meera', 'Monika', 'Naveen', 'Neetu', 'Nikhil', 'Pallavi', 'Payal', 'Pooja', 'Prateek',
    'Preeti', 'Rajesh', 'Rashmi', 'Ritu', 'Sachin', 'Sandhya', 'Shilpa',
    'Shweta', 'Siddharth', 'Sneha', 'Sunil', 'Suresh', 'Swati', 'Tanvi', 'Tarun', 'Varun'
  ];

  const lastNamesPool = [
    'Aggarwal', 'Arora', 'Bahl', 'Banerjee', 'Bansal', 'Bhat', 'Bhatia', 'Bose', 'Chadha', 'Chatterjee',
    'Chopra', 'Das', 'Deshmukh', 'Dutta', 'Ghosh', 'Goyal', 'Gupta', 'Iyer', 'Jain', 'Joshi',
    'Kapoor', 'Kohli', 'Kulkarni', 'Kumar', 'Malhotra', 'Mehta', 'Menon', 'Mishra', 'Mittal', 'Modi',
    'Mukherjee', 'Nair', 'Pandey', 'Parekh', 'Patel', 'Pillai', 'Rao', 'Reddy', 'Roy', 'Sarin',
    'Saxena', 'Sen', 'Sethi', 'Shah', 'Singhal', 'Thakur', 'Vora'
  ];

  const deptConfigs = [
    { code: 'GENAI', deptId: 'dept-genai', classA: 'cls-genai-a', classB: 'cls-genai-b' },
    { code: 'MCA', deptId: 'dept-mca', classA: 'cls-mca-a', classB: 'cls-mca-b' },
    { code: 'BCA', deptId: 'dept-bca', classA: 'cls-bca-a', classB: 'cls-bca-b' },
    { code: 'CS', deptId: 'dept-cs', classA: 'cls-cs-a', classB: 'cls-cs-b' },
  ];

  const students: LocalStudent[] = [];
  let globalStudentCounter = 0;

  for (const dept of deptConfigs) {
    for (let i = 1; i <= 50; i++) {
      globalStudentCounter++;
      const codeNum = String(i).padStart(3, '0');
      let studentCode = `${dept.code}23${codeNum}`;
      let aliases: string[] = [];
      
      let fn: string;
      let ln: string;

      // Deterministic Anchors & Ambiguity Test Profiles
      if (dept.code === 'CS' && i === 1) {
        fn = 'Rohan';
        ln = 'Sharma';
        studentCode = '23CS101'; // Primary code in unit & golden tests
        aliases = ['CS23001', '23CS101'];
      } else if (dept.code === 'CS' && i === 2) {
        fn = 'Arun';
        ln = 'Kumar';
        studentCode = '23CS102'; // Primary code in unit tests
        aliases = ['CS23002', '23CS102'];
      } else if (dept.code === 'GENAI' && i === 2) {
        fn = 'Arun';
        ln = 'Kumar'; // 2nd Arun Kumar for multi-match testing
        aliases = ['23EC205', 'GENAI23002'];
      } else if (dept.code === 'BCA' && i === 2) {
        fn = 'Arun';
        ln = 'Raj'; // 3rd Arun for ambiguity testing
        aliases = ['BCA23002'];
      } else if (dept.code === 'MCA' && i === 2) {
        fn = 'Arun';
        ln = 'Prakash'; // 4th Arun for ambiguity testing
        aliases = ['MCA23002'];
      } else if (dept.code === 'CS' && i === 3) {
        fn = 'Priya';
        ln = 'Verma';
        aliases = ['CS23003'];
      } else if (dept.code === 'CS' && i === 4) {
        fn = 'Vikram';
        ln = 'Singh';
        aliases = ['CS23004'];
      } else if (dept.code === 'CS' && i === 5) {
        fn = 'Ananya';
        ln = 'Roy';
        aliases = ['CS23005'];
      } else if (dept.code === 'CS' && i === 6) {
        fn = 'Rahul';
        ln = 'Nair';
        aliases = ['CS23006'];
      } else if (dept.code === 'CS' && i === 7) {
        fn = 'Harini';
        ln = 'Devi';
        studentCode = '23CS105'; // Primary code in unit tests
        aliases = ['CS23007', '23CS105'];
      } else if (dept.code === 'GENAI' && i === 1) {
        fn = 'Amit';
        ln = 'Goyal';
      } else if (dept.code === 'GENAI' && i === 27) {
        fn = 'Rahul';
        ln = 'Singh'; // Tested in unit tests (GENAI23027)
        aliases = ['GENAI23027'];
      } else if (dept.code === 'MCA' && i === 1) {
        fn = 'Pooja';
        ln = 'Kapoor';
      } else if (dept.code === 'MCA' && i === 3) {
        fn = 'Rashmi';
        ln = 'Bhatia'; // Tested in unit tests (MCA23003)
        aliases = ['MCA23003'];
      } else if (dept.code === 'MCA' && i === 27) {
        fn = 'Akash';
        ln = 'Kapoor'; // Tested in unit tests (MCA23027)
        aliases = ['MCA23027'];
      } else if (dept.code === 'BCA' && i === 1) {
        fn = 'Deepak';
        ln = 'Bansal'; // Tested in unit tests (Deepak Bansal != Deepak Singh)
      } else if (dept.code === 'BCA' && i === 37) {
        fn = 'Monika';
        ln = 'Mukherjee'; // Tested in unit tests (BCA23037)
        aliases = ['BCA23037'];
      } else {
        const fnIdx = (globalStudentCounter * 7 + 13) % firstNamesPool.length;
        const lnIdx = (globalStudentCounter * 11 + 23) % lastNamesPool.length;
        fn = firstNamesPool[fnIdx];
        ln = lastNamesPool[lnIdx];
        // Ensure anchor names are strictly controlled
        if (fn === 'Rohan') fn = 'Karthik';
        if (ln === 'Sharma') ln = 'Mittal';
        if (fn === 'Harini') fn = 'Divya';
        if (fn === 'Ananya') fn = 'Tanvi';
        if (fn === 'Vikram') fn = 'Siddharth';
      }

      const isSecA = i <= 25;
      const classId = isSecA ? dept.classA : dept.classB;
      const section = isSecA ? 'A' : 'B';
      
      const year = (i % 4) + 1;
      const semester = year === 1 ? 'S1' : year === 2 ? 'S3' : year === 3 ? 'S5' : 'S7';
      const admissionYear = 2025 - year;

      students.push({
        id: `std-${dept.code.toLowerCase()}-${codeNum}`,
        student_code: studentCode,
        first_name: fn,
        last_name: ln,
        name: `${fn} ${ln}`,
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
        aliases,
      });
    }
  }

  // 5. Attendance Generation (50 sessions per student = 10,000 records)
  const attendance: LocalAttendanceRecord[] = [];
  const targetPercentages = [
    40, 48, 56, 59,
    62, 65, 68, 70, 72, 74,
    75, 75, 76, 78, 80, 82, 82, 84,
    86, 88, 90, 90, 92, 94,
    96, 98, 100
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
    if (student.student_code === '23CS101' || student.aliases?.includes('CS23001')) targetPct = 82; // Rohan Sharma 82%
    if (student.student_code === '23CS102' || student.aliases?.includes('CS23002')) targetPct = 90; // Arun Kumar (CS) 90%
    if (student.aliases?.includes('CS23003')) targetPct = 60; // Priya Verma 60%
    if (student.aliases?.includes('CS23004')) targetPct = 40; // Vikram Singh 40%
    if (student.aliases?.includes('CS23005')) targetPct = 96; // Ananya Roy 96%
    if (student.aliases?.includes('CS23006')) targetPct = 75; // Rahul Nair exactly 75%
    if (student.student_code === '23CS105' || student.aliases?.includes('CS23007')) targetPct = 85; // Harini Devi 85%

    const presentCount = Math.round((targetPct / 100) * dates.length);

    for (let dIdx = 0; dIdx < dates.length; dIdx++) {
      const sub = deptSubjects[dIdx % deptSubjects.length] || deptSubjects[0];
      let status: 'PRESENT' | 'ABSENT' | 'OD' | 'LEAVE';
      if (student.student_code === '23CS101') {
        status = dIdx < 41 ? 'PRESENT' : 'ABSENT';
      } else {
        const isPresent = dIdx < presentCount;
        status = isPresent
          ? 'PRESENT'
          : dIdx % 8 === 0
          ? 'OD'
          : dIdx % 6 === 0
          ? 'LEAVE'
          : 'ABSENT';
      }

      attendance.push({
        id: `att-${student.id}-${dIdx + 1}`,
        student_id: student.id,
        subject_id: sub.id,
        class_id: student.class_id,
        date: dates[dIdx],
        status,
        semester: student.semester || 'S3',
        academic_year: '2025-2026',
      });
    }
  }

  // 6. Fee Generation
  const fees: LocalFeeRecord[] = [];
  const feeStatusCycles: ('PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE')[] = [
    'PAID', 'PAID', 'PARTIAL', 'PENDING', 'OVERDUE', 'PAID', 'PARTIAL', 'PAID'
  ];

  for (let sIdx = 0; sIdx < students.length; sIdx++) {
    const student = students[sIdx];
    const statusCycle = feeStatusCycles[sIdx % feeStatusCycles.length];

    if (student.student_code === '23CS101') {
      // Rohan Sharma: strictly 85000 fully paid tuition fee
      fees.push({
        id: `fee-${student.id}-tuition`,
        student_id: student.id,
        fee_category: 'Tuition',
        amount_due: 85000,
        amount_paid: 85000,
        payment_status: 'PAID',
        payment_date: '2026-03-15',
        payment_method: 'ONLINE_TRANSFER',
        semester: student.semester || 'S3',
        academic_year: '2025-2026',
      });
      continue;
    }

    let tuitionDue = 65000;
    let tuitionPaid = 65000;
    let tuitionStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' = 'PAID';
    let tuitionDate: string | null = '2026-03-15';
    let tuitionMethod: string | null = 'ONLINE_TRANSFER';

    if (student.student_code === '23CS102' || student.aliases?.includes('CS23002')) {
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
      semester: student.semester || 'S3',
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
      semester: student.semester || 'S3',
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
      semester: student.semester || 'S3',
      academic_year: '2025-2026',
    });

    // Record 4: Optional Transport / Hostel Fee for a subset
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
        semester: student.semester || 'S3',
        academic_year: '2025-2026',
      });
    }
  }

  // 7. Users
  const users: User[] = [
    { id: 'usr-1', name: 'Dr. Sarah Connor', email: 'sarah.faculty@gradit.edu', role: 'FACULTY', department_id: 'dept-genai' },
    { id: 'usr-2', name: 'Admin Dean Vance', email: 'admin@gradit.edu', role: 'ADMIN' },
    { id: 'usr-3', name: 'Student Alex', email: 'alex@student.gradit.edu', role: 'STUDENT' },
  ];

  return { departments, classes, subjects, students, attendance, fees, users };
}

// Global Singleton local database instance
export const localDatabase = buildLocalDatabase();
