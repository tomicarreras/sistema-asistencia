"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { signOut, getCurrentUser, type AuthUser } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function Navbar() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getCurrentUser()
      setUser(user)
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="w-full">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo del Sistema" className="h-10" />
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Hola, {user?.full_name || "Profesor"}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
