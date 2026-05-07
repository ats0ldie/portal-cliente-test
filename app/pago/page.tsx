"use client"

import * as React from "react"
import { CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/components/user-provider"

export default function PagoPage() {
  const [retencion, setRetencion] = React.useState("no")
  const [extraFiles, setExtraFiles] = React.useState<number[]>([])
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const { user, isLoading: userLoading } = useUser()

  const addFileSlot = () => {
    setExtraFiles(prev => [...prev, Date.now()])
  }

  const removeFileSlot = (id: number) => {
    setExtraFiles(prev => prev.filter(x => x !== id))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea imagen
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecciona un archivo de imagen válido.")
        e.target.value = "" // Limpiar el input
        return
      }
      // Validar tamaño (ejemplo: 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen es demasiado pesada. El tamaño máximo es 5MB.")
        e.target.value = "" // Limpiar el input
        return
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    const form = e.currentTarget
    const formData = new FormData(form)
    const apiData = new FormData()

    // Mapeo de datos para coincidir con la API
    apiData.append("vendedor", "Portal Joskar")
    apiData.append("nombreFarmacia", user.name)
    apiData.append("rif", user.cedula || "")
    apiData.append("numFactura", formData.get("nro_factura") as string)
    apiData.append("fechaPago", formData.get("fecha_pago") as string)
    apiData.append("monto", formData.get("monto") as string)
    apiData.append("numReferencia", formData.get("referencia") as string)
    apiData.append("pago", formData.get("tipo_pago") as string)
    apiData.append("banco", formData.get("banco") as string)
    apiData.append("nota", formData.get("nota") as string)
    apiData.append("retencion", retencion)

    // Manejo de archivos con los nombres que espera la API ('captura' y 'capturaRetencion')
    // Recopilar todos los inputs de comprobante_pago (el principal y los extra)
    const fileInputs = form.querySelectorAll('input[name="comprobante_pago"]') as NodeListOf<HTMLInputElement>
    fileInputs.forEach(input => {
      if (input.files?.[0]) {
        apiData.append("captura", input.files[0])
      }
    })

    if (retencion === "si") {
      const retencionFile = (form.elements.namedItem("comprobante_retencion") as HTMLInputElement).files?.[0]
      if (retencionFile) apiData.append("capturaRetencion", retencionFile)
    }

    try {
      const response = await fetch("https://jkserverom.drogueriajoskar.com:7030/cargar_pago/", {
        method: "POST",
        body: apiData,
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Pago enviado exitosamente." })
        form.reset()
        setExtraFiles([])
        setRetencion("no")
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: "Error al enviar el pago: " + (data.error || "Error desconocido") })
      }
    } catch (error) {
      console.error("Error:", error)
      setMessage({ type: "error", text: "Error de conexión. Por favor intente nuevamente." })
    } finally {
      setLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Cargando información...</p>
      </div>
    )
  }

  return (

        // <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url('/login-bg.jpg')] bg-cover bg-center">
          <div className="mx-auto w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Cargar Pago</CardTitle>
              </CardHeader>
              <CardContent>
                {message && (
                  <div className={`flex items-center gap-3 p-4 mb-6 rounded-lg border ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900' 
                      : 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0" />
                    )}
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}
                <form className="grid gap-6" onSubmit={handleSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" name="nombre" type="text" value={user.name} readOnly className="bg-muted" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rif">RIF</Label>
                    <Input id="rif" name="rif" type="text" value={user.cedula || ""} readOnly className="bg-muted" required />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="nro_factura">Nº Factura</Label>
                      <Input id="nro_factura" name="nro_factura" type="number" placeholder="0000" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fecha_pago">Fecha del Pago</Label>
                      <Input id="fecha_pago" name="fecha_pago" type="date" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="monto">Monto</Label>
                      <Input id="monto" name="monto" type="number" step="0.01" placeholder="0.00" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="referencia">Nº Referencia</Label>
                      <Input id="referencia" name="referencia" type="number" placeholder="123456" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="tipo_pago">Tipo de Pago</Label>
                      <Select name="tipo_pago" required>
                        <SelectTrigger id="tipo_pago">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="abono">Abono</SelectItem>
                          <SelectItem value="total">Total</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="banco">Banco</Label>
                      <Select name="banco" required>
                        <SelectTrigger id="banco">
                          <SelectValue placeholder="Seleccionar Banco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="banesco">Banesco</SelectItem>
                          <SelectItem value="provincial">Provincial</SelectItem>
                          <SelectItem value="venezuela">Venezuela</SelectItem>
                          <SelectItem value="zelle">Zelle</SelectItem>
                          <SelectItem value="banca_amiga">Banca Amiga</SelectItem>
                          <SelectItem value="bnc">BNC</SelectItem>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nota">Nota</Label>
                    <Input id="nota" name="nota" type="text" placeholder="Nota adicional..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="comprobante_pago">Comprobante Pago</Label>
                    <Input id="comprobante_pago" name="comprobante_pago" type="file" accept="image/*" onChange={handleFileChange} required />
                    
                    {extraFiles.map((id) => (
                      <div key={id} className="flex gap-2">
                        <Input name="comprobante_pago" type="file" accept="image/*" onChange={handleFileChange} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFileSlot(id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    <Button type="button" variant="outline" size="sm" onClick={addFileSlot} className="w-fit">
                      <Plus className="mr-2 h-4 w-4" /> Agregar otro comprobante
                    </Button>
                    <p className="text-xs text-muted-foreground">Imagen (max 5MB)</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="retencion">Retención</Label>
                    <Select name="retencion" value={retencion} onValueChange={setRetencion}>
                      <SelectTrigger id="retencion">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="si">Si</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {retencion === "si" && (
                    <div className="grid gap-2">
                      <Label htmlFor="comprobante_retencion">Comprobante Retención</Label>
                      <Input id="comprobante_retencion" name="comprobante_retencion" type="file" accept="image/*" onChange={handleFileChange} required />
                      <p className="text-xs text-muted-foreground">Imagen (max 5MB)</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Pago"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div> 
  )
}
