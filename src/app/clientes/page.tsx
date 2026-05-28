"use client";

import { useEffect, useState, useCallback, Fragment, FormEvent } from 'react';
import Link from 'next/link';
import type { BarberShop, Customer } from '@/lib/types';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import { queueMessage } from '@/lib/message';

/* ────────────────────── Helpers ────────────────────── */
function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  return digits.length === 9 ? `51${digits}` : digits;
}

function formatLastVisit(dateStr: string | null): { label: string; color: string } {
  if (!dateStr) return { label: 'Primera visita', color: 'text-emerald-400' };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { label: 'Fecha inválida', color: 'text-red-400' };
  const distance = formatDistanceToNow(date, { locale: es, addSuffix: true });
  return { label: `hace ${distance}`, color: 'text-gray-400' };
}

/* ────────────────────── Skeleton ────────────────────── */
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
  );
}

/* ────────────────────── Modal ────────────────────── */
function NewCustomerModal({ isOpen, onClose, onCreate }: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, phone: string | null, addVisit: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: FormEvent, addVisit: boolean) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return; }
    const normalizedPhone = phone ? normalizePhone(phone) : null;
    onCreate(name.trim(), normalizedPhone, addVisit);
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title className="text-lg font-medium text-gray-100 mb-4">Registrar cliente</Dialog.Title>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Nombre *</label>
                    <input type="text" className="w-full rounded-md bg-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Teléfono (opcional)</label>
                    <input type="tel" className="w-full rounded-md bg-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" value={phone} onChange={e => setPhone(e.target.value)} placeholder="987654321" />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button type="button" className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-500" onClick={onClose}>Cancelar</button>
                    <button type="button" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500" onClick={e => handleSubmit(e, false)}>Solo registrar</button>
                    <button type="submit" className="flex items-center gap-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500" onClick={e => handleSubmit(e, true)}>
                      <CheckIcon className="w-4 h-4" />
                      Registrar y sumar visita
                    </button>
                  </div>
                </form>
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-200" onClick={onClose}>
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/* ────────────────────── Main page ────────────────────── */
export default function ClientesPage() {
  const [shop, setShop] = useState<BarberShop | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchShop = useCallback(async () => {
    try { const res = await fetch('/api/shop'); if (res.ok) setShop(await res.json()); }
    catch (e) { console.error(e); }
  }, []);

  const fetchCustomers = useCallback(async (showLoad = true) => {
    if (showLoad) setLoading(true);
    try { const res = await fetch('/api/customers'); if (res.ok) setCustomers(await res.json()); }
    catch (e) { console.error(e); }
    finally { if (showLoad) setLoading(false); }
  }, []);

  useEffect(() => { fetchShop(); fetchCustomers(); }, [fetchShop, fetchCustomers]);

  // optimistic visit registration
  const handleAddPoint = async (id: string) => {
    const prev = [...customers];
    const now = new Date().toISOString();
    setCustomers(c => c.map(c => c.id === id ? { ...c, loyalty_points: (c.loyalty_points ?? 0) + 1, last_visit: now } : c));
    try {
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, loyalty_points: prev.find(c => c.id === id)!.loyalty_points + 1, last_visit: now })
      });
      if (!res.ok) throw new Error('fail');
      const customer = (await res.json()) as Customer;
      const msg = customer.loyalty_points >= (customer.loyalty_goal || 10)
        ? `🎉 ¡Felicitaciones ${customer.name || 'cliente'}! Has alcanzado ${customer.loyalty_points} puntos y puedes canjear tu corte gratis.`
        : `✅ Visita registrada para ${customer.name || 'cliente'}. Ahora tienes ${customer.loyalty_points} puntos.`;
      await queueMessage(customer.phone, msg);
      toast.success('Visita registrada +1 punto');
    } catch { setCustomers(prev); toast.error('Error al registrar visita'); }
  };

  const handleResetPoints = async (id: string) => {
    const prev = [...customers];
    setCustomers(c => c.map(c => c.id === id ? { ...c, loyalty_points: 0 } : c));
    try {
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, loyalty_points: 0 })
      });
      if (!res.ok) throw new Error('fail');
      const customer = (await res.json()) as Customer;
      const msg = `🔄 Tus puntos han sido reiniciados, ${customer.name || 'cliente'}. ¡Vuelve pronto para seguir acumulando!`;
      await queueMessage(customer.phone, msg);
      toast.success('Puntos reiniciados');
    } catch { setCustomers(prev); toast.error('Error al reiniciar'); }
  };

  const createCustomer = async (name: string, phone: string | null, addVisit: boolean) => {
    const payload: Partial<Customer> = {
      name,
      phone: phone || undefined,
      loyalty_points: addVisit ? 1 : 0,
      loyalty_goal: 10,
      last_visit: addVisit ? new Date().toISOString() : undefined
    };
    const toastId = toast.loading('Creando cliente…');
    try {
      const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('fail');
      const created = await res.json();
      setCustomers(c => [created, ...c]);
      toast.success('Cliente creado', { id: toastId });
      if (addVisit && created.phone) {
        const msg = `✅ Visita inicial registrada para ${created.name || 'cliente'}. Tienes 1 punto.`;
        await queueMessage(created.phone, msg);
      }
    } catch { toast.error('Error al crear cliente', { id: toastId }); }
  };

  const filtered = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || (c.phone ?? '').includes(q);
  });

  const freeCuts = customers.filter(c => c.loyalty_points >= (c.loyalty_goal || 10)).length;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 border border-accent/20">
              <span className="text-lg">✂️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{shop?.name || 'Cargando...'}</h1>
              <p className="text-xs text-muted">{shop?.address}</p>
            </div>
          </div>
          <Link href="/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-light hover:text-foreground">Citas</Link>
          <Link href="/clientes" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-background">Clientes</Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-5 pb-20">
        {freeCuts > 0 && (
          <div className="mb-5 p-4 rounded-2xl border border-accent/20 bg-accent-dim flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div>
                <h3 className="text-sm font-bold text-accent">Premio de Lealtad Listo</h3>
                <p className="text-xs text-muted-light">Hay {freeCuts} {freeCuts === 1 ? 'cliente' : 'clientes'} con corte gratis.</p>
              </div>
            </div>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
            </span>
          </div>
        )}
        <div className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted pointer-events-none">🔍</span>
            <input type="text" placeholder="Buscar…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-surface text-foreground placeholder-muted" />
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Clientes ({filtered.length})</h2>
          <button onClick={() => fetchCustomers()} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-surface-hover border border-border">Actualizar</button>
        </div>
        <div className="space-y-3">
          {loading ? (
            <>
              <SkeletonCustomerCard />
              <SkeletonCustomerCard />
              <SkeletonCustomerCard />
            </>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <p>No hay clientes.</p>
              <button onClick={() => setIsModalOpen(true)} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded">Crear cliente</button>
            </div>
          ) : (
            filtered.map(c => {
              const goal = c.loyalty_goal || 10;
              const pts = c.loyalty_points || 0;
              const reached = pts >= goal;
              const prog = Math.min((pts / goal) * 100, 100);
              const last = formatLastVisit(c.last_visit);
              return (
                <div key={c.id} className="rounded-2xl border p-4 bg-surface">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{c.name || 'Sin nombre'}</h3>
                      <p className="text-xs text-muted-light">{c.phone}</p>
                      <p className="text-xs">Última visita: <span className={last.color}>{last.label}</span></p>
                    </div>
                    <div className="text-right">
                      <span className={reached ? 'text-accent' : 'text-foreground'}>{pts}/{goal} pts</span>
                    </div>
                  </div>
                  <div className="w-full bg-border rounded-full h-2 my-2">
                    <div className={`h-full rounded-full ${reached ? 'bg-gradient-to-r from-accent to-accent-hover' : 'bg-accent'}`} style={{ width: `${prog}%` }} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddPoint(c.id)} className="flex-1 px-3 py-1 rounded bg-accent-dim text-accent">Visita</button>
                    {reached ? (
                      <button onClick={() => handleResetPoints(c.id)} className="flex-1 px-3 py-1 rounded bg-accent text-white">Canjear</button>
                    ) : (
                      <button onClick={() => handleResetPoints(c.id)} className="flex-1 px-3 py-1 rounded bg-surface-hover text-muted-light">Reiniciar</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-500" aria-label="Crear nuevo cliente">
        <PlusIcon className="w-7 h-7" />
      </button>
      <NewCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={createCustomer} />
    </div>
  );
}
