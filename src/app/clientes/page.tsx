'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { BarberShop, Customer } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastVisit(dateStr: string | null): string {
  if (!dateStr) return 'Sin visitas registradas'

  try {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)

    const today = new Date()
    if (today.getFullYear() === y && today.getMonth() === m - 1 && today.getDate() === d) {
      return 'Hoy'
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (yesterday.getFullYear() === y && yesterday.getMonth() === m - 1 && yesterday.getDate() === d) {
      return 'Ayer'
    }

    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch (e) {
    return dateStr
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function SkeletonCustomerCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-hover rounded-lg" />
          <div className="h-3 w-24 bg-surface-hover rounded-lg" />
        </div>
        <div className="h-6 w-20 bg-surface-hover rounded-full" />
      </div>
      <div className="h-2 w-full bg-surface-hover rounded-full mb-4" />
      <div className="flex gap-2">
        <div className="flex-1 h-9 bg-surface-hover rounded-xl" />
        <div className="flex-1 h-9 bg-surface-hover rounded-xl" />
      </div>
    </div>
  )
}

// ─── Customers Page ───────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [shop, setShop] = useState<BarberShop | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchShop = useCallback(async () => {
    try {
      const res = await fetch('/api/shop')
      if (res.ok) {
        const data = await res.json()
        setShop(data as BarberShop)
      }
    } catch (e) {
      console.error('Error fetching shop:', e)
    }
  }, [])

  const fetchCustomers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers((data as Customer[]) || [])
      }
    } catch (e) {
      console.error('Error fetching customers:', e)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShop()
    fetchCustomers()
  }, [fetchShop, fetchCustomers])

  // Polling every 30 seconds for background refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCustomers(false)
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [fetchCustomers])

  // Manual point addition with optimistic update
  const handleAddPoint = async (customerId: string) => {
    const previousCustomers = [...customers]

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newPoints = c.loyalty_points + 1
          return { ...c, loyalty_points: newPoints }
        }
        return c
      })
    )

    try {
      const targetCustomer = previousCustomers.find((c) => c.id === customerId)
      if (!targetCustomer) return

      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customerId,
          loyalty_points: targetCustomer.loyalty_points + 1,
        }),
      })

      if (!res.ok) {
        setCustomers(previousCustomers)
      }
    } catch (e) {
      console.error('Error updating loyalty points:', e)
      setCustomers(previousCustomers)
    }
  }

  // Reset points with confirmation and optimistic update
  const handleResetPoints = async (customerId: string) => {
    const targetCustomer = customers.find((c) => c.id === customerId)
    if (!targetCustomer) return

    const confirmReset = window.confirm(
      `¿Confirmas que vas a canjear el premio de ${targetCustomer.name || 'este cliente'}? Sus puntos volverán a 0.`
    )
    if (!confirmReset) return

    const previousCustomers = [...customers]

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return { ...c, loyalty_points: 0 }
        }
        return c
      })
    )

    try {
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: customerId,
          loyalty_points: 0,
        }),
      })

      if (!res.ok) {
        setCustomers(previousCustomers)
      }
    } catch (e) {
      console.error('Error resetting loyalty points:', e)
      setCustomers(previousCustomers)
    }
  }

  // Filter customers by name or phone
  const filteredCustomers = customers.filter((c) => {
    const name = c.name?.toLowerCase() || ''
    const phone = c.phone || ''
    const query = searchQuery.toLowerCase()
    return name.includes(query) || phone.includes(query)
  })

  // Count clients with free cut ready
  const freeCutsAvailable = customers.filter(
    (c) => c.loyalty_points >= (c.loyalty_goal || 10)
  ).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/20">
                <span className="text-lg">✂️</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  {shop?.name || 'Cargando...'}
                </h1>
                <p className="text-xs text-muted">{shop?.address}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-surface border border-border">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-light hover:text-foreground transition-all duration-200 cursor-pointer"
              >
                Citas
              </Link>
              <Link
                href="/clientes"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-background transition-all duration-200 cursor-pointer"
              >
                Clientes
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 pb-20">
        {/* Banner de cortes gratis */}
        {freeCutsAvailable > 0 && (
          <div className="mb-5 p-4 rounded-2xl border border-accent/20 bg-accent-dim flex items-center justify-between gap-3 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <h3 className="text-sm font-bold text-accent">Premio de Lealtad Listo</h3>
                <p className="text-xs text-muted-light">
                  Hay {freeCutsAvailable} {freeCutsAvailable === 1 ? 'cliente que tiene' : 'clientes que tienen'} un corte gratis disponible.
                </p>
              </div>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
          </div>
        )}

        {/* Search and stats */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-surface text-foreground placeholder-muted text-sm font-medium focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-light hover:text-foreground cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Customers list heading */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">
            Clientes registrados ({filteredCustomers.length})
          </h2>
          <button
            onClick={() => fetchCustomers()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-light hover:text-foreground bg-surface hover:bg-surface-hover border border-border transition-all duration-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
            Actualizar
          </button>
        </div>

        {/* Customers list */}
        <div className="space-y-3">
          {loading ? (
            <>
              <SkeletonCustomerCard />
              <SkeletonCustomerCard />
              <SkeletonCustomerCard />
            </>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Sin clientes</h3>
              <p className="text-sm text-muted max-w-[245px]">
                {searchQuery
                  ? 'No se encontraron clientes que coincidan con la búsqueda.'
                  : 'Aún no hay clientes registrados en esta barbería.'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer, i) => {
              const goal = customer.loyalty_goal || 10
              const points = customer.loyalty_points || 0
              const reachedGoal = points >= goal
              const progressPercent = Math.min((points / goal) * 100, 100)

              return (
                <div
                  key={customer.id}
                  className={`group rounded-2xl border transition-all duration-300 p-4 sm:p-5 bg-surface hover:border-border-light animate-fade-in-up opacity-0 stagger-${Math.min(i + 1, 5)}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-base text-foreground">
                        {customer.name || 'Cliente sin nombre'}
                      </h3>
                      <p className="text-xs text-muted-light mt-0.5">{customer.phone}</p>
                      <p className="text-xs text-muted mt-2">
                        Última visita: <span className="font-medium text-muted-light">{formatLastVisit(customer.last_visit)}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`text-sm font-bold tracking-wider ${reachedGoal ? 'text-accent' : 'text-foreground'}`}>
                        {points}/{goal} pts
                      </span>
                      {reachedGoal ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-accent-dim text-accent border border-accent/20 animate-pulse-glow">
                          🎁 Corte Gratis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-hover text-muted-light border border-border">
                          En progreso
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-border rounded-full h-2 mb-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        reachedGoal
                          ? 'bg-gradient-to-r from-accent to-accent-hover'
                          : 'bg-accent'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddPoint(customer.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-accent-dim text-accent border border-accent/20 hover:bg-accent/10 transition-all duration-200 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                      Sumar punto (+1)
                    </button>
                    {reachedGoal ? (
                      <button
                        onClick={() => handleResetPoints(customer.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-accent text-background hover:bg-accent-hover transition-all duration-200 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        Canjear corte
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResetPoints(customer.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-surface-hover text-muted-light hover:text-foreground border border-border transition-all duration-200 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M16 3h5v5" /></svg>
                        Reiniciar puntos
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
