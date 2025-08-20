import RegistroForm from "@/components/auth/registro-form"

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Asistencia</h1>
          <p className="text-gray-600">Plataforma para profesores</p>
        </div>
        <RegistroForm />
      </div>
    </div>
  )
}
