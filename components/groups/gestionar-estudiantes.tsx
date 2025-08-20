"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus, ArrowLeft, Trash2, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Group, Student } from "@/lib/types"

interface GestionarEstudiantesProps {
  group: Group
  onBack: () => void
}

export default function GestionarEstudiantes({ group, onBack }: GestionarEstudiantesProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase.from("students").select("*").eq("group_id", group.id).order("full_name")

      if (error) throw error
      setStudents(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [group.id])

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const fullName = formData.get("fullName") as string
    const nationalId = formData.get("nationalId") as string
    const birthDate = formData.get("birthDate") as string

    try {
      const { error: insertError } = await supabase.from("students").insert([
        {
          email,
          full_name: fullName,
          national_id: nationalId,
          birth_date: birthDate || null,
          group_id: group.id,
        },
      ])

      if (insertError) throw insertError

      setSuccess("Estudiante agregado exitosamente")
      ;(e.target as HTMLFormElement).reset()
      loadStudents()
    } catch (err: any) {
      setError(err.message)
    }

    setLoading(false)
  }

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar este estudiante?")) return

    try {
      const { error } = await supabase.from("students").delete().eq("id", studentId)

      if (error) throw error

      setSuccess("Estudiante eliminado exitosamente")
      loadStudents()
    } catch (err: any) {
      setError(err.message)
    }
  }

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

      {/* Add Student Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Estudiante
          </CardTitle>
          <CardDescription>Completá los datos del estudiante para agregarlo al grupo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStudent} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Nombre Completo *
                </label>
                <Input id="fullName" name="fullName" placeholder="Nombre y apellido" required disabled={loading} />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="estudiante@ejemplo.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="nationalId" className="text-sm font-medium">
                  DNI *
                </label>
                <Input id="nationalId" name="nationalId" placeholder="12345678" required disabled={loading} />
              </div>

              <div className="space-y-2">
                <label htmlFor="birthDate" className="text-sm font-medium">
                  Fecha de Nacimiento
                </label>
                <Input id="birthDate" name="birthDate" type="date" disabled={loading} />
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar Estudiante"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estudiantes ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              No hay estudiantes en este grupo. Agregá el primero usando el formulario de arriba.
            </p>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{student.full_name}</h4>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{student.email}</span>
                      <span>DNI: {student.national_id}</span>
                      {student.birth_date && (
                        <span>Nació: {new Date(student.birth_date).toLocaleDateString("es-AR")}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteStudent(student.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
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
