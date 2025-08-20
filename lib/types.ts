export interface Teacher {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}

export interface Group {
  id: string
  name: string
  description?: string
  place: string
  schedule_date: string
  schedule_time?: string
  teacher_id: string
  created_at: string
  updated_at: string
  teacher?: Teacher
}

export interface Student {
  id: string
  email: string
  full_name: string
  national_id: string
  birth_date?: string
  group_id: string
  created_at: string
  updated_at: string
  group?: Group
}

export interface Attendance {
  id: string
  student_id: string
  group_id: string
  attendance_date: string
  present: boolean
  notes?: string
  marked_by: string
  created_at: string
  updated_at: string
  student?: Student
  group?: Group
  teacher?: Teacher
}

export interface AttendanceRecord {
  student: Student
  present: boolean
  notes?: string
}
