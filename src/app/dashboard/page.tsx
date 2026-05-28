'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { BarberShop, Booking, BookingStatus } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocalDateString(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: string }> = {
  confirmed: {
    label: 'Confirmada',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
    icon: '📅',
  },
  completed: {
    label: 'Completada',
    color: 'text-success',
    bg: 'bg-success-dim border-success/20',
    icon: '✅',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'text-muted',
    bg: 'bg-muted/10 border-muted/20',
    icon: '❌',
  },
  no_show: {
    label: 'No asistió',
    color: 'text-danger',
    bg: 'bg-danger-dim border-danger/20',
    icon: '⚠️',
  },
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

function StatCard({ label, value, icon, accent = false }: { label: string; value: string | number; icon: string; accent?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] ${accent
        ? 'border-accent/30 bg-gradient-to-br from-accent-dim to-surface'
        : 'border-border bg-surface'
      }`}>
      {accent && <div className="absolute inset-0 animate-shimmer" />}
      <div className="relative flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm text-muted-light">{label}</p>
          <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-accent' : 'text-foreground'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}

function BookingCard({
  booking,
  onUpdateStatus,
  isUpdating,
}: {
  booking: Booking
  onUpdateStatus: (id: string, status: BookingStatus) => void
  isUpdating: boolean
}) {
  const customerName = booking.customers?.name || 'Cliente'
  const isActive = booking.status === 'confirmed'

  return (
    <div
      className={`group rounded-2xl border transition-all duration-300 ${isActive
          ? 'border-border-light bg-surface hover:border-accent/30 hover:shadow-lg hover:shadow-accent-glow'
          : 'border-border bg-surface/60'
        }`}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: time + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl font-bold text-sm ${isActive
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'bg-surface-hover text-muted border border-border'
              }`}>
              {formatTime(booking.starts_at)}
            </div>
            <div>
              <h3 className={`font-semibold text-base ${isActive ? 'text-foreground' : 'text-muted-light'}`}>
                {customerName}
              </h3>
              <p className="text-sm text-muted">{booking.customers?.phone}</p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Service info */}
        <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 mb-3 ${isActive ? 'bg-background/60' : 'bg-background/30'
          }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">✂️</span>
            <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-light'}`}>
              {booking.service_name}
            </span>
          </div>
          <span className={`text-sm font-bold ${isActive ? 'text-accent' : 'text-muted'}`}>
            S/{booking.service_price}
          </span>
        </div>

        {/* Action buttons */}
        {isActive && (
          <div className="flex gap-2">
            <button
              disabled={isUpdating}
              onClick={() => onUpdateStatus(booking.id, 'completed')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              Completada
            </button>
            <button
              disabled={isUpdating}
              onClick={() => onUpdateStatus(booking.id, 'no_show')}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-danger-dim text-danger border border-danger/20 hover:bg-danger/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              No asistió
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-hover" />
          <div className="space-y-2">
            <div className="h-4 w-28 bg-surface-hover rounded-lg" />
            <div className="h-3 w-20 bg-surface-hover rounded-lg" />
          </div>
        </div>
        <div className="h-6 w-24 bg-surface-hover rounded-full" />
      </div>
      <div className="h-10 w-full bg-surface-hover rounded-xl mb-3" />
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-surface-hover rounded-xl" />
        <div className="flex-1 h-10 bg-surface-hover rounded-xl" />
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

type Tab = 'today' | 'tomorrow'

export default function DashboardPage() {
  const [shop, setShop] = useState<BarberShop | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [tab, setTab] = useState<Tab>('today')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const dateStr = tab === 'today' ? getLocalDateString(0) : getLocalDateString(1)

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

  const fetchBookings = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const res = await fetch(`/api/bookings?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setBookings((data as Booking[]) || [])
      }
    } catch (e) {
      console.error('Error fetching bookings:', e)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [dateStr])

  useEffect(() => {
    fetchShop()
  }, [fetchShop])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Polling every 10 seconds in the background
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings(false)
    }, 10000)

    return () => {
      clearInterval(interval)
    }
  }, [fetchBookings])

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    setUpdatingId(id)
    
    // Optimistic update
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    )

    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (!res.ok) {
        fetchBookings(false)
      }
    } catch (e) {
      console.error('Error updating status:', e)
      fetchBookings(false)
    } finally {
      setUpdatingId(null)
    }
  }

  // Stats
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length
  const completedCount = bookings.filter((b) => b.status === 'completed').length
  const totalRevenue = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + (b.service_price || 0), 0)
  const pendingRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.service_price || 0), 0)

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
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-background transition-all duration-200 cursor-pointer"
              >
                Citas
              </Link>
              <Link
                href="/clientes"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-light hover:text-foreground transition-all duration-200 cursor-pointer"
              >
                Clientes
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 pb-20">
        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-2xl bg-surface border border-border mb-5">
          {(['today', 'tomorrow'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${tab === t
                  ? 'bg-accent text-background shadow-lg shadow-accent/20'
                  : 'text-muted-light hover:text-foreground'
                }`}
            >
              {t === 'today' ? '📆 Hoy' : '📅 Mañana'}
            </button>
          ))}
        </div>

        {/* Date label */}
        <p className="text-sm text-muted mb-4 capitalize pl-1">
          {formatDateLabel(dateStr)}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon="📋"
            label="Citas pendientes"
            value={confirmedCount}
          />
          <StatCard
            icon="✅"
            label="Completadas"
            value={completedCount}
          />
          <StatCard
            icon="💰"
            label="Ganado"
            value={`S/${totalRevenue}`}
            accent
          />
          <StatCard
            icon="⏳"
            label="Por cobrar"
            value={`S/${pendingRevenue}`}
          />
        </div>

        {/* Booking list heading */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">
            Citas ({bookings.length})
          </h2>
          <button
            onClick={() => fetchBookings()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-light hover:text-foreground bg-surface hover:bg-surface-hover border border-border transition-all duration-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
            Actualizar
          </button>
        </div>

        {/* Booking cards */}
        <div className="space-y-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
                <span className="text-4xl">💈</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Sin citas</h3>
              <p className="text-sm text-muted max-w-[240px]">
                No hay citas programadas para {tab === 'today' ? 'hoy' : 'mañana'}.
              </p>
            </div>
          ) : (
            bookings.map((booking, i) => (
              <div
                key={booking.id}
                className={`animate-fade-in-up opacity-0 stagger-${Math.min(i + 1, 5)}`}
              >
                <BookingCard
                  booking={booking}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={updatingId === booking.id}
                />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
