-- ============================================================
-- GRADit! College ERP — Supabase PostgreSQL Schema
-- ============================================================

-- 1. Departments Table (4 core departments)
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Classes Table (8 sections: GENAI-A/B, MCA-A/B, BCA-A/B, CS-A/B)
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    semester TEXT DEFAULT 'S3',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Students Table (200 students: 50 per department)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    student_code TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    year INT DEFAULT 2,
    semester TEXT DEFAULT 'S3',
    section TEXT DEFAULT 'A',
    admission_year INT DEFAULT 2023,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Attendance Records Table (6 months test data)
CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'OD', 'LEAVE')),
    semester TEXT NOT NULL DEFAULT 'S3',
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fee Structures Table
CREATE TABLE IF NOT EXISTS fee_structures (
    id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    fee_category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    semester TEXT DEFAULT 'S3',
    academic_year TEXT DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Fee Payments Table (6 months fee records)
CREATE TABLE IF NOT EXISTS fee_payments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_category TEXT NOT NULL DEFAULT 'Tuition',
    amount_due NUMERIC(10, 2) NOT NULL CHECK (amount_due >= 0),
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    balance NUMERIC(10, 2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
    payment_status TEXT NOT NULL CHECK (payment_status IN ('PAID', 'PARTIAL', 'PENDING', 'OVERDUE')),
    payment_date DATE,
    payment_method TEXT,
    semester TEXT NOT NULL DEFAULT 'S3',
    academic_year TEXT NOT NULL DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_positive_balance CHECK (amount_due >= amount_paid)
);

-- ============================================================
-- Performance Indexes for Chatbot Lookups
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students (student_code);
CREATE INDEX IF NOT EXISTS idx_students_full_name ON students (full_name);
CREATE INDEX IF NOT EXISTS idx_students_first_name ON students (first_name);
CREATE INDEX IF NOT EXISTS idx_students_last_name ON students (last_name);
CREATE INDEX IF NOT EXISTS idx_students_department_id ON students (department_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students (class_id);

CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance_records (student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance_records (subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance_records (class_id);

CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments (student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments (payment_status);
