"use client"

import { useState } from "react"
import Navbar from "@/components/dashboard/navbar"
import Sidebar from "@/components/dashboard/sidebar"
import CrearGrupoForm from "@/components/groups/crear-grupo-form"
import ListaGrupos from "@/components/groups/lista-grupos"
import GestionarEstudiantes from "@/components/groups/gestionar-estudiantes"
import SeleccionarGrupo from "@/components/attendance/seleccionar-grupo"
import TomarAsistencia from "@/components/attendance/tomar-asistencia"
import HistorialAsistencia from "@/components/attendance/historial-asistencia"
import CalendarioAsistencia from "@/components/calendar/calendario-asistencia"
import DetalleDia from "@/components/calendar/detalle-dia"
import SeccionCumpleanos from "@/components/birthdays/seccion-cumpleanos"
import ExportarPlanilla from "@/components/export/exportar-planilla"
import type { Group } from "@/lib/types"

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("grupos")
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const handleGroupCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
    setActiveSection("grupos")
  }

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group)
    setActiveSection("gestionar-estudiantes")
  }

  const handleSelectGroupForAttendance = (group: Group) => {
    setSelectedGroup(group)
    setActiveSection("tomar-asistencia")
  }

  const handleBackToGroups = () => {
    setSelectedGroup(null)
    setActiveSection("grupos")
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleBackToAttendance = () => {
    setSelectedGroup(null)
    setActiveSection("asistencia")
  }

  const handleBackToCalendar = () => {
    setSelectedDate(null)
    setSelectedGroupId(null)
    setActiveSection("calendario")
  }

  const handleViewAttendanceHistory = (group: Group) => {
    setSelectedGroup(group)
    setActiveSection("historial-asistencia")
  }

  const handleViewDay = (date: string, groupId?: string) => {
    setSelectedDate(date)
    if (groupId) {
      setSelectedGroupId(groupId)
      setActiveSection("detalle-dia")
    } else {
      setActiveSection("tomar-asistencia")
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "crear-grupo":
        return <CrearGrupoForm onGroupCreated={handleGroupCreated} />
      case "grupos":
        return <ListaGrupos onSelectGroup={handleSelectGroup} refreshTrigger={refreshTrigger} />
      case "gestionar-estudiantes":
        return selectedGroup ? <GestionarEstudiantes group={selectedGroup} onBack={handleBackToGroups} /> : null
      case "asistencia":
        return <SeleccionarGrupo onSelectGroup={handleSelectGroupForAttendance} />
      case "tomar-asistencia":
        return selectedGroup ? <TomarAsistencia group={selectedGroup} onBack={handleBackToAttendance} /> : null
      case "historial-asistencia":
        return selectedGroup ? (
          <HistorialAsistencia group={selectedGroup} onBack={handleBackToAttendance} onViewDay={handleViewDay} />
        ) : null
      case "calendario":
        return <CalendarioAsistencia onViewDay={handleViewDay} />
      case "detalle-dia":
        return selectedDate && selectedGroupId ? (
          <DetalleDia date={selectedDate} groupId={selectedGroupId} onBack={handleBackToCalendar} />
        ) : null
      case "cumpleanos":
        return <SeccionCumpleanos />
      case "exportar":
        return <ExportarPlanilla groups={[]} />
      default:
        return <div>Sección no encontrada</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <main className="flex-1 p-6">{renderContent()}</main>
      </div>
    </div>
  )
}
