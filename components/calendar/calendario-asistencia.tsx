"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/auth"
import type { Group } from "@/lib/types"

interface AttendanceData {
  date: string
  group_id: string
  group_name: string
  total_students: number
  present_count: number
  absent_count: number
}

interface CalendarioAsistenciaProps {
  onViewDay: (date: string, groupId: string) => void
}

export default function CalendarioAsistencia({ onViewDay }: CalendarioAsistenciaProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  const loadGroups = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      const { data, error } = await supabase.from("groups").select("*").eq("teacher_id", user.id).order("name")

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error("Error loading groups:", error)
    }
  }

  const loadAttendanceData = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1).toISOString().split("T")[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0]

      let query = supabase
        .from("attendance")
        .select(
          `
          attendance_date,
          present,
          group_id,
          groups!inner(name, teacher_id)
        `,
        )
        .eq("groups.teacher_id", user.id)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate)

      if (selectedGroup !== "all") {
        query = query.eq("group_id", selectedGroup)
      }

      const { data, error } = await query

      if (error) throw error

      // Group by date and group
      const attendanceMap = new Map<string, AttendanceData>()

      data?.forEach((record) => {
        const key = `${record.attendance_date}-${record.group_id}`
        if (!attendanceMap.has(key)) {
          attendanceMap.set(key, {
            date: record.attendance_date,
            group_id: record.group_id,
            group_name: (record.groups as any).name,
            total_students: 0,
            present_count: 0,
            absent_count: 0,
          })
        }

        const attendance = attendanceMap.get(key)!
        attendance.total_students++
        if (record.present) {
          attendance.present_count++
        } else {
          attendance.absent_count++
        }
      })

      setAttendanceData(Array.from(attendanceMap.values()))
    } catch (error) {
      console.error("Error loading attendance data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    loadAttendanceData()
  }, [currentDate, selectedGroup])

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const getAttendanceForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split("T")[0]
    return attendanceData.filter((att) => att.date === dateStr)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendario de Asistencia
              </CardTitle>
              <CardDescription>Vista mensual de todas las asistencias registradas</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todos los grupos</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map((dayName) => (
              <div key={dayName} className="p-2 text-center text-sm font-medium text-gray-600 border-b">
                {dayName}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-2 h-24"></div>
              }

              const dayAttendance = getAttendanceForDay(day)
              const isToday =
                new Date().toDateString() ===
                new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

              return (
                <div
                  key={day}
                  className={`p-2 h-24 border border-gray-200 ${isToday ? "bg-blue-50 border-blue-300" : "bg-white"}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm ${isToday ? "font-bold text-blue-600" : "text-gray-900"}`}>{day}</span>
                  </div>

                  <div className="space-y-1">
                    {dayAttendance.map((attendance) => (
                      <div key={`${attendance.date}-${attendance.group_id}`} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="truncate text-gray-600" title={attendance.group_name}>
                            {attendance.group_name.length > 8
                              ? `${attendance.group_name.substring(0, 8)}...`
                              : attendance.group_name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => onViewDay(attendance.date, attendance.group_id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="default" className="text-xs px-1 py-0 bg-green-100 text-green-800">
                            P: {attendance.present_count}
                          </Badge>
                          <Badge variant="secondary" className="text-xs px-1 py-0 bg-red-100 text-red-800">
                            A: {attendance.absent_count}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {loading && <div className="text-center py-4">Cargando datos...</div>}

          {!loading && attendanceData.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              No hay registros de asistencia para este mes.
              {selectedGroup !== "all" && " Probá seleccionando 'Todos los grupos'."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
              <span>Día actual</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                P: #
              </Badge>
              <span>Estudiantes presentes</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                A: #
              </Badge>
              <span>Estudiantes ausentes</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Ver detalle del día</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
