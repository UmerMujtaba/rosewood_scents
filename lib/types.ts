export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; role: string; created_at: string };
        Insert: { id: string; full_name?: string | null; role?: string };
        Update: { full_name?: string | null; role?: string };
      };
      categories: {
        Row: { id: number; name: string; slug: string; description: string | null };
        Insert: { name: string; slug: string; description?: string | null };
        Update: { name?: string; slug?: string; description?: string | null };
      };
      perfumes: {
        Row: {
          id: number; name: string; slug: string; description: string | null;
          price: number; image_url: string | null; image_urls: string[]; stock_quantity: number;
          is_featured: boolean; created_at: string;
        };
        Insert: {
          name: string; slug: string; description?: string | null;
          price: number; image_url?: string | null; image_urls?: string[]; stock_quantity?: number; is_featured?: boolean;
        };
        Update: {
          name?: string; slug?: string; description?: string | null;
          price?: number; image_url?: string | null; image_urls?: string[]; stock_quantity?: number; is_featured?: boolean;
        };
      };
      scent_notes: {
        Row: { id: number; name: string; note_type: "top" | "middle" | "base" };
        Insert: { name: string; note_type: "top" | "middle" | "base" };
        Update: { name?: string; note_type?: "top" | "middle" | "base" };
      };
      perfume_categories: {
        Row: { perfume_id: number; category_id: number };
        Insert: { perfume_id: number; category_id: number };
        Update: Record<string, never>;
      };
      perfume_notes: {
        Row: { perfume_id: number; note_id: number };
        Insert: { perfume_id: number; note_id: number };
        Update: Record<string, never>;
      };
      cart_items: {
        Row: { id: number; user_id: string; perfume_id: number; quantity: number; created_at: string };
        Insert: { user_id: string; perfume_id: number; quantity: number };
        Update: { quantity?: number };
      };
      user_favorites: {
        Row: { user_id: string; perfume_id: number; created_at: string };
        Insert: { user_id: string; perfume_id: number };
        Update: Record<string, never>;
      };
      orders: {
        Row: {
          id: number; user_id: string; status: string; total_amount: number;
          shipping_name: string | null; shipping_address: string | null;
          shipping_city: string | null; shipping_country: string | null;
          stripe_session_id: string | null; created_at: string;
        };
        Insert: {
          user_id: string; status?: string; total_amount: number;
          shipping_name?: string | null; shipping_address?: string | null;
          shipping_city?: string | null; shipping_country?: string | null;
          stripe_session_id?: string | null;
        };
        Update: { status?: string };
      };
      order_items: {
        Row: { id: number; order_id: number; perfume_id: number; quantity: number; unit_price: number };
        Insert: { order_id: number; perfume_id: number; quantity: number; unit_price: number };
        Update: Record<string, never>;
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Perfume = Database["public"]["Tables"]["perfumes"]["Row"];
export type ScentNote = Database["public"]["Tables"]["scent_notes"]["Row"];
export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export interface PerfumeWithDetails extends Perfume {
  categories: Category[];
  scent_notes: ScentNote[];
}

export interface CartItemWithPerfume extends CartItem {
  perfume: Perfume;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & { perfume: Perfume })[];
}

export interface LocalCartItem {
  perfume_id: number;
  quantity: number;
  perfume: Perfume;
}
