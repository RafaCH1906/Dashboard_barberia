export interface BarberShop {
  id: string
  name: string
  phone: string
  address: string
  services: Service[]
  schedule: Record<string, [string, string] | null>
}

export interface Service {
  name: string
  price: number
  duration: number
}

export interface Customer {
  id: string
  barber_shop_id: string
  phone: string
  name: string | null
  last_visit: string | null
}

export interface Booking {
  id: string
  barber_shop_id: string
  customer_id: string
  service_name: string
  service_price: number
  starts_at: string
  ends_at: string
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  reminder_sent: boolean
  // joined
  customers?: Customer
}

export type BookingStatus = Booking['status']
