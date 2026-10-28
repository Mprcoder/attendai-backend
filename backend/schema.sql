-- ============================================================================
-- AttendAI (Virtual Coordinator AI) - Supabase PostgreSQL Schema
-- Run this script in the Supabase SQL Editor
-- ============================================================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Table: students
-- Core required columns: id, name, roll_no, student_phone, created_at
-- Extended UI columns (matching AttendAI PDF): email, branch, year, account_status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    roll_no VARCHAR(32) NOT NULL,
    student_phone VARCHAR(25) NOT NULL,
    email TEXT,
    branch VARCHAR(16) NOT NULL DEFAULT 'CSE',
    year VARCHAR(16) NOT NULL DEFAULT '2nd',
    account_status VARCHAR(16) NOT NULL DEFAULT 'Active' CHECK (account_status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_students_branch_roll UNIQUE (branch, roll_no)
);

-- ----------------------------------------------------------------------------
-- 2. Table: attendance_logs
-- Core required columns: id, student_id (FK), date, status, absentee_reason, call_id, created_at
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(16) NOT NULL CHECK (status IN ('Present', 'Absent', 'Leave')),
    absentee_reason TEXT DEFAULT NULL,
    call_id TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_attendance_date UNIQUE (student_id, date)
);

-- ----------------------------------------------------------------------------
-- 3. Performance Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON public.attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student_id ON public.attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_status ON public.attendance_logs(status);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_call_id ON public.attendance_logs(call_id) WHERE call_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 4. Seed Data (Matching the AttendAI UI PDF)
-- ----------------------------------------------------------------------------
INSERT INTO public.students (name, roll_no, student_phone, email, branch, year, account_status)
VALUES
    ('Aarav Mehta', '01', '+91 98765 43210', 'aarav@college.edu', 'CSE', '2nd', 'Active'),
    ('Sara Khan', '02', '+91 91234 56770', 'sara@college.edu', 'CSD', '2nd', 'Active'),
    ('John Dsouza', '03', '+91 94150 28836', 'john@college.edu', 'ME', '2nd', 'Active'),
    ('Neha Patel', '04', '+91 87654 12098', 'neha@college.edu', 'IT', '3rd', 'Active'),
    ('Rohan Singh', '05', '+91 90123 45678', 'rohan@college.edu', 'CSE', '3rd', 'Inactive'),
    ('Priya Verma', '06', '+91 93056 77412', 'priya@college.edu', 'EC', '1st', 'Active'),
    ('Karan Yadav', '14', '+91 98391 20456', 'karan@college.edu', 'CSE', '1st', 'Active'),
    ('Ishita Roy', '22', '+91 99887 76651', 'ishita@college.edu', 'CSD', '2nd', 'Active'),
    ('Vikas Gupta', '19', '+91 70071 33482', 'vikas@college.edu', 'IT', '3rd', 'Active'),
    ('Aditya Rao', '11', '+91 88090 14567', 'aditya@college.edu', 'EC', '4th', 'Active'),
    ('Rahul Mishra', '25', '+91 96280 90314', 'rahul@college.edu', 'ME', '4th', 'Active')
ON CONFLICT (branch, roll_no) DO NOTHING;
