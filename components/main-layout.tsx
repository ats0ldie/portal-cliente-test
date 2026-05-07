"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { UserProvider } from "@/components/user-provider"
import { CuentaProvider } from "@/components/cuenta-provider"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Ocultar sidebar en la ruta /login (y /log-in por si acaso hay redirecciones antiguas)
  const isLoginPage = pathname === "/login" || pathname === "/log-in" || pathname === "/reset-password" || pathname === "/activate"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <UserProvider>
      <CuentaProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
      </CuentaProvider>
    </UserProvider>
  )
}