export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'staff' | 'manager' | 'admin';
export type DeviceCondition = 'new' | 'refurbished' | 'pre-owned';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'stripe' | 'manual' | 'store_pickup';
export type FulfillmentType = 'home_delivery' | 'store_pickup';

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          shipping_address: Json;
        } & Timestamps;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          shipping_address?: Json;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          shipping_address?: Json;
        };
      };
      brands: {
        Row: { id: string; name: string; slug: string; logo_url: string | null } & Pick<Timestamps, 'created_at'>;
        Insert: { id?: string; name: string; slug: string; logo_url?: string | null };
        Update: { id?: string; name?: string; slug?: string; logo_url?: string | null };
      };
      categories: {
        Row: { id: string; name: string; slug: string; description: string | null } & Pick<Timestamps, 'created_at'>;
        Insert: { id?: string; name: string; slug: string; description?: string | null };
        Update: { id?: string; name?: string; slug?: string; description?: string | null };
      };
      products: {
        Row: {
          id: string;
          brand_id: string | null;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          featured: boolean;
          is_active: boolean;
        } & Timestamps;
        Insert: {
          id?: string;
          brand_id?: string | null;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          featured?: boolean;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          brand_id?: string | null;
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          featured?: boolean;
          is_active?: boolean;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          storage: string;
          ram: string | null;
          color: string;
          condition: DeviceCondition;
          price: number;
          compare_at_price: number | null;
          stock_quantity: number;
          images: string[];
        } & Timestamps;
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          storage: string;
          ram?: string | null;
          color: string;
          condition?: DeviceCondition;
          price: number;
          compare_at_price?: number | null;
          stock_quantity?: number;
          images?: string[];
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          storage?: string;
          ram?: string | null;
          color?: string;
          condition?: DeviceCondition;
          price?: number;
          compare_at_price?: number | null;
          stock_quantity?: number;
          images?: string[];
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          guest_email: string | null;
          status: OrderStatus;
          payment_status: PaymentStatus;
          currency: string;
          subtotal: number;
          total_amount: number;
          shipping_address: Json;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          tracking_number: string | null;
          notes: string | null;
          payment_method: PaymentMethod;
          fulfillment_type: FulfillmentType;
          tracking_token: string | null;
        } & Timestamps;
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_email?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          currency?: string;
          subtotal: number;
          total_amount: number;
          shipping_address: Json;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
          payment_method?: PaymentMethod;
          fulfillment_type?: FulfillmentType;
          tracking_token?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_email?: string | null;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          currency?: string;
          subtotal?: number;
          total_amount?: number;
          shipping_address?: Json;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
          payment_method?: PaymentMethod;
          fulfillment_type?: FulfillmentType;
          tracking_token?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          product_name: string;
          variant_details: Json;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id?: string | null;
          product_name: string;
          variant_details: Json;
          quantity: number;
          unit_price: number;
          total_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string | null;
          product_name?: string;
          variant_details?: Json;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
      };
    };
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_manager_or_admin: { Args: Record<string, never>; Returns: boolean };
      create_manual_order: {
        Args: {
          p_user_id: string | null;
          p_guest_email: string | null;
          p_payment_method: PaymentMethod;
          p_fulfillment_type: FulfillmentType;
          p_shipping_address: Json;
          p_items: Json;
          p_stripe_session_id?: string | null;
        };
        Returns: Database['public']['Tables']['orders']['Row'];
      };
    };
  };
}
