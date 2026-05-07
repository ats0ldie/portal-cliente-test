'use client'

import { login } from '@/app/login/actions'
import { createClient } from "@/utils/supabase/client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"form">) {
  const [email, setEmail] = useState("")
  const [loadingReset, setLoadingReset] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)
  
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const message = searchParams.get("message")

  useEffect(() => {
    // Detectar si venimos de una invitación de Supabase (Implicit Flow) que redirigió a /login
    // El hash contiene access_token y type=invite
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash
      if (hash.includes("type=invite") && hash.includes("access_token")) {
        window.location.replace("/activate" + hash)
      }
    }
  }, [])

  // Resetear estado de carga cuando cambian los parámetros (ej: si vuelve con error)
  useEffect(() => {
    setLoadingLogin(false)
  }, [searchParams])

const handleResetPassword = async () => {
  if (!resetEmail) {
    alert("Por favor, ingresa tu correo electrónico.")
    return
  }

  setLoadingReset(true)
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
    redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
  })
  
  setLoadingReset(false)

  if (error) {
    alert("Error al enviar el correo: " + error.message)
  } else {
    alert("Se ha enviado un enlace de recuperación a tu correo.")
    setShowResetModal(false)
  }
}

const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  setLoadingLogin(true)
  const formData = new FormData(e.currentTarget)
  await login(formData)
  setLoadingLogin(false)
}

const getErrorMessage = () => {
  const err = error || message
  if (!err) return null
  if (err === "Invalid login credentials") return "Credenciales inválidas"
  if (err === "Could not authenticate user") return "Correo o contraseña incorrectos"
  return err
}

  return (
    <>
    <form onSubmit={handleLogin} className={`flex flex-col gap-6 bg-card text-card-foreground border shadow rounded-xl p-6 ${className || ''}`} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-xl font-bold">Inicia sesión</h1>
      </div>
      
      {getErrorMessage() && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center font-medium border border-red-200">
          {getErrorMessage()}
        </div>
      )}

      <div className="grid gap-6">
        <div className="grid gap-2">
          <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center">
            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Contraseña
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loadingLogin}
          className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
        >
          {loadingLogin ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando...</> : "Iniciar sesión"}
        </button>
      </div>
      <div className="text-center text-sm">
        <button 
          type="button" 
          onClick={() => {
            setResetEmail(email)
            setShowResetModal(true)
          }}
          className="ml-auto text-sm underline-offset-4 hover:underline bg-transparent border-none p-0 cursor-pointer text-inherit"
        >
            ¿Olvidaste tu contraseña?
        </button>
        {/* ¿No tienes una cuenta?{" "}
        <a href="#" className="underline underline-offset-4">
          Regístrate
        </a> */}
      </div>
    </form>

    {showResetModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-card text-card-foreground border shadow-lg rounded-xl p-6 w-full max-w-sm space-y-4">
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-bold">Recuperar contraseña</h3>
            <p className="text-sm text-muted-foreground">
              Por favor, ingresa tu correo electrónico para recuperar la contraseña.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-sm font-medium leading-none">
              Correo electrónico
            </label>
            <input
              id="reset-email"
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="nombre@ejemplo.com"
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loadingReset}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              {loadingReset ? "Enviando..." : "Enviar enlace"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}