"use client"

import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useCuenta } from "@/components/cuenta-provider"

export default function CuentaPage() {
  // Consumimos los datos directamente del proveedor global
  const { facturas } = useCuenta()

  // Totais generales de la tabla
  const saldoBsDif = facturas.reduce((acc, curr) => acc + curr.totalBsDif, 0)
  const saldoBs = facturas.reduce((acc, curr) => acc + curr.totalBs, 0)
  const saldoRef = facturas.reduce((acc, curr) => acc + curr.totalRef, 0)

  // Cálculos para el cuadro de resumen (Facturas vencidas / Morosidad)
  // Asumiendo que dias > 0 implica vencida/morosa para el color rojo
  const facturasVencidas = facturas.filter(f => f.dias > 0)
  const countVencidas = facturasVencidas.length
  const montoVencidoBs = facturasVencidas.reduce((acc, curr) => acc + curr.totalBs, 0)
  const montoVencidoRef = facturasVencidas.reduce((acc, curr) => acc + curr.totalRef, 0)

  const isMoroso = countVencidas > 0

  const currentDate = new Date().toLocaleDateString("es-VE", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (

    <div className="bg-muted flex min-h-svh flex-col gap-6 p-6 md:p-10 bg-[url('/login-bg.jpg')] bg-cover bg-center">
      <div className="flex flex-col gap-6">
        {/* Header y Cuadro de Resumen */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Estado de Cuenta</h1>
            <p className="text-white capitalize">{currentDate}</p>
          </div>

          <Card className={cn("w-full md:w-auto min-w-75", isMoroso && "border-red-500 border-2")}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-lg", isMoroso && "text-red-600")}>
                {isMoroso ? "Cliente Moroso" : "Estado al día"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Facturas Vencidas:</span>
                  <span className="font-bold">{countVencidas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Vencido Bs:</span>
                  <span className="font-bold">Bs. {Math.abs(montoVencidoBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto Vencido $:</span>
                  <span className="font-bold">$ {Math.abs(montoVencidoRef).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Datos */}
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>MF</TableHead>
                <TableHead>Index</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Días</TableHead>
                <TableHead className="text-right">Monto $</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">Ret</TableHead>
                <TableHead className="text-right">Aplicado</TableHead>
                <TableHead className="text-right">Saldo Bs + dif</TableHead>
                <TableHead className="text-right">Saldo Bs</TableHead>
                <TableHead className="text-right">Saldo $</TableHead>
                <TableHead className="text-right">Rec 10%pp</TableHead>
                <TableHead className="text-right">Saldo +rec 10%pp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.map((factura) => (
                <TableRow key={factura.id} className={cn(factura.dias > 0 && "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30")}>
                  <TableCell className="font-medium">{factura.nro}</TableCell>
                  <TableCell>{factura.cantidad}</TableCell>
                  <TableCell>{factura.mf}</TableCell>
                  <TableCell>{factura.index}</TableCell>
                  <TableCell className="whitespace-nowrap">{factura.fecha}</TableCell>
                  <TableCell className="whitespace-nowrap">{factura.vence}</TableCell>
                  <TableCell className={cn("font-bold", factura.dias > 0 ? "text-red-600" : "text-green-600")}>
                    {factura.dias}
                  </TableCell>
                  <TableCell className="text-right">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.totalRef)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.iva)).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.ret)).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.aplicado)).toFixed(2)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.totalBsDif)).toFixed(2)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.totalBs)).toFixed(2)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.totalRef)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.totalRef * 0.10)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{((factura.dias <= 0 ? -1 : 1) * Math.abs(factura.totalRef * 1.10)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totales */}
        <div className="flex flex-col items-end gap-2 mt-2">
          <div className="w-full md:w-1/3 lg:w-1/4 grid gap-2 bg-card p-4 rounded-lg border">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">Saldo Bs+dif:</span>
              <span className="font-semibold">{Math.abs(saldoBsDif).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">Saldo Bs:</span>
              <span className="font-semibold">{Math.abs(saldoBs).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">Saldo $:</span>
              <span className="font-semibold">{Math.abs(saldoRef).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between pt-2 text-lg font-bold">
              <span>Saldo Final ($):</span>
              <span>{Math.abs(saldoRef).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
