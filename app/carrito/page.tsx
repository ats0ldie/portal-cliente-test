"use client"

import * as React from "react"
import { Minus, Plus, Search, ShoppingCart, Loader2, Trash2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useUser } from "@/components/user-provider"

// Tipos basados en la estructura de tu API
interface Lote {
  lote: string
  fv: string
  existencia: number
  precio_con_descuento: number
  precio_con_descuento_tasa: number
  descuento: number
  dcliente: number
}

interface Product {
  codigo: string
  descripcion: string
  barra: string
  existencia_total: number
  precio_principal: number
  precio_principal_tasa: number
  imagen?: string
  lotes: Lote[]
}

interface CartItem extends Product {
  lote: Lote
  quantity: number
}

export default function CarritoPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [isCartLoaded, setIsCartLoaded] = React.useState(false)
  const [quantities, setQuantities] = React.useState<Record<string, number>>({})
  const [factorCambiario, setFactorCambiario] = React.useState<number>(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [orderSuccess, setOrderSuccess] = React.useState(false)
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null)
  // const [orderNumber, setOrderNumber] = React.useState("")
  
  // Paginación
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 70

  const { user } = useUser()

  // Cargar carrito desde localStorage al iniciar
  React.useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error("Error al cargar el carrito:", e)
      }
    }
    setIsCartLoaded(true)
  }, [])

  // Guardar carrito en localStorage cuando cambie
  React.useEffect(() => {
    if (isCartLoaded) {
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [cart, isCartLoaded])

  // 1. Obtener usuario y cargar datos iniciales
  React.useEffect(() => {
    if (user.email && user.segmento) {
      setFactorCambiario(Number(user.factorCambiario) || 0)
      fetchInventory(user.email, user.segmento)
    }
  }, [user.email, user.segmento, user.factorCambiario])

  const fetchInventory = async (email: string, descip: string) => {
    // Evitar fetch si ya hay productos cargados (opcional, depende de si quieres refrescar siempre)
    if (products.length > 0) return

    setLoading(true)
    try {
      const response = await fetch(`https://jkserverom.drogueriajoskar.com:7030/carrito/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, descip: descip.toLowerCase() })
      })
      const data = await response.json()
      if (data.inventario) {
        setProducts(data.inventario)
      }
    } catch (error) {
      console.error("Error al obtener inventario:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrado local
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm) return products
    const lowerTerm = searchTerm.toLowerCase()
    return products.filter(p => 
      p.descripcion.toLowerCase().includes(lowerTerm) ||
      p.barra.includes(lowerTerm)
    )
  }, [products, searchTerm])

  // Resetear a la página 1 cuando cambia la búsqueda
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Calcular productos de la página actual
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Manejo de cantidades locales (antes de agregar al carrito)
  const handleQuantityChange = (codigo: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[codigo] !== undefined ? prev[codigo] : 1
      const newVal = Math.max(0, current + delta)
      return { ...prev, [codigo]: newVal }
    })
  }

  // Agregar al carrito
  const addToCart = (product: Product) => {
    const qty = quantities[product.codigo] !== undefined ? quantities[product.codigo] : 1
    if (qty <= 0) return

    const defaultLot = product.lotes[0]
    if (!defaultLot) return

    setCart(prev => {
      const existing = prev.find(item => item.codigo === product.codigo)
      if (existing) {
        return prev.map(item => 
          item.codigo === product.codigo
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      }
      return [...prev, { ...product, lote: defaultLot, quantity: qty }]
    })
    
    // Resetear cantidad visual
    setQuantities(prev => ({ ...prev, [product.codigo]: 1 }))
  }

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) }
      }
      return item
    }))
  }

  // Totales del carrito
  const totalUSD = cart.reduce((acc, item) => acc + (item.lote.precio_con_descuento * item.quantity), 0)
  const totalBs = cart.reduce((acc, item) => acc + (item.lote.precio_con_descuento_tasa * item.quantity), 0)

  // Descuento de fin de semana
  const [isWeekend, setIsWeekend] = React.useState(false)

  React.useEffect(() => {
    const day = new Date().getDay()
    setIsWeekend(day === 0 || day === 6 || day === 5 || day === 4) // Domingo (0) o Sábado (6)
  }, [])

  const discountInfo = React.useMemo(() => {
    if (!isWeekend) return { percentage: 0, amountUSD: 0, amountBs: 0 }
    
    if (totalUSD >= 750) return { percentage: 3, amountUSD: totalUSD * 0.03, amountBs: totalBs * 0.03 }
    if (totalUSD >= 500) return { percentage: 2, amountUSD: totalUSD * 0.02, amountBs: totalBs * 0.02 }
    if (totalUSD >= 250) return { percentage: 1, amountUSD: totalUSD * 0.01, amountBs: totalBs * 0.01 }
    
    return { percentage: 0, amountUSD: 0, amountBs: 0 }
  }, [totalUSD, totalBs, isWeekend])

  const finalTotalUSD = totalUSD - discountInfo.amountUSD
  const finalTotalBs = totalBs - discountInfo.amountBs

  const submitOrder = async () => {
    if (!user.codigoCliente) {
      alert("Error: No se ha identificado el código de cliente.")
      return
    }

    setIsSubmitting(true)
    
    // --- VALIDACIÓN DE STOCK ---
    try {
      // 1. Consultar inventario actualizado
      const response = await fetch(`https://jkserverom.drogueriajoskar.com:7030/carrito/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, descip: (user.segmento || "").toLowerCase() })
      })
      
      if (!response.ok) throw new Error("Error al validar inventario")
      
      const data = await response.json()
      const currentInventory: Product[] = data.inventario || []
      
      let stockChanged = false
      const validatedCart: CartItem[] = []

      for (const item of cart) {
        const product = currentInventory.find(p => p.codigo === item.codigo)
        
        // Caso 1: El producto ya no existe, o la existencia es 0 o no tiene lotes
        if (!product || product.existencia_total <= 0 || !product.lotes || product.lotes.length === 0) {
          stockChanged = true
          continue // Se elimina del carrito (no se agrega a validatedCart)
        }

        // Usamos siempre el primer lote del producto actualizado
        const currentLot = product.lotes[0]

        // Caso 2: La cantidad en carrito es mayor a la existencia real del producto
        if (item.quantity > product.existencia_total) {
          stockChanged = true
          validatedCart.push({
            ...item, // Mantenemos el item base
            ...product, // Sobrescribimos con datos frescos del producto
            lote: currentLot, // Usamos el lote fresco
            quantity: product.existencia_total // Ajustamos al máximo disponible
          })
        } else {
          // Caso 3: Todo bien, mantenemos el item pero actualizamos los datos del producto y lote
          validatedCart.push({ 
            ...item, 
            ...product,
            lote: currentLot 
          })
        }
      }

      if (stockChanged) {
        setCart(validatedCart)
        setProducts(currentInventory) // Actualizamos la lista visual de productos
        alert("⚠️ El inventario ha cambiado. Se han ajustado las cantidades de tu carrito según la disponibilidad actual. Por favor revisa el total y vuelve a enviar.")
        setIsSubmitting(false)
        return // DETENER EL ENVÍO
      }
    } catch (error) {
      console.error("Error validando stock:", error)
      alert("Error al validar existencia. Por favor intente nuevamente.")
      setIsSubmitting(false)
      return
    }
    // ---------------------------

    const orderData = {
      cliente: user.codigoCliente,
      items: cart.map(item => ({
        codigo: item.codigo,
        descripcion: item.descripcion,
        quantity: item.quantity,
        precio_total: (item.lote.precio_con_descuento * item.quantity).toFixed(2)
      }))
    }

    try {
      const response = await fetch("https://jkserverom.drogueriajoskar.com:7030/pedido/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok) {
        // setOrderNumber(result.pedidoNro)
        setOrderSuccess(true)
        setCart([])
        setQuantities({})
      } else {
        alert("Error al enviar el pedido: " + (result.error || "Error desconocido"))
      }
    } catch (error) {
      console.error("Error enviando pedido:", error)
      alert("Error de conexión al enviar el pedido.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
        <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
            {/* Header con Búsqueda y Resumen */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-2xl font-bold">Carrito de Compras</h1>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Buscar producto..."
                    className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Resumen flotante del carrito */}
                <Drawer direction="right">
                  <DrawerTrigger asChild>
                    <div className="flex items-center gap-4 bg-muted px-3 py-2 rounded-md border cursor-pointer hover:bg-accent transition-colors">
                      <div className="relative">
                        <ShoppingCart className="h-6 w-6" />
                        {cart.reduce((acc, item) => acc + item.quantity, 0) > 0 && (
                          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col text-xs text-right min-w-20">
                        <span className="font-bold text-green-600">${finalTotalUSD.toFixed(2)}</span>
                        <span className="text-muted-foreground">Bs. {finalTotalBs.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-right border-l pl-3">
                        <span className="font-medium text-muted-foreground">BCV:</span>
                        <div className="font-bold">{factorCambiario.toFixed(2)}</div>
                      </div>
                    </div>
                  </DrawerTrigger>
                  <DrawerContent>
                    {orderSuccess ? (
                      <div className="flex flex-col items-center justify-center p-8 gap-6 min-h-75">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div className="text-center space-y-2">
                          <DrawerTitle className="text-2xl font-bold text-green-600">¡Pedido Enviado!</DrawerTitle>
                          <DrawerDescription className="text-base">
                            Tu pedido ha sido registrado exitosamente.
                          </DrawerDescription>
                        </div>
                        <DrawerFooter className="w-full">
                          <DrawerClose asChild>
                            <Button 
                              className="w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setOrderSuccess(false)}
                            >
                              Aceptar
                            </Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </div>
                    ) : (
                    <>
                    <DrawerHeader>
                      <DrawerTitle>Tu Carrito</DrawerTitle>
                      <DrawerDescription>
                        {cart.length} productos agregados
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="flex-1 overflow-y-auto px-4 py-2">
                      {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
                          <p>El carrito está vacío</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {cart.map((item, index) => (
                            <div key={`${item.codigo}-${index}`} className="flex flex-col gap-2 border-b pb-4 last:border-0">
                              <div className="flex justify-between gap-2">
                                <span className="font-medium text-sm line-clamp-2">{item.descripcion}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
                                  onClick={() => removeFromCart(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex justify-between items-end text-sm">
                                <div className="text-muted-foreground text-xs">
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center border rounded-md bg-background">
                                      <button 
                                        onClick={() => updateCartQuantity(index, -1)}
                                        className="h-6 w-6 flex items-center justify-center hover:bg-muted transition-colors"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                                      <button 
                                        onClick={() => updateCartQuantity(index, 1)}
                                        className="h-6 w-6 flex items-center justify-center hover:bg-muted transition-colors"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <span>x ${item.lote.precio_con_descuento.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="font-bold">
                                  ${(item.lote.precio_con_descuento * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <DrawerFooter>
                      <div className="flex flex-col gap-2 mb-4 border-t pt-4">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Subtotal</span>
                          <span>${totalUSD.toFixed(2)}</span>
                        </div>
                        {discountInfo.percentage > 0 && (
                          <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>Descuento de Semana Santa ({discountInfo.percentage}%)</span>
                            <span>-${discountInfo.amountUSD.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>${finalTotalUSD.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>Bs.</span>
                          <span>Bs. {finalTotalBs.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button 
                        className="w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white" 
                        disabled={cart.length === 0 || isSubmitting}
                        onClick={submitOrder}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          "Enviar Pedido"
                        )}
                      </Button>
                    </DrawerFooter>
                    </>
                    )}
                  </DrawerContent>
                </Drawer>
              </div>
            </div>

            {/* Tabla de Productos */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Vista Lista de Tarjetas (Horizontal) */}
                <div className="flex flex-col gap-4">
                  {paginatedProducts.map((product) => {
                    const defaultLot = product.lotes[0] || {}
                    const qty = quantities[product.codigo] !== undefined ? quantities[product.codigo] : 1
                    return (
                      <div key={product.codigo} className="flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-card text-card-foreground shadow-sm items-start md:items-center">
                        {/* Header: Image + Title */}
                        <div className="flex gap-4 flex-1 min-w-0 w-full md:w-auto">
                          <img 
                            src={`https://drogueriajoskar.com/joskarerp/productos/${product.barra}.avif`} 
                            alt={product.descripcion}
                            className="h-16 w-16 rounded object-cover bg-muted border shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(`https://drogueriajoskar.com/joskarerp/productos/${product.barra}.avif`)}
                            onError={(e) => {
                              e.currentTarget.src = product.imagen || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg==";
                              e.currentTarget.onerror = null; // Prevenir loop infinito
                            }}
                          />
                          <div className="flex flex-col justify-center min-w-0">
                            <span className="font-medium text-sm line-clamp-2 leading-tight">{product.descripcion}</span>
                            <span className="text-xs text-muted-foreground mt-1">Código: {product.barra}</span>
                          </div>
                        </div>

                        {/* Details: Stock, FV, Prices, Discounts */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto md:flex md:items-center md:gap-6 text-sm">
                           
                           {/* Stock & FV */}
                           <div className="flex flex-col text-xs text-muted-foreground whitespace-nowrap">
                              <span>📦 Stock: {Math.floor(product.existencia_total)}</span>
                              <span>🗓️ FV: {defaultLot.fv || 'N/A'}</span>
                           </div>

                           {/* Prices */}
                           <div className="flex flex-col whitespace-nowrap">
                              <span className="text-xs text-red-500/50">
                                ${product.precio_principal?.toFixed(2)}
                              </span>
                              <span className="text-xs text-red-500/50">
                                Bs. {product.precio_principal_tasa?.toFixed(2)}
                              </span>
                           </div>
                           
                           {/* Discounts */}
                           <div className="flex flex-col text-xs text-muted-foreground whitespace-nowrap">
                              <span>Desc P.P: 10%</span>
                              <span>Desc Prod: {defaultLot.descuento}%</span>
                              <span>Desc Cliente: {defaultLot.dcliente}%</span>
                           </div>
                        </div>
                        
                           {/* Prices */}
                           <div className="flex flex-col whitespace-nowrap">
                              <span className="font-bold text-green-600 text-base">
                                ${defaultLot.precio_con_descuento?.toFixed(2)}
                              </span>
                              <span className="text-xs text-green-600">
                                Bs. {defaultLot.precio_con_descuento_tasa?.toFixed(2)}
                              </span>
                           </div>

                        {/* Actions: Quantity + Add */}
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end md:justify-start shrink-0">
                            <div className="flex items-center border rounded-md bg-background shadow-sm h-9 w-28">
                                  <button 
                                    onClick={() => handleQuantityChange(product.codigo, -1)}
                                    className="h-full w-8 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full text-center text-sm font-medium bg-transparent border-none focus:outline-none h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value={qty}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      if (val === '') {
                                        setQuantities(prev => ({ ...prev, [product.codigo]: 0 }))
                                        return
                                      }
                                      const num = parseInt(val)
                                      if (!isNaN(num) && num >= 0) {
                                        setQuantities(prev => ({ ...prev, [product.codigo]: num }))
                                      }
                                    }}
                                  />
                                  <button 
                                    onClick={() => handleQuantityChange(product.codigo, 1)}
                                    className="h-full w-8 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                            </div>
                              <button 
                                onClick={() => addToCart(product)}
                                disabled={qty <= 0}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                Agregar
                              </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {filteredProducts.length === 0 && !loading && (
                  <div className="p-12 text-center text-muted-foreground rounded-lg border bg-card">
                    {searchTerm ? "No se encontraron productos con esa búsqueda." : "Cargando inventario..."}
                  </div>
                )}
                
                {/* Controles de Paginación */}
                {filteredProducts.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} productos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                      </Button>
                      <div className="text-sm font-medium mx-2">
                        Página {currentPage} de {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal para ver imagen ampliada */}
            {selectedImage && (
              <div 
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm transition-all"
                onClick={() => setSelectedImage(null)}
              >
                <div className="relative max-w-4xl max-h-screen flex flex-col items-center">
                  <img 
                    src={selectedImage} 
                    alt="Vista ampliada" 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl bg-white/5"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <p className="text-white/80 mt-4 text-sm bg-black/50 px-4 py-2 rounded-full cursor-pointer hover:bg-black/70 hover:text-white transition-colors">
                    Haz clic afuera para cerrar
                  </p>
                </div>
              </div>
            )}
        </div>
  )
}