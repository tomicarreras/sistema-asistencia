"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface Group {
  id: string
  name: string
  description: string
  place: string
}

interface ExportarPlanillaProps {
  groups: Group[]
}

export default function ExportarPlanilla({ groups }: ExportarPlanillaProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClient()

  const exportToCSV = async () => {
    if (!selectedGroup || !dateFrom || !dateTo) {
      toast({
        title: "Error",
        description: "Por favor seleccioná un grupo y el rango de fechas",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)

    try {
      // Obtener datos del grupo
      const { data: groupData } = await supabase.from("groups").select("*").eq("id", selectedGroup).single()

      // Obtener estudiantes del grupo
      const { data: students } = await supabase
        .from("students")
        .select("*")
        .eq("group_id", selectedGroup)
        .order("full_name")

      // Obtener asistencias en el rango de fechas
      const { data: attendances } = await supabase
        .from("attendance")
        .select("*")
        .eq("group_id", selectedGroup)
        .gte("date", format(dateFrom, "yyyy-MM-dd"))
        .lte("date", format(dateTo, "yyyy-MM-dd"))
        .order("date")

      if (!students || !attendances) {
        throw new Error("Error al obtener los datos")
      }

      // Crear CSV
      const dates = [...new Set(attendances.map((a) => a.date))].sort()

      // Encabezados
      let csvContent = "Nombre Completo,Email,DNI"
      dates.forEach((date) => {
        csvContent += `,${format(new Date(date), "dd/MM/yyyy", { locale: es })}`
      })
      csvContent += ",Total Presentes,Total Ausentes,% Asistencia\n"

      // Datos de estudiantes
      students.forEach((student) => {
        let row = `"${student.full_name}","${student.email || ""}","${student.national_id || ""}"`

        let totalPresent = 0
        let totalAbsent = 0

        dates.forEach((date) => {
          const attendance = attendances.find((a) => a.student_id === student.id && a.date === date)
          const present = attendance?.present ? "Presente" : "Ausente"
          if (attendance?.present) totalPresent++
          else totalAbsent++
          row += `,"${present}"`
        })

        const totalClasses = dates.length
        const percentage = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : "0"

        row += `,${totalPresent},${totalAbsent},${percentage}%`
        csvContent += row + "\n"
      })

      // Descargar archivo
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `asistencia_${groupData?.name}_${format(dateFrom, "dd-MM-yyyy")}_${format(dateTo, "dd-MM-yyyy")}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "¡Éxito!",
        description: "Planilla exportada correctamente",
      })
    } catch (error) {
      console.error("Error al exportar:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar la planilla",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Exportar Planilla de Asistencia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Grupo</label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un grupo" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name} - {group.place}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Fecha desde</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus locale={es} />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Fecha hasta</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus locale={es} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button
          onClick={exportToCSV}
          disabled={isExporting || !selectedGroup || !dateFrom || !dateTo}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exportando..." : "Exportar a CSV"}
        </Button>

        <p className="text-sm text-muted-foreground">
          La planilla incluirá todos los estudiantes del grupo seleccionado con su asistencia en el rango de fechas
          especificado, junto con estadísticas de asistencia.
        </p>
      </CardContent>
    </Card>
  )
}
