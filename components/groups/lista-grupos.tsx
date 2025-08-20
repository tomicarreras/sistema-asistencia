"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import EditarGrupoForm from "@/components/groups/editar-grupo-form"
import { toast } from "@/hooks/use-toast"
import type { Group } from "@/lib/types"

interface ListaGruposProps {
  refreshTrigger?: number
  onSelectGroup?: (group: Group) => void
}

export default function ListaGrupos({ refreshTrigger, onSelectGroup }: ListaGruposProps) {
  const [grupos, setGrupos] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch groups
  const fetchGroups = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("groups").select("*").order("name")
    if (!error && data) setGrupos(data)
    setLoading(false)
  }

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    fetchGroups()
    // eslint-disable-next-line
  }, [refreshTrigger])

  const handleDelete = async (groupId: string) => {
    if (!window.confirm("¿Seguro que quieres borrar este grupo? Esta acción no se puede deshacer.")) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("groups").delete().eq("id", groupId)
    setDeleting(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo borrar el grupo", variant: "destructive" })
    } else {
      toast({ title: "Grupo borrado", description: "El grupo fue eliminado correctamente" })
      fetchGroups()
    }
  }

  if (editingGroup) {
    return (
      <EditarGrupoForm
        group={editingGroup}
        onUpdated={() => { setEditingGroup(null); fetchGroups(); }}
        onCancel={() => setEditingGroup(null)}
      />
    )
  }

  if (loading) return <div>Cargando grupos...</div>

  return (
    <div>
      {grupos.map(group => (
        <div key={group.id} className="flex items-center gap-2 mb-2">
          <span
            className="cursor-pointer hover:underline"
            onClick={() => onSelectGroup && onSelectGroup(group)}
          >
            {group.name} - {group.place}
          </span>
          <Button size="sm" onClick={() => setEditingGroup(group)}>Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(group.id)} disabled={deleting}>
            {deleting ? "Borrando..." : "Borrar"}
          </Button>
        </div>
      ))}
    </div>
  )
}