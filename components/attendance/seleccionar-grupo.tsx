"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Calendar, Clock, CheckSquare } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { getCurrentUser } from "@/lib/auth"
import type { Group } from "@/lib/types"

interface SeleccionarGrupoProps {
  onSelectGroup: (group: Group) => void
}

export default function SeleccionarGrupo({ onSelectGroup }: SeleccionarGrupoProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const { user } = await getCurrentUser()
        if (!user) return

        const { data, error } = await supabase
          .from("groups")
          .select(`
            *,
            students(count)
          `)
          .eq("teacher_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setGroups(data || [])
      } catch (error) {
        console.error("Error loading groups:", error)
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Cargando grupos...</div>
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tenés grupos creados</h3>
          <p className="text-gray-600">Creá un grupo primero para poder tomar asistencia.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Seleccionar Grupo para Asistencia</h2>
      <div className="grid gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {group.description && <CardDescription className="mt-1">{group.description}</CardDescription>}
                </div>
                <Badge variant="secondary">{(group as any).students?.[0]?.count || 0} estudiantes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {group.place}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(group.schedule_date).toLocaleDateString("es-AR")}
                </div>
                {group.schedule_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {group.schedule_time}
                  </div>
                )}
              </div>
              <Button onClick={() => onSelectGroup(group)} className="w-full">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tomar Asistencia
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
