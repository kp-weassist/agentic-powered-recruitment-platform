import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After successful exchange, decide destination based on onboarding status
      const { data: auth } = await supabase.auth.getUser()
      const uid = auth.user?.id
      if (uid) {
        const { data: userRow } = await supabase
          .from('users')
          .select('role,is_onboarding_completed')
          .eq('id', uid)
          .maybeSingle()
        let destination = next
        if (userRow) {
          if (!userRow.is_onboarding_completed || !userRow.role ) {
            destination = '/onboarding'
          } else if (userRow.role === 'employer') {
            destination = '/employer'
          } else if (userRow.role === 'candidate') {
            destination = '/candidate'
          } else if (userRow.role === 'admin') {
            destination = '/admin'
          }
        }

        const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
        const isLocalEnv = process.env.NODE_ENV === 'development'
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${destination}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${destination}`)
        } else {
          return NextResponse.redirect(`${origin}${destination}`)
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}