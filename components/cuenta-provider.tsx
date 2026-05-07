// components/cuenta-provider.tsx
"use client"

import * as React from "react"
import { useUser } from "@/components/user-provider"

export interface Factura {
  id: number
  nro: string
  cantidad: number
  mf: number
  index: string
  fecha: string
  entrega: string
  vence: string
  dias: number
  monto: number
  iva: number
  ret: number
  aplicado: number
  totalBsDif: number
  totalBs: number
  totalRef: number
}

interface CuentaContextType {
  facturas: Factura[]
  loading: boolean
  refreshCuenta: () => Promise<void>
}

const CuentaContext = React.createContext<CuentaContextType | undefined>(undefined)

export function CuentaProvider({ children }: { children: React.ReactNode }) {
  const [facturas, setFacturas] = React.useState<Factura[]>([])
  const [loading, setLoading] = React.useState(false)
  const { user } = useUser()

  const fetchCuenta = React.useCallback(async () => {
    if (!user?.email) return

    setLoading(true)
    try {
      const response = await fetch(`https://jkserverom.drogueriajoskar.com:7030/cuenta/by-email/${user.email}`)

      if (!response.ok) {
        console.error(`Error HTTP: ${response.status}`)
        return
      }

      const data = await response.json()
      
      if (Array.isArray(data)) {
        const facturasMapeadas: Factura[] = data.map((item: any) => ({
          id: item.id,
          nro: item.numeroc,
          cantidad: 1,
          mf: Number(item.mfactura) || 0,
          index: item.indexado,
          fecha: item.fecha ? new Date(item.fecha).toISOString().split('T')[0] : '',
          entrega: item.entregado ? new Date(item.entregado).toISOString().split('T')[0] : '',
          vence: item.vence ? new Date(item.vence).toISOString().split('T')[0] : '',
          dias: Number(item.dias),
          monto: Number(item.monto),
          iva: Number(item.impuesto),
          ret: 0,
          aplicado: Number(item.abonos),
          totalBsDif: Number(item.saldo),
          totalBs: Number(item.saldo),
          totalRef: Number(item.saldod)
        }))
        setFacturas(facturasMapeadas)
      }
    } catch (error) {
      console.error("Error al cargar estado de cuenta:", error)
    } finally {
      setLoading(false)
    }
  }, [user?.email])

  // Cargar datos automáticamente cuando el usuario (email) esté disponible
  React.useEffect(() => {
    if (user?.email) {
      fetchCuenta()
    } else {
      setFacturas([])
    }
  }, [user?.email, fetchCuenta])

  return (
    <CuentaContext.Provider value={{ facturas, loading, refreshCuenta: fetchCuenta }}>
      {children}
    </CuentaContext.Provider>
  )
}

export function useCuenta() {
  const context = React.useContext(CuentaContext)
  if (context === undefined) {
    throw new Error("useCuenta must be used within a CuentaProvider")
  }
  return context
}
