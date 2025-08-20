"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, Calendar, Users, Cake } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/auth"

interface StudentBirthday {
  id: string
  full_name: string
  email: string
  birth_date: string
  group_name: string
  group_id: string
  days_until_birthday: number
  age_turning: number
}

export default function SeccionCumpleanos() {
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<StudentBirthday[]>([])
  const [todayBirthdays, setTodayBirthdays] = useState<StudentBirthday[]>([])
  const [loading, setLoading] = useState(true)

  const calculateDaysUntilBirthday = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    const currentYear = today.getFullYear()

    // Set birthday to current year
    let nextBirthday = new Date(currentYear, birth.getMonth(), birth.getDate())

    // If birthday already passed this year, set to next year
    if (nextBirthday < today) {
      nextBirthday = new Date(currentYear + 1, birth.getMonth(), birth.getDate())
    }

    const diffTime = nextBirthday.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()

    // Check if birthday hasn't occurred this year yet
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age + 1 // Age they will turn
  }

  const loadBirthdays = async () => {
    try {
      const { user } = await getCurrentUser()
      if (!user) return

      const { data, error } = await supabase
        .from("students")
        .select(
          `
          id,
          full_name,
          email,
          birth_date,
          groups!inner(name, teacher_id)
        `,
        )
        .eq("groups.teacher_id", user.id)
        .not("birth_date", "is", null)
        .order("full_name")

      if (error) throw error

      const studentsWithBirthdays: StudentBirthday[] =
        data
          ?.map((student) => {
            const daysUntil = calculateDaysUntilBirthday(student.birth_date)
            return {
              id: student.id,
              full_name: student.full_name,
              email: student.email,
              birth_date: student.birth_date,
              group_name: (student.groups as any).name,
              group_id: (student.groups as any).id,
              days_until_birthday: daysUntil,
              age_turning: calculateAge(student.birth_date),
            }
          })
          .filter((student) => student.days_until_birthday <= 90) // Show next 3 months
          .sort((a, b) => a.days_until_birthday - b.days_until_birthday) || []

      // Separate today's birthdays from upcoming ones
      const today = studentsWithBirthdays.filter((s) => s.days_until_birthday === 0)
      const upcoming = studentsWithBirthdays.filter((s) => s.days_until_birthday > 0)

      setTodayBirthdays(today)
      setUpcomingBirthdays(upcoming)
    } catch (error) {
      console.error("Error loading birthdays:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBirthdays()
  }, [])

  const formatBirthDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
    })
  }

  const getDaysText = (days: number) => {
    if (days === 0) return "¡Hoy!"
    if (days === 1) return "Mañana"
    if (days <= 7) return `En ${days} días`
    if (days <= 30) return `En ${days} días`
    return `En ${Math.ceil(days / 7)} semanas`
  }

  if (loading) {
    return <div className="text-center py-8">Cargando cumpleaños...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Gift className="h-6 w-6 text-pink-600" />
        <h2 className="text-2xl font-bold">Próximos Cumpleaños</h2>
      </div>

      {/* Today's Birthdays */}
      {todayBirthdays.length > 0 && (
        <Card className="border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-pink-700">
              <Cake className="h-5 w-5" />
              ¡Cumpleaños de Hoy!
            </CardTitle>
            <CardDescription>Estudiantes que cumplen años hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayBirthdays.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-pink-200 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                      <Cake className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{student.full_name}</h4>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <p className="text-sm text-gray-600">Grupo: {student.group_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-pink-100 text-pink-800 text-lg px-3 py-1">{student.age_turning} años</Badge>
                    <p className="text-sm text-pink-600 mt-1 font-medium">¡Feliz cumpleaños!</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Birthdays */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Cumpleaños
          </CardTitle>
          <CardDescription>Cumpleaños en los próximos 3 meses</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingBirthdays.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cumpleaños próximos</h3>
              <p className="text-gray-600">
                No hay estudiantes con cumpleaños en los próximos 3 meses, o no tienen fecha de nacimiento registrada.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {student.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{student.full_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{student.email}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {student.group_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{getDaysText(student.days_until_birthday)}</Badge>
                      <Badge variant="secondary">{student.age_turning} años</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{formatBirthDate(student.birth_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estadísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="text-2xl font-bold text-pink-600">{todayBirthdays.length}</div>
              <div className="text-sm text-gray-600">Cumpleaños hoy</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{upcomingBirthdays.length}</div>
              <div className="text-sm text-gray-600">Próximos 3 meses</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {upcomingBirthdays.filter((s) => s.days_until_birthday <= 7).length}
              </div>
              <div className="text-sm text-gray-600">Esta semana</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
