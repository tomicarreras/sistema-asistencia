"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, ArrowLeft, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/auth"
import type { Group } from "@/lib/types"

interface HistorialAsistenciaProps {
  group: Group
  onBack: () => void
  onViewDay: (date: string) => void
}

interface AttendanceSummary {
  date: string
  total_students: number
  present_count: number
  absent_count: number
}

export default function HistorialAsistencia({ group, onBack, onViewDay }: HistorialAsistenciaProps) {
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAttendanceHistory = async () => {
      try {
        const { user } = await getCurrentUser()
        if (!user) return

        // Get attendance summary by date
        const { data, error } = await supabase
          .from("attendance")
          .select(
            `
            date,
            present,
            student:students(id)
          `,
          )
          .eq("group_id", group.id)
          .order("date", { ascending: false })

        if (error) throw error

        // Group by date and calculate summary
        const summaryMap = new Map<string, AttendanceSummary>()

        data?.forEach((record) => {
          const date = record.date
          if (!summaryMap.has(date)) {
            summaryMap.set(date, {
              date,
              total_students: 0,
              present_count: 0,
              absent_count: 0,
            })
          }

          const summary = summaryMap.get(date)!
          summary.total_students++
          if (record.present) {
            summary.present_count++
          } else {
            summary.absent_count++
          }
        })

        setAttendanceSummary(Array.from(summaryMap.values()))
      } catch (error) {
        console.error("Error loading attendance history:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAttendanceHistory()
  }, [group.id])

  if (loading) {
    return <div className="text-center py-8">Cargando historial...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Historial de Asistencia</h2>
          <p className="text-gray-600">{group.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registro de Asistencias
          </CardTitle>
          <CardDescription>Historial de todas las asistencias tomadas para este grupo.</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceSummary.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No hay registros de asistencia para este grupo.</p>
          ) : (
            <div className="space-y-3">
              {attendanceSummary.map((summary) => (
                <div key={summary.date} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{new Date(summary.date).toLocaleDateString("es-AR")}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Total: {summary.total_students}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Presentes: {summary.present_count}
                      </Badge>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Ausentes: {summary.absent_count}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onViewDay(summary.date)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalle
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
