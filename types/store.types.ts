import type { DeviceCondition } from '@/types/database.types';

export interface ProductVariant {
  id: string;
  sku: string;
  storage: string;
  ram: string | null;
  color: string;
  condition: DeviceCondition;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  images: string[];
}

export interface ProductSpecs {
  display?: string;
  processor?: string;
  camera?: string;
  battery?: string;
}

export interface ProductWithVariants {
  id: string;
  name: string;
  brand: string;
  slug: string;
  description: string | null;
  featured: boolean;
  created_at: string;
  variants: ProductVariant[];
  specs?: ProductSpecs;
}

export interface TrackedOrder {
  id: string;
  email: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'failed';
  created_at: string;
  tracking_number?: string;
  carrier?: string;
  items: Array<{
    name: string;
    variant: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  subtotal: number;
  total_amount: number;
  shipping_address?: {
    city?: string;
    country?: string;
    line1?: string;
  };
}
