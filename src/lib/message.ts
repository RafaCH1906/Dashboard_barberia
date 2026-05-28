import toast from 'react-hot-toast';

/**
 * Enqueue a message for a client via the server‑side API.
 *
 * @param phone - Normalized phone number (including country code). Null/undefined skips sending.
 * @param message - Text of the WhatsApp message.
 * @param barberShopId - Identifier of the barber shop (from env or prop).
 */
export async function queueMessage(
  phone: string | null | undefined,
  message: string,
  barberShopId: string = process.env.NEXT_PUBLIC_BARBER_SHOP_ID || ''
) {
  if (!phone) return; // No phone → nothing to enqueue
  try {
    const res = await fetch('/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message, barber_shop_id: barberShopId })
    });
    if (!res.ok) throw new Error('Failed to enqueue message');
    toast.success('Mensaje encolado al cliente');
  } catch (e) {
    console.error('queueMessage error', e);
    toast.error('Error al encolar mensaje');
  }
}
