"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser } from "@/components/user-provider"
import { useCuenta } from "@/components/cuenta-provider"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"

export default function UsuarioPage() {
  const { user, isLoading: loading } = useUser()
  const { facturas } = useCuenta()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando información...</p>
      </div>
    )
  }

  // Calcular la deuda total sumando el saldo en $ de todas las facturas
  const totalDeuda = facturas.reduce((acc, curr) => acc + curr.totalRef, 0)

  return (
    // <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url('/login-bg.jpg')] bg-cover bg-center">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Código de Cliente</Label>
              <Input value={user.codigoCliente || ""} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>RIF</Label>
              <Input value={user.cedula || ""} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Teléfono</Label>
              <Input value={user.telefono || ""} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Dirección</Label>
              <Input value={user.direccion || ""} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Código SIMC</Label>
              <Input value={user.simc || ""} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Límite de crédito</Label>
              <Input value={user.limit ? `$ ${Number(user.limit).toLocaleString('en-US', {minimumFractionDigits: 2})}` : "0.00"} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Días de crédito</Label>
              <Input value={user.diasCredito || "0"} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Días de Tasa Protegida</Label>
              <Input value={user.mfactura || "0"} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Días Pago de Contado</Label>
              <Input value={user.diasppago1 || "0"} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Descuento Pago de Contado</Label>
              <Input value={user.proppago1 || "0"} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Deuda</Label>
              <Input value={`$ ${Math.abs(totalDeuda).toLocaleString('en-US', {minimumFractionDigits: 2})}`} readOnly className="bg-muted" />
            </div>
          </div>
          <div className="flex justify-end " >
            <Button className="cursor-pointer" onClick={() => router.push("/devolucion")}>Devolución Pedido</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
