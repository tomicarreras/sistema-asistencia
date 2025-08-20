-- Modificando para usar Supabase Auth en lugar de tabla teachers personalizada
-- Creating database schema for attendance management system

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teachers table for profile data (uses Supabase Auth IDs)
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table (created by teachers)
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    place VARCHAR(255) NOT NULL,
    schedule_date DATE NOT NULL,
    schedule_time TIME,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table (members of groups)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50) NOT NULL,
    birth_date DATE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, group_id),
    UNIQUE(national_id, group_id)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    present BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    marked_by UUID NOT NULL REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, group_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_group_id ON attendance(group_id);
CREATE INDEX IF NOT EXISTS idx_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_students_birth_date ON students(birth_date);

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Teachers can view own profile" ON teachers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teachers can update own profile" ON teachers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teachers can insert own profile" ON teachers FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can manage own groups" ON groups FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can view students in own groups" ON students FOR SELECT USING (group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can manage students in own groups" ON students FOR ALL USING (group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can manage attendance for own groups" ON attendance FOR ALL USING (group_id IN (SELECT id FROM groups WHERE teacher_id = auth.uid()));
