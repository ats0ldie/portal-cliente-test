"use client"

import * as React from "react"
import { Plus, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useUser } from "@/components/user-provider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ProductItem {
  factura: string
  producto: string
  cantidad: string
  lote: string
  vencimiento: string
  entrega: string
}

export default function DevolucionPage() {
  const [currentDate, setCurrentDate] = React.useState("")
  const { user, isLoading: userLoading } = useUser()
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Estados del formulario
  const [vendedor, setVendedor] = React.useState("")
  const [zona, setZona] = React.useState("")
  const [motivos, setMotivos] = React.useState<string[]>([])
  const [observacion, setObservacion] = React.useState("")
  
  const [products, setProducts] = React.useState<ProductItem[]>([
    { factura: "", producto: "", cantidad: "", lote: "", vencimiento: "", entrega: "" }
  ])

  const motivosOptions = [
    "Error Cantidad",
    "Mal Despacho",
    "Mal Estado",
    "Pedido Errado",
    "Prox Vencer",
    "Otros"
  ]

  React.useEffect(() => {
    const date = new Date()
    setCurrentDate(date.toLocaleDateString("es-VE"))
  }, [])

  const handleMotivoChange = (motivo: string, checked: boolean) => {
    if (checked) {
      setMotivos([...motivos, motivo])
    } else {
      setMotivos(motivos.filter(m => m !== motivo))
    }
  }

  const addProductRow = () => {
    setProducts([...products, { factura: "", producto: "", cantidad: "", lote: "", vencimiento: "", entrega: "" }])
  }

  const removeProductRow = (index: number) => {
    if (products.length > 1) {
      const newProducts = [...products]
      newProducts.splice(index, 1)
      setProducts(newProducts)
    }
  }

  const updateProduct = (index: number, field: keyof ProductItem, value: string) => {
    const newProducts = [...products]
    
    newProducts[index][field] = value
    setProducts(newProducts)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("rif", user.cedula || "")
      formData.append("nombreFarmacia", user.name || "")
      formData.append("subject", `Devolución Web - ${user.name}`)
      
      // Construimos un resumen de texto para el cuerpo del correo
      const resumen = `
Cliente: ${user.name}
RIF: ${user.cedula}
Vendedor: ${vendedor}
Zona: ${zona}
Motivos: ${motivos.join(", ")}
Observación: ${observacion}

Productos a devolver:
${products.map((p, i) => `${i+1}. Fact: ${p.factura} | Prod: ${p.producto} | Cant: ${p.cantidad} | Lote: ${p.lote}`).join('\n')}
      `.trim()
      
      formData.append("text", resumen)

      // Generamos un archivo JSON con los datos estructurados para cumplir con el requisito de archivo de la API
      const datosDevolucion = JSON.stringify({
        cliente: { nombre: user.name, rif: user.cedula },
        venta: { vendedor, zona },
        motivos,
        observacion,
        productos: products
      }, null, 2)

      const blob = new Blob([datosDevolucion], { type: "application/json" })
      formData.append("file", blob, "detalle_devolucion.json")

      const response = await fetch("https://jkserverom.drogueriajoskar.com:7030/devolucion/", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Devolución enviada exitosamente." })
        // Limpiar formulario
        setProducts([{ factura: "", producto: "", cantidad: "", lote: "", vencimiento: "", entrega: "" }])
        setMotivos([])
        setObservacion("")
        setVendedor("")
        setZona("")
      } else {
        const data = await response.json()
        setMessage({ type: "error", text: "Error al enviar: " + (data.error || "Error desconocido") })
      }
    } catch (error) {
      console.error("Error:", error)
      setMessage({ type: "error", text: "Error de conexión. Por favor intente nuevamente." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url('/login-bg.jpg')] bg-cover bg-center">
      <div className="mx-auto w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Cargar Devolución</CardTitle>
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
            <form onSubmit={handleSubmit} className="grid gap-6">
              {/* Datos del Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Nombre</Label>
                  <Input value={user.name} readOnly className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label>RIF</Label>
                  <Input value={user.cedula || ""} readOnly className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label>Fecha</Label>
                  <Input value={currentDate} readOnly className="bg-muted" />
                </div>
              </div>

              {/* Datos de Venta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="vendedor">Vendedor</Label>
                  <Input id="vendedor" value={vendedor} onChange={e => setVendedor(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zona">Zona</Label>
                  <Input id="zona" value={zona} onChange={e => setZona(e.target.value)} required />
                </div>
              </div>

              {/* Motivos */}
              <div className="grid gap-2">
                <Label>Motivo Devolución</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border p-4 rounded-md">
                  {motivosOptions.map(motivo => (
                    <div key={motivo} className="flex items-center space-x-2">
                      <Checkbox 
                        id={motivo} 
                        checked={motivos.includes(motivo)}
                        onCheckedChange={(checked) => handleMotivoChange(motivo, checked as boolean)}
                      />
                      <Label htmlFor={motivo} className="font-normal cursor-pointer">{motivo}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla de Productos */}
              <div className="grid gap-2">
                <Label>Productos a Devolver</Label>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Nº Factura</TableHead>
                        <TableHead className="min-w-[150px]">Producto</TableHead>
                        <TableHead className="min-w-[80px]">Cant.</TableHead>
                        <TableHead className="min-w-[80px]">Lote</TableHead>
                        <TableHead className="min-w-[130px]">Vencimiento</TableHead>
                        <TableHead className="min-w-[130px]">Entrega</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input value={row.factura} onChange={e => updateProduct(index, 'factura', e.target.value)} placeholder="0000" required />
                          </TableCell>
                          <TableCell>
                            <Input value={row.producto} onChange={e => updateProduct(index, 'producto', e.target.value)} placeholder="Nombre..." required />
                          </TableCell>
                          <TableCell>
                            <Input type="number" value={row.cantidad} onChange={e => updateProduct(index, 'cantidad', e.target.value)} placeholder="0" required />
                          </TableCell>
                          <TableCell>
                            <Input value={row.lote} onChange={e => updateProduct(index, 'lote', e.target.value)} placeholder="Lote" required />
                          </TableCell>
                          <TableCell>
                            <Input type="date" value={row.vencimiento} onChange={e => updateProduct(index, 'vencimiento', e.target.value)} required />
                          </TableCell>
                          <TableCell>
                            <Input type="date" value={row.entrega} onChange={e => updateProduct(index, 'entrega', e.target.value)} required />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeProductRow(index)} disabled={products.length === 1} className="text-destructive hover:text-destructive/90">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button type="button" variant="outline" onClick={addProductRow} className="w-full mt-2">
                  <Plus className="mr-2 h-4 w-4" /> Agregar otro producto
                </Button>
              </div>

              {/* Observación */}
              <div className="grid gap-2">
                <Label htmlFor="observacion">Observación</Label>
                <Input id="observacion" value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Nota adicional..." />
              </div>
              <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 mb-2">
                  NOTA: Después de 72 horas de recibida la mercancía No se aceptan devoluciones.
                </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Devolución"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
