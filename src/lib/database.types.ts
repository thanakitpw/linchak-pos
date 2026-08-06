/**
 * ไฟล์นี้ generate จาก schema ของ Supabase — ห้ามแก้มือ
 *
 * สร้างใหม่:  pnpm db:types      (ต้อง `supabase login` ครั้งแรกครั้งเดียว)
 * schema:     supabase/migrations/  ·  เหตุผลการออกแบบ: docs/data-model.md
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_kind: string;
          actor_user_id: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string;
          id: number;
          ip: unknown;
          reason: string | null;
          target_id: string | null;
          target_type: string | null;
          user_agent: string | null;
          workspace_id: string | null;
        };
        Insert: {
          action: string;
          actor_kind?: string;
          actor_user_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: never;
          ip?: unknown;
          reason?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
          workspace_id?: string | null;
        };
        Update: {
          action?: string;
          actor_kind?: string;
          actor_user_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          id?: never;
          ip?: unknown;
          reason?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          color_index: number;
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          color_index?: number;
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          color_index?: number;
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      memberships: {
        Row: {
          accepted_at: string;
          created_at: string;
          id: string;
          invited_at: string | null;
          invited_by: string | null;
          role: string;
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          accepted_at?: string;
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          role?: string;
          user_id: string;
          workspace_id: string;
        };
        Update: {
          accepted_at?: string;
          created_at?: string;
          id?: string;
          invited_at?: string | null;
          invited_by?: string | null;
          role?: string;
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          line_total: number;
          name_snapshot: string;
          order_id: string;
          price_snapshot: number;
          product_id: string | null;
          qty: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          line_total: number;
          name_snapshot: string;
          order_id: string;
          price_snapshot: number;
          product_id?: string | null;
          qty: number;
          sort_order?: number;
        };
        Update: {
          id?: string;
          line_total?: number;
          name_snapshot?: string;
          order_id?: string;
          price_snapshot?: number;
          product_id?: string | null;
          qty?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          bill_no: string;
          change_amount: number | null;
          created_at: string;
          created_by: string | null;
          discount: number;
          id: string;
          ordered_at: string;
          payment_method: string;
          public_token: string;
          received: number | null;
          subtotal: number;
          tax_amount: number;
          total: number;
          workspace_id: string;
        };
        Insert: {
          bill_no: string;
          change_amount?: number | null;
          created_at?: string;
          created_by?: string | null;
          discount?: number;
          id?: string;
          ordered_at?: string;
          payment_method: string;
          public_token?: string;
          received?: number | null;
          subtotal: number;
          tax_amount?: number;
          total: number;
          workspace_id: string;
        };
        Update: {
          bill_no?: string;
          change_amount?: number | null;
          created_at?: string;
          created_by?: string | null;
          discount?: number;
          id?: string;
          ordered_at?: string;
          payment_method?: string;
          public_token?: string;
          received?: number | null;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_satang: number;
          created_at: string;
          id: string;
          method: string;
          note: string | null;
          period_end: string;
          period_start: string;
          plan_code: string;
          recorded_by: string | null;
          reference: string | null;
          slip_path: string | null;
          workspace_id: string;
        };
        Insert: {
          amount_satang: number;
          created_at?: string;
          id?: string;
          method?: string;
          note?: string | null;
          period_end: string;
          period_start: string;
          plan_code: string;
          recorded_by?: string | null;
          reference?: string | null;
          slip_path?: string | null;
          workspace_id: string;
        };
        Update: {
          amount_satang?: number;
          created_at?: string;
          id?: string;
          method?: string;
          note?: string | null;
          period_end?: string;
          period_start?: string;
          plan_code?: string;
          recorded_by?: string | null;
          reference?: string | null;
          slip_path?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_plan_code_fkey";
            columns: ["plan_code"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["code"];
          },
          {
            foreignKeyName: "payments_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          code: string;
          created_at: string;
          is_active: boolean;
          name_en: string;
          name_th: string;
          period_months: number;
          price_satang: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          is_active?: boolean;
          name_en: string;
          name_th: string;
          period_months: number;
          price_satang: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          is_active?: boolean;
          name_en?: string;
          name_th?: string;
          period_months?: number;
          price_satang?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          archived_at: string | null;
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_path: string | null;
          is_archived: boolean;
          name: string;
          price: number;
          price_includes_tax: boolean;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          archived_at?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          is_archived?: boolean;
          name: string;
          price: number;
          price_includes_tax?: boolean;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          archived_at?: string | null;
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_path?: string | null;
          is_archived?: boolean;
          name?: string;
          price?: number;
          price_includes_tax?: boolean;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      purchase_items: {
        Row: {
          id: string;
          line_total: number;
          name: string;
          purchase_id: string;
          qty: number;
          sort_order: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          line_total: number;
          name: string;
          purchase_id: string;
          qty: number;
          sort_order?: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          line_total?: number;
          name?: string;
          purchase_id?: string;
          qty?: number;
          sort_order?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          purchased_at: string;
          slip_path: string | null;
          total: number;
          updated_at: string;
          vendor: string | null;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          purchased_at: string;
          slip_path?: string | null;
          total?: number;
          updated_at?: string;
          vendor?: string | null;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          purchased_at?: string;
          slip_path?: string | null;
          total?: number;
          updated_at?: string;
          vendor?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      workspaces: {
        Row: {
          bill_seq: number;
          branch: string | null;
          created_at: string;
          current_period_end: string | null;
          id: string;
          language: string;
          logo_path: string | null;
          name: string;
          phone: string | null;
          plan_code: string | null;
          promptpay_id: string | null;
          promptpay_type: string | null;
          subscription_status: string;
          suspended_at: string | null;
          suspended_by: string | null;
          suspended_reason: string | null;
          tax_enabled: boolean;
          tax_rate: number;
          trial_ends_at: string;
          updated_at: string;
        };
        Insert: {
          bill_seq?: number;
          branch?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          language?: string;
          logo_path?: string | null;
          name: string;
          phone?: string | null;
          plan_code?: string | null;
          promptpay_id?: string | null;
          promptpay_type?: string | null;
          subscription_status?: string;
          suspended_at?: string | null;
          suspended_by?: string | null;
          suspended_reason?: string | null;
          tax_enabled?: boolean;
          tax_rate?: number;
          trial_ends_at?: string;
          updated_at?: string;
        };
        Update: {
          bill_seq?: number;
          branch?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          language?: string;
          logo_path?: string | null;
          name?: string;
          phone?: string | null;
          plan_code?: string | null;
          promptpay_id?: string | null;
          promptpay_type?: string | null;
          subscription_status?: string;
          suspended_at?: string | null;
          suspended_by?: string | null;
          suspended_reason?: string | null;
          tax_enabled?: boolean;
          tax_rate?: number;
          trial_ends_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_plan_code_fkey";
            columns: ["plan_code"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["code"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json };
      admin_record_payment: {
        Args: {
          p_amount_satang: number;
          p_method?: string;
          p_note?: string;
          p_plan_code: string;
          p_reference?: string;
          p_workspace_id: string;
        };
        Returns: Database["public"]["Tables"]["payments"]["Row"];
      };
      admin_set_suspended: {
        Args: { p_reason: string; p_suspended: boolean; p_workspace_id: string };
        Returns: undefined;
      };
      admin_workspace_detail: { Args: { p_workspace_id: string }; Returns: Json };
      admin_workspace_list: {
        Args: { p_search?: string; p_status?: string };
        Returns: {
          created_at: string;
          current_period_end: string;
          id: string;
          last_order_at: string;
          member_count: number;
          name: string;
          orders_this_month: number;
          owner_email: string;
          sales_this_month: number;
          subscription_status: string;
          suspended_at: string;
          suspended_reason: string;
          trial_ends_at: string;
        }[];
      };
      create_order: {
        Args: {
          p_discount?: number;
          p_items: Json;
          p_ordered_at?: string;
          p_payment_method: string;
          p_received?: number;
          p_workspace_id: string;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      create_purchase: {
        Args: {
          p_items: Json;
          p_note?: string;
          p_purchased_at: string;
          p_slip_path?: string;
          p_total_override?: number;
          p_vendor?: string;
          p_workspace_id: string;
        };
        Returns: Database["public"]["Tables"]["purchases"]["Row"];
      };
      current_user_is_platform_admin: { Args: never; Returns: boolean };
      current_workspace_is_writable: { Args: never; Returns: boolean };
      get_public_receipt: { Args: { token: string }; Returns: Json };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

/* ── ตัวช่วยที่ใช้บ่อย ───────────────────────────────────────────────────── */

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];

export type Workspace = Tables<"workspaces">;
export type Membership = Tables<"memberships">;
export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Purchase = Tables<"purchases">;
export type PurchaseItem = Tables<"purchase_items">;

/**
 * ค่าที่ DB บังคับด้วย CHECK constraint — TS ไม่รู้เอง ต้องประกาศคู่กัน
 * ถ้าแก้ constraint ใน migration ต้องแก้ตรงนี้ด้วย
 */
export type MemberRole = "owner" | "manager" | "staff";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "expired" | "suspended";
export type PaymentMethod = "cash" | "promptpay" | "transfer";
export type PromptPayType = "phone" | "nid" | "ewallet";
/** สีหมวดหมู่ผูกกับ token cat-1..8 ใน src/styles/theme.css */
export type CategoryColorIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
