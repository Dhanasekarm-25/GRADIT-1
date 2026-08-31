import { generateDeterministicSeedData } from '../scripts/seed';

const dataset = generateDeterministicSeedData();

// Build in-memory table store for unit testing the Supabase PostgREST query builder
export function createMockSupabaseClient() {
  return {
    from: (tableName: string) => {
      let currentData: any[] = [];
      if (tableName === 'students') {
        currentData = [
          { id: 'std-23cs101', student_code: '23CS101', first_name: 'Rohan', last_name: 'Sharma', full_name: 'Rohan Sharma', email: 'rohan.sharma@student.gradit.edu', phone: '+91 98765 43210', date_of_birth: '2004-05-14', department_id: 'dept-cs', class_id: 'cls-cs-a', year: 2, semester: 'S3', section: 'A', admission_year: 2023, status: 'ACTIVE' },
          { id: 'std-arun1', student_code: '23CS102', first_name: 'Arun', last_name: 'Kumar', full_name: 'Arun Kumar', email: 'arun.kumar@student.gradit.edu', phone: '+91 98765 43211', date_of_birth: '2004-06-20', department_id: 'dept-cs', class_id: 'cls-cs-a', year: 2, semester: 'S3', section: 'A', admission_year: 2023, status: 'ACTIVE' },
          { id: 'std-arun2', student_code: '23EC205', first_name: 'Arun', last_name: 'Kumar', full_name: 'Arun Kumar', email: 'arun.kumar2@student.gradit.edu', phone: '+91 98765 43212', date_of_birth: '2004-07-11', department_id: 'dept-ece', class_id: 'cls-ece-a', year: 2, semester: 'S3', section: 'A', admission_year: 2023, status: 'ACTIVE' },
          ...dataset.students,
        ];
      } else if (tableName === 'departments') {
        currentData = [
          ...dataset.departments,
          { id: 'dept-cse', code: 'CSE', name: 'Computer Science & Engineering' },
          { id: 'dept-ece', code: 'ECE', name: 'Electronics & Communication Engineering' },
          { id: 'dept-mech', code: 'MECH', name: 'Mechanical Engineering' },
          { id: 'dept-eee', code: 'EEE', name: 'Electrical & Electronics Engineering' },
          { id: 'dept-it', code: 'IT', name: 'Information Technology' },
          { id: 'dept-civil', code: 'CIVIL', name: 'Civil Engineering' },
        ];
      } else if (tableName === 'classes') {
        currentData = [
          ...dataset.classes,
          { id: 'cls-cs101', code: '23CS101', name: 'CSE Year 2 Sec A', department_id: 'dept-cs' },
          { id: 'cls-cs102', code: '23CS102', name: 'CSE Year 2 Sec B', department_id: 'dept-cs' },
          { id: 'cls-ec201', code: '23EC201', name: 'ECE Year 2 Sec A', department_id: 'dept-ece' },
          { id: 'cls-me301', code: '23ME301', name: 'MECH Year 3 Sec A', department_id: 'dept-mech' },
          { id: 'cls-cse-a', code: 'CSE-A', name: 'CSE Section A', department_id: 'dept-cs' },
          { id: 'cls-cse-b', code: 'CSE-B', name: 'CSE Section B', department_id: 'dept-cs' },
        ];
      } else if (tableName === 'attendance_records') {
        currentData = [
          ...Array.from({ length: 41 }, (_, i) => ({ id: `att-rohan-${i}`, student_id: 'std-23cs101', status: 'PRESENT', semester: 'S3', academic_year: '2025-2026' })),
          ...Array.from({ length: 9 }, (_, i) => ({ id: `att-rohan-abs-${i}`, student_id: 'std-23cs101', status: 'ABSENT', semester: 'S3', academic_year: '2025-2026' })),
          ...dataset.attendance,
        ];
      } else if (tableName === 'fee_payments') {
        currentData = [
          { id: 'fee-1', student_id: 'std-23cs101', amount_due: 85000, amount_paid: 85000, payment_status: 'PAID', semester: 'S3', academic_year: '2025-2026' },
          ...dataset.fees,
        ];
      } else if (tableName === 'users') {
        currentData = [
          { id: 'usr-1', name: 'Dr. Sarah Connor', email: 'sarah.faculty@gradit.edu', role: 'FACULTY', department_id: 'dept-genai' },
          { id: 'usr-2', name: 'Admin Dean Vance', email: 'admin@gradit.edu', role: 'ADMIN' },
          { id: 'usr-3', name: 'Student Alex', email: 'alex@student.gradit.edu', role: 'STUDENT' },
        ];
      }

      const builder: any = {
        _data: currentData,
        select: (fields?: string) => {
          return builder;
        },
        eq: (col: string, val: any) => {
          builder._data = builder._data.filter((row: any) => row[col] === val);
          return builder;
        },
        ilike: (col: string, pattern: string) => {
          const hasWildcard = pattern.startsWith('%') || pattern.endsWith('%');
          const cleanPattern = pattern.replace(/^%+|%+$/g, '').toLowerCase().trim();
          builder._data = builder._data.filter((row: any) => {
            const val = String(row[col] || '').toLowerCase().trim();
            if (hasWildcard) return val.includes(cleanPattern);
            return val === cleanPattern;
          });
          return builder;
        },
        or: (conditionString: string) => {
          const parts = conditionString.split(',');
          builder._data = builder._data.filter((row: any) => {
            return parts.some((p) => {
              const [col, op, ...rest] = p.split('.');
              const rawTarget = rest.join('.');
              const hasWildcard = rawTarget.startsWith('%') || rawTarget.endsWith('%');
              const target = rawTarget.replace(/^%+|%+$/g, '').toLowerCase().trim();
              const val = String(row[col] || '').toLowerCase().trim();
              if (op === 'eq') return val === target;
              if (op === 'ilike') return hasWildcard ? val.includes(target) : val === target;
              return false;
            });
          });
          return builder;
        },
        limit: (n: number) => {
          builder._data = builder._data.slice(0, n);
          return builder;
        },
        maybeSingle: async () => {
          return { data: builder._data[0] || null, error: null };
        },
        then: (resolve: (val: any) => void) => {
          resolve({ data: builder._data, error: null });
        },
      };

      return builder;
    },
  };
}
