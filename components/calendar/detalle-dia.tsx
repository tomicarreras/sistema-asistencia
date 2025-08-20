"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Users, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Group } from "@/lib/types"

interface DetalleDiaProps {
  date: string
  groupId: string
  onBack: () => void
}

interface StudentAttendance {
  id: string
  student_name: string
  student_email: string
  present: boolean
  notes?: string
}

export default function DetalleDia({ date, groupId, onBack }: DetalleDiaProps) {
  const [group, setGroup] = useState<Group | null>(null)
  const [attendance, setAttendance] = useState<StudentAttendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDayDetails = async () => {
      try {
        // Load group details
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single()

        if (groupError) throw groupError
        setGroup(groupData)

        // Load attendance for the specific day
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select(
            `
            id,
            present,
            notes,
            students(full_name, email)
          `,
          )
          .eq("group_id", groupId)
          .eq("date", date)
          .order("students(full_name)")

        if (attendanceError) throw attendanceError

        const formattedAttendance: StudentAttendance[] =
          attendanceData?.map((record) => ({
            id: record.id,
            student_name: (record.students as any).full_name,
            student_email: (record.students as any).email,
            present: record.present,
            notes: record.notes,
          })) || []

        setAttendance(formattedAttendance)
      } catch (error) {
        console.error("Error loading day details:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDayDetails()
  }, [date, groupId])

  if (loading) {
    return <div className="text-center py-8">Cargando detalles...</div>
  }

  if (!group) {
    return <div className="text-center py-8">Grupo no encontrado</div>
  }

  const presentCount = attendance.filter((a) => a.present).length
  const absentCount = attendance.filter((a) => !a.present).length
  const totalCount = attendance.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Calendario
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Detalle de Asistencia</h2>
          <p className="text-gray-600">
            {group.name} - {new Date(date).toLocaleDateString("es-AR")}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumen del Día
          </CardTitle>
          <CardDescription>
            {group.place} - {group.schedule_time && `${group.schedule_time} - `}
            {new Date(date).toLocaleDateString("es-AR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-600" />
              <span className="text-lg font-semibold">Total: {totalCount}</span>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800 text-base px-3 py-1">
              <CheckCircle className="h-4 w-4 mr-1" />
              Presentes: {presentCount}
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-800 text-base px-3 py-1">
              <XCircle className="h-4 w-4 mr-1" />
              Ausentes: {absentCount}
            </Badge>
            <div className="text-sm text-gray-600">
              Asistencia: {totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No hay registros de asistencia para este día.</p>
          ) : (
            <div className="space-y-3">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className={`p-4 border rounded-lg ${
                    record.present ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {record.present ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <h4 className="font-medium">{record.student_name}</h4>
                          <p className="text-sm text-gray-600">{record.student_email}</p>
                        </div>
                      </div>
                      {record.notes && (
                        <div className="mt-2 ml-8">
                          <p className="text-sm text-gray-700">
                            <strong>Notas:</strong> {record.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <Badge variant={record.present ? "default" : "secondary"} className="ml-4">
                      {record.present ? "Presente" : "Ausente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
