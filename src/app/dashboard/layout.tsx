'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Overview',       href: '/dashboard',              icon: '◈' },
  { name: 'Content Queue',  href: '/dashboard/queue',        icon: '⊞' },
  { name: 'Generate',       href: '/dashboard/generate',     icon: '✦' },
  { name: 'Connections',    href: '/dashboard/connections',  icon: '⬡' },
  { name: 'Billing',        href: '/dashboard/billing',      icon: '◇' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserEmail(user.email ?? null)
      else router.push('/auth/login')
      setLoading(false)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ba-bg)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--ba-border-2)', borderTopColor: 'var(--ba-accent)', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const initial = userEmail?.[0]?.toUpperCase() ?? '?'
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const active = isActive(item.href)
        return (
          <Link key={item.name} href={item.href}
            onClick={() => setSidebarOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--ba-r-md)',
              fontSize: '0.875rem', fontWeight: 500,
              color: active ? 'var(--ba-accent)' : 'var(--ba-text-muted)',
              background: active ? 'var(--ba-accent-dim)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 120ms',
            }}>
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
            {item.name}
          </Link>
        )
      })}
    </>
  )

  const sidebar = (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--ba-surface)', borderRight: '1px solid var(--ba-border)',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--ba-border)' }}>
        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ba-text)', letterSpacing: '-0.02em' }}>
          Book<span style={{ color: 'var(--ba-accent)' }}>Amplify</span>
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLinks />
      </nav>

      {/* User footer */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--ba-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.5rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--ba-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>
            {initial}
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--ba-text-muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userEmail}
          </span>
        </div>
        <button onClick={handleSignOut} className="ba-btn ba-btn--ghost"
          style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8125rem' }}>
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ba-bg)', display: 'flex' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)} />
          <div style={{ position: 'absolute', inset: '0 auto 0 0', width: 256 }}>
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div style={{ width: 256, flexShrink: 0, position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 10 }}
        className="hidden md:block">
        {sidebar}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, minWidth: 0 }} className="md:ml-64">
        {/* Mobile topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', height: 56, borderBottom: '1px solid var(--ba-border)', background: 'var(--ba-surface)' }}
          className="md:hidden">
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--ba-text-muted)', fontSize: '1.25rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            ☰
          </button>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ba-text)' }}>
            Book<span style={{ color: 'var(--ba-accent)' }}>Amplify</span>
          </span>
          <div style={{ width: 24 }} />
        </div>

        <main style={{ padding: '2rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
