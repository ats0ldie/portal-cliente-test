"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"

interface UserData {
  name: string
  email: string
  avatar: string
  cedula?: string
  telefono?: string
  direccion?: string
  limit?: number
  diasCredito?: number
  simc?: string
  segmento?: string
  codigoCliente?: string
  factorCambiario?: number
  mfactura?: number
  diasppago1?: number
  porppago1?: number
}

interface UserContextType {
  user: UserData
  isLoading: boolean
}

const UserContext = React.createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserData>({
    name: "",
    email: "",
    avatar: "",
  })
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser?.email) {
        // Actualizamos el email inmediatamente con el de la sesión
        setUser((prev) => ({ ...prev, email: authUser.email! }))

        try {
          // Hacemos el fetch a la API una sola vez
          const response = await fetch(`https://jkserverom.drogueriajoskar.com:7030/rq_cliente/by-email/${authUser.email}`)
          
          if (response.ok) {
            const clientData = await response.json()
            
            // Actualizamos el estado con todos los datos recibidos
            setUser((prev) => ({ 
              ...prev, 
              name: clientData.nombres || clientData.descip || clientData.nombre || prev.name,
              cedula: clientData.cedula,
              telefono: clientData.telefono,
              direccion: clientData.dire11,
              limit: clientData.limited,
              diasCredito: clientData.formap,
              simc: clientData.simc,
              segmento: clientData.descip,
              codigoCliente: clientData.cliente,
              factorCambiario: clientData.factor_cambiario,
              mfactura: clientData.mfactura,
              diasppago1: clientData.diasppago1,
              proppago1: clientData.proppago1
            }))
          }
        } catch (error) {
          console.error("Error fetching client data:", error)
        }
      }
      setIsLoading(false)
    }
    fetchUserData()
  }, [])

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = React.useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
