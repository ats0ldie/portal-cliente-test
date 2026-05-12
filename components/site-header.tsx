"use client"

// import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useUser } from "@/components/user-provider"

export function SiteHeader() {
  const { user } = useUser()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col py-1">
          <h1 className="text-base font-medium">{user.name}</h1>
          <h2 className="text-xs text-muted-foreground font-normal">
            Límite Crédito: {user.limit} | Días de crédito: {user.diasCredito} | Días de Tasa Protegida: {user.mfactura} | Días Pago de Contado: {user.diasppago1} | Descuento Pago de Contado: {user.poppago1}%
          </h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="#"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              Boton
            </a>
          </Button> */}
        </div>
      </div>
    </header>
  )
}
