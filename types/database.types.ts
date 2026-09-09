export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'manager' | 'admin';
export type DeviceCondition = 'NEW' | 'REFURBISHED' | 'USED';
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'STRIPE' | 'PAY_IN_STORE' | 'BANK_TRANSFER' | 'WHATSAPP';
export type FulfillmentType = 'STORE_PICKUP' | 'HOME_DELIVERY';

export interface DeviceSpecifications {
  color?: string;
  storage?: string;
  ram?: string;
  screen_size?: string;
  battery_capacity?: string;
  warranty_type?: string;
  sim_type?: string;
  // Specific to refurbished/used devices:
  battery_health?: number;
  cosmetic_grade?: 'Grade A' | 'Grade B' | 'Grade C';
  includes_box?: boolean;
  imei?: string;
  [key: string]: Json | undefined;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          title: string;
          brand: string;
          slug: string;
          description: string | null;
          thumbnail_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          brand: string;
          slug: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          brand?: string;
          slug?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          price: number;
          compare_at_price: number | null;
          stock_quantity: number;
          condition: DeviceCondition;
          images: string[];
          specifications: DeviceSpecifications;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          price: number;
          compare_at_price?: number | null;
          stock_quantity?: number;
          condition?: DeviceCondition;
          images?: string[];
          specifications?: DeviceSpecifications;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          price?: number;
          compare_at_price?: number | null;
          stock_quantity?: number;
          condition?: DeviceCondition;
          images?: string[];
          specifications?: DeviceSpecifications;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: number;
          customer_id: string | null;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_method: PaymentMethod;
          fulfillment_type: FulfillmentType;
          total_amount: number;
          currency: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address: Json;
          notes: string | null;
          payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: number;
          customer_id?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method: PaymentMethod;
          fulfillment_type?: FulfillmentType;
          total_amount: number;
          currency?: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address?: Json;
          notes?: string | null;
          payment_intent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: number;
          customer_id?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod;
          fulfillment_type?: FulfillmentType;
          total_amount?: number;
          currency?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          shipping_address?: Json;
          notes?: string | null;
          payment_intent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          product_title: string;
          variant_details: string;
          unit_price: number;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id?: string | null;
          product_title: string;
          variant_details: string;
          unit_price: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string | null;
          product_title?: string;
          variant_details?: string;
          unit_price?: number;
          quantity?: number;
          created_at?: string;
        };
      };
    };
    Functions: {
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}