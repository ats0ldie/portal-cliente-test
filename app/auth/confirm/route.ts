import { createClient } from '@/utils/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  
  // Definir destino. Forzamos /activate para invitaciones ignorando el param 'next'
  // para evitar que configuraciones por defecto de Supabase manden al home/login
  let next = searchParams.get('next') ?? '/reset-password'
  if (type === 'invite') next = '/activate'

  const code = searchParams.get('code') // Supabase a veces envía 'code' en lugar de token_hash

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('next')

  // Forzar el dominio público para evitar redirecciones a 0.0.0.0:8090
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cliente.drogueriajoskar.com'
  if (siteUrl) {
    const publicUrl = new URL(siteUrl)
    redirectTo.protocol = publicUrl.protocol
    redirectTo.host = publicUrl.host
    redirectTo.port = publicUrl.port
  }

  // Si hay error en la URL (ej: token expirado detectado por Supabase), pasar al cliente
  if (searchParams.get('error_code')) {
    return NextResponse.redirect(redirectTo)
  }

  // Para recuperación de contraseña, delegar al cliente para evitar problemas de prefetching
  // También si el destino es explícitamente reset-password o activate, pasamos el control al cliente
  // incluso si 'type' no viene definido, para evitar que el servidor consuma el token erróneamente.
  if (type === 'recovery' || type === 'invite' || next.includes('/reset-password') || next.includes('/activate')) {
    return NextResponse.redirect(redirectTo)
  }

  const supabase = await createClient()

  // Si viene un código (Flujo PKCE), lo intercambiamos por una sesión
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirectTo.searchParams.delete('code')
      redirectTo.searchParams.delete('token_hash')
      redirectTo.searchParams.delete('type')
      return NextResponse.redirect(redirectTo)
    }
  } 
  
  // Si viene un token_hash (Flujo OTP)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      redirectTo.searchParams.delete('code')
      redirectTo.searchParams.delete('token_hash')
      redirectTo.searchParams.delete('type')
      return NextResponse.redirect(redirectTo)
    }
  }

  // Si algo sale mal, al login
  redirectTo.pathname = '/login'
  redirectTo.searchParams.set('error', 'Invalid token')
  redirectTo.searchParams.delete('code')
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  return NextResponse.redirect(redirectTo)
}