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
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("groups")
      .update({ name, place, description })
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del grupo" required />
      <Input value={place} onChange={e => setPlace(e.target.value)} placeholder="Lugar" required />
      <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" />
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  )
}