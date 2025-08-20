"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ArrowLeft, Save, Calendar, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/auth"
import type { Group, Student, AttendanceRecord } from "@/lib/types"

interface TomarAsistenciaProps {
  group: Group
  onBack: () => void
}

export default function TomarAsistencia({ group, onBack }: TomarAsistenciaProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [existingAttendance, setExistingAttendance] = useState<any[]>([])

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase.from("students").select("*").eq("group_id", group.id).order("full_name")

      if (error) throw error

      const studentsData = data || []
      setStudents(studentsData)

      // Initialize attendance records
      const initialRecords: AttendanceRecord[] = studentsData.map((student) => ({
        student,
        present: false,
        notes: "",
      }))
      setAttendanceRecords(initialRecords)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const loadExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("group_id", group.id)
        .eq("date", attendanceDate)

      if (error) throw error

      setExistingAttendance(data || [])

      // Update attendance records with existing data
      if (data && data.length > 0) {
        setAttendanceRecords((prev) =>
          prev.map((record) => {
            const existing = data.find((att) => att.student_id === record.student.id)
            return existing
              ? {
                  ...record,
                  present: existing.present,
                  notes: existing.notes || "",
                }
              : record
          }),
        )
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [group.id])

  useEffect(() => {
    if (students.length > 0) {
      loadExistingAttendance()
    }
  }, [attendanceDate, students])

  const handleAttendanceChange = (studentId: string, present: boolean) => {
    setAttendanceRecords((prev) =>
      prev.map((record) => (record.student.id === studentId ? { ...record, present } : record)),
    )
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record) => (record.student.id === studentId ? { ...record, notes } : record)),
    )
  }

  const handleSaveAttendance = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { user } = await getCurrentUser()
      if (!user) throw new Error("Usuario no autenticado")

      // Delete existing attendance for this date and group
      await supabase.from("attendance").delete().eq("group_id", group.id).eq("date", attendanceDate)

      // Insert new attendance records
      const attendanceData = attendanceRecords.map((record) => ({
        student_id: record.student.id,
        group_id: group.id,
        date: attendanceDate,
        present: record.present,
        notes: record.notes || null,
        marked_by: user.id,
      }))

      const { error: insertError } = await supabase.from("attendance").insert(attendanceData)

      if (insertError) throw insertError

      setSuccess("Asistencia guardada exitosamente")
      loadExistingAttendance()
    } catch (err: any) {
      setError(err.message)
    }

    setLoading(false)
  }

  const presentCount = attendanceRecords.filter((record) => record.present).length
  const totalCount = attendanceRecords.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{group.name}</h2>
          <p className="text-gray-600">
            {group.place} - {new Date(group.schedule_date).toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tomar Asistencia
          </CardTitle>
          <CardDescription>Seleccioná la fecha y marcá la asistencia de cada estudiante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <label htmlFor="attendanceDate" className="text-sm font-medium">
                Fecha de Asistencia
              </label>
              <Input
                id="attendanceDate"
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                Presentes: {presentCount} / {totalCount}
              </span>
            </div>
          </div>

          {existingAttendance.length > 0 && (
            <Alert>
              <AlertDescription>
                Ya existe asistencia registrada para esta fecha. Los cambios sobrescribirán los datos anteriores.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No hay estudiantes en este grupo.</p>
          ) : (
            <div className="space-y-4">
              {attendanceRecords.map((record) => (
                <div key={record.student.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center space-x-2 pt-1">
                      <Checkbox
                        id={`present-${record.student.id}`}
                        checked={record.present}
                        onCheckedChange={(checked) => handleAttendanceChange(record.student.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`present-${record.student.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Presente
                      </label>
                    </div>

                    <div className="flex-1">
                      <h4 className="font-medium">{record.student.full_name}</h4>
                      <div className="flex gap-4 text-sm text-gray-600 mb-2">
                        <span>{record.student.email}</span>
                        <span>DNI: {record.student.national_id}</span>
                      </div>

                      <Textarea
                        placeholder="Notas opcionales..."
                        value={record.notes}
                        onChange={(e) => handleNotesChange(record.student.id, e.target.value)}
                        className="mt-2"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button onClick={handleSaveAttendance} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Asistencia
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
