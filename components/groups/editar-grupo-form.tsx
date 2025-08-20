"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import type { Group } from "@/lib/types"

interface EditarGrupoFormProps {
  group: Group
  onUpdated: () => void
  onCancel: () => void
}

export default function EditarGrupoForm({ group, onUpdated, onCancel }: EditarGrupoFormProps) {
  const [name, setName] = useState(group.name)
  const [place, setPlace] = useState(group.place)
  const [description, setDescription] = useState(group.description || "")
  const [scheduleDate, setScheduleDate] = useState(group.scheduleDate || "")
  const [scheduleTime, setScheduleTime] = useState(group.scheduleTime || "")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("groups")
      .update({ name, place, description, scheduleDate, scheduleTime })
      .eq("id", group.id)
    setLoading(false)
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el grupo", variant: "destructive" })
    } else {
      toast({ title: "Grupo actualizado", description: "Los datos del grupo fueron actualizados correctamente" })
      onUpdated()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">Editar grupo</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Nombre del grupo</label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Lugar</label>
        <Input value={place} onChange={e => setPlace(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <Input value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Día (opcional)</label>
        <Input
          type="date"
          value={scheduleDate}
          onChange={e => setScheduleDate(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Hora (opcional)</label>
        <Input
          type="time"
          value={scheduleTime}
          onChange={e => setScheduleTime(e.target.value)}
        />
      </div>
      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}