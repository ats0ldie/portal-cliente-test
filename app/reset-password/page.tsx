"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { type EmailOtpType } from "@supabase/supabase-js"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [isSessionValid, setIsSessionValid] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  const verifyAttempted = useRef(false)

  const searchParams = useSearchParams()
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')
  const errorCode = searchParams.get('error_code')

  // Verificar el token al cargar la página para establecer la sesión
  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    // 0. Si la URL ya trae un error
    if (errorParam || errorDesc || errorCode) {
      setMessage({ 
        type: "error", 
        text: errorDesc || errorParam || "Error procesando la solicitud" 
      })
      setVerifying(false)
      return
    }

    const verify = async () => {
      // 1. PRIORIDAD: Verificar si hay hash en la URL (Implicit Flow)
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        
        if (access_token && refresh_token) {
          const { data } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })
          if (data?.session && isMounted) {
            setIsSessionValid(true)
            setVerifying(false)
            return
          }
        }
      }

      // 2. Intentar intercambio de código (PKCE) o token_hash
      if (!verifyAttempted.current) {
        if (code) {
          verifyAttempted.current = true
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (data?.session && isMounted) {
            setIsSessionValid(true)
            setVerifying(false)
            return
          }
          
          // Si falla el código (ej: PKCE verifier missing), intentamos con token_hash como respaldo
          if (error) {
             if (token_hash) {
                const otpType = type || 'recovery'
                const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({ token_hash, type: otpType })
                if (otpData?.session && isMounted) {
                   setIsSessionValid(true)
                   setVerifying(false)
                   return
                }
             }
             
             if (isMounted) {
                setMessage({ type: "error", text: error.message })
                setVerifying(false)
                return
             }
          }
        } else if (token_hash) {
          // Si hay token_hash, intentamos verificar. Si falta el type, asumimos 'recovery'
          const otpType = type || 'recovery'
          verifyAttempted.current = true
          const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: otpType })
          if (data?.session && isMounted) {
            setIsSessionValid(true)
            setVerifying(false)
            return
          }
          if (error && isMounted) {
             setMessage({ type: "error", text: error.message })
          }
        }
      }

      // 3. Polling para detectar sesión
      let attempts = 0
      const maxAttempts = 20 
      
      const checkSession = async () => {
        if (!isMounted) return

        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setIsSessionValid(true)
          setVerifying(false)
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkSession, 200)
        } else {
          if (isMounted) {
            setIsSessionValid(false)
            setMessage(prev => prev?.type === 'error' ? prev : { type: "error", text: "No se pudo verificar la sesión. El enlace puede haber expirado." })
            setVerifying(false)
          }
        }
      }

      checkSession()
    }

    verify()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && isMounted) {
        setIsSessionValid(true)
        setVerifying(false)
        setMessage(null) // Limpiar cualquier error previo si la sesión es válida
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [token_hash, type, code, errorParam, errorDesc, errorCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden." })
      return
    }

    if (password.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." })
      return
    }

    setLoading(true)
    const supabase = createClient()
    
    // Asegurarse de que hay sesión antes de actualizar
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setMessage({ type: "error", text: "No se detectó una sesión activa. El enlace puede haber expirado." })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setMessage({ type: "error", text: error.message })
      setLoading(false)
    } else {
      setMessage({ type: "success", text: "Contraseña actualizada correctamente. Redirigiendo..." })
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    }
  }

  if (verifying) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url('/login-bg.jpg')] bg-cover bg-center">
        <div className="flex flex-col items-center gap-4 bg-card p-8 rounded-xl shadow-lg border">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-card-foreground">Verificando enlace...</p>
        </div>
      </div>
    )
  }

  if (!isSessionValid) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url('/login-bg.jpg')] bg-cover bg-center">
        <div className="flex w-full max-w-sm flex-col gap-6 bg-card p-6 rounded-xl shadow border text-center">
          <h1 className="text-xl font-bold text-red-600">Enlace inválido</h1>
          <p className="text-sm text-muted-foreground mb-4">{message?.text || "No se pudo verificar la sesión. El enlace puede haber expirado."}</p>
          <button onClick={() => router.push('/login')} className="bg-primary text-primary-foreground h-9 px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 w-full">Ir al Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url('/login-bg.jpg')] bg-cover bg-center">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-bold text-2xl text-white">
          DROGUERIA JOSKAR
        </a>
        <div className="flex flex-col gap-6 bg-card text-card-foreground border shadow rounded-xl p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Restablecer Contraseña</h1>
            <p className="text-sm text-muted-foreground">Ingresa tu nueva contraseña a continuación.</p>
          </div>

          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium leading-none">Nueva Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                  placeholder="******"
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

            <div className="grid gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">Confirmar Contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="******"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...</> : "Cambiar Contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}