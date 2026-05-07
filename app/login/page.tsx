import { LoginForm } from "@/components/login-form"
import { Suspense } from "react"

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url('/login-bg.jpg')] bg-cover bg-center">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-bold text-2xl text-white">
          DROGUERIA JOSKAR
        </a>
        <Suspense fallback={<div>Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
