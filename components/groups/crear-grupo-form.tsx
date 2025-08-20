"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/auth"

interface CrearGrupoFormProps {
  onGroupCreated: () => void
}

export default function CrearGrupoForm({ onGroupCreated }: CrearGrupoFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const place = formData.get("place") as string
    const scheduleDate = formData.get("scheduleDate") as string
    const scheduleTime = formData.get("scheduleTime") as string

    try {
      const { user } = await getCurrentUser()
      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      const { error: insertError } = await supabase.from("groups").insert([
        {
          name,
          description,
          place,
          schedule_date: scheduleDate,
          schedule_time: scheduleTime || null,
          teacher_id: user.id,
        },
      ])

      if (insertError) throw insertError

      setSuccess(true)
      onGroupCreated()

      // Reset form
      ;(e.target as HTMLFormElement).reset()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    }

    setLoading(false)
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Crear Nuevo Grupo
        </CardTitle>
        <CardDescription>Completá los datos del grupo. Una vez creado, podrás agregar estudiantes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">¡Grupo creado exitosamente!</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre del Grupo *
              </label>
              <Input id="name" name="name" placeholder="ej: Inglés Beginners" required disabled={loading} />
            </div>

            <div className="space-y-2">
              <label htmlFor="place" className="text-sm font-medium">
                Lugar *
              </label>
              <Input id="place" name="place" placeholder="ej: Casa del Bicentenario" required disabled={loading} />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Descripción
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descripción opcional del grupo"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="scheduleDate" className="text-sm font-medium">
                Fecha de Inicio *
              </label>
              <Input id="scheduleDate" name="scheduleDate" type="date" required disabled={loading} />
            </div>

            <div className="space-y-2">
              <label htmlFor="scheduleTime" className="text-sm font-medium">
                Horario
              </label>
              <Input id="scheduleTime" name="scheduleTime" type="time" disabled={loading} />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando grupo...
              </>
            ) : (
              "Crear Grupo"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
