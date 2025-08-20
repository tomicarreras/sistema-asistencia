"use client"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Gift, Plus, CalendarDays, FileSpreadsheet } from "lucide-react"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const menuItems = [
    { id: "grupos", label: "Mis Grupos", icon: Users },
    { id: "asistencia", label: "Asistencia", icon: Calendar },
    { id: "calendario", label: "Calendario", icon: CalendarDays },
    { id: "cumpleanos", label: "Cumpleaños", icon: Gift },
    { id: "exportar", label: "Exportar Planillas", icon: FileSpreadsheet },
  ]

  return (
    <div className="w-64 bg-gray-50 border-r min-h-screen p-4">
      <div className="space-y-2">
        <Button
          onClick={() => onSectionChange("crear-grupo")}
          className="w-full justify-start"
          variant={activeSection === "crear-grupo" ? "default" : "ghost"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Crear Grupo
        </Button>

        {menuItems.map((item) => (
          <Button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            variant={activeSection === item.id ? "default" : "ghost"}
            className="w-full justify-start"
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
