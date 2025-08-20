import ExportarPlanilla from "@/components/export"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export default async function ExportarPlanillaPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // obtener usuario logueado
  const { data: { user } } = await supabase.auth.getUser()

  // traer los grupos del profe logueado
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, name, place, description")
    .eq("teacher_id", user?.id)

  if (error) {
    console.error("Error cargando grupos:", error)
  }

  return <ExportarPlanilla groups={groups || []} />
}
