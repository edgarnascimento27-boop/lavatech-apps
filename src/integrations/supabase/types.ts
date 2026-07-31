export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string;
          customer_id: string | null;
          establishment_id: string;
          id: string;
          notes: string | null;
          scheduled_at: string;
          status: Database["public"]["Enums"]["appointment_status"];
          updated_at: string;
          vehicle_id: string | null;
          wash_type_id: string | null;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          establishment_id: string;
          id?: string;
          notes?: string | null;
          scheduled_at: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          updated_at?: string;
          vehicle_id?: string | null;
          wash_type_id?: string | null;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          establishment_id?: string;
          id?: string;
          notes?: string | null;
          scheduled_at?: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          updated_at?: string;
          vehicle_id?: string | null;
          wash_type_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_wash_type_id_fkey";
            columns: ["wash_type_id"];
            isOneToOne: false;
            referencedRelation: "wash_types";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          created_at: string;
          email: string | null;
          establishment_id: string;
          full_name: string;
          id: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          establishment_id: string;
          full_name: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          establishment_id?: string;
          full_name?: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          active: boolean;
          created_at: string;
          establishment_id: string;
          full_name: string;
          id: string;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          establishment_id: string;
          full_name: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          establishment_id?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employees_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
      establishment_settings: {
        Row: {
          accepts_cards: boolean | null;
          accepts_cash: boolean | null;
          accepts_pix: boolean | null;
          close_time: string | null;
          establishment_id: string;
          notify_customers: boolean | null;
          open_time: string | null;
          updated_at: string;
          working_days: number[] | null;
        };
        Insert: {
          accepts_cards?: boolean | null;
          accepts_cash?: boolean | null;
          accepts_pix?: boolean | null;
          close_time?: string | null;
          establishment_id: string;
          notify_customers?: boolean | null;
          open_time?: string | null;
          updated_at?: string;
          working_days?: number[] | null;
        };
        Update: {
          accepts_cards?: boolean | null;
          accepts_cash?: boolean | null;
          accepts_pix?: boolean | null;
          close_time?: string | null;
          establishment_id?: string;
          notify_customers?: boolean | null;
          open_time?: string | null;
          updated_at?: string;
          working_days?: number[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "establishment_settings_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: true;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
      establishments: {
        Row: {
          address: string | null;
          city: string | null;
          cnpj: string | null;
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          state: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          cnpj?: string | null;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          cnpj?: string | null;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          establishment_id: string;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          paid_at: string;
          queue_entry_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          establishment_id: string;
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          paid_at?: string;
          queue_entry_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          establishment_id?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          paid_at?: string;
          queue_entry_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_queue_entry_id_fkey";
            columns: ["queue_entry_id"];
            isOneToOne: false;
            referencedRelation: "queue_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      queue_entries: {
        Row: {
          arrived_at: string;
          created_at: string;
          created_by: string | null;
          customer_id: string | null;
          employee_id: string | null;
          establishment_id: string;
          estimated_minutes: number | null;
          finished_at: string | null;
          id: string;
          notes: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"] | null;
          position: number | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["queue_status"];
          total_price: number;
          updated_at: string;
          vehicle_id: string | null;
          wash_type_id: string | null;
        };
        Insert: {
          arrived_at?: string;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          employee_id?: string | null;
          establishment_id: string;
          estimated_minutes?: number | null;
          finished_at?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          position?: number | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["queue_status"];
          total_price?: number;
          updated_at?: string;
          vehicle_id?: string | null;
          wash_type_id?: string | null;
        };
        Update: {
          arrived_at?: string;
          created_at?: string;
          created_by?: string | null;
          customer_id?: string | null;
          employee_id?: string | null;
          establishment_id?: string;
          estimated_minutes?: number | null;
          finished_at?: string | null;
          id?: string;
          notes?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          position?: number | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["queue_status"];
          total_price?: number;
          updated_at?: string;
          vehicle_id?: string | null;
          wash_type_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "queue_entries_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_entries_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_entries_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_entries_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_entries_wash_type_id_fkey";
            columns: ["wash_type_id"];
            isOneToOne: false;
            referencedRelation: "wash_types";
            referencedColumns: ["id"];
          },
        ];
      };
      queue_status_history: {
        Row: {
          changed_at: string;
          changed_by: string | null;
          establishment_id: string;
          from_status: Database["public"]["Enums"]["queue_status"] | null;
          id: string;
          queue_entry_id: string;
          to_status: Database["public"]["Enums"]["queue_status"];
        };
        Insert: {
          changed_at?: string;
          changed_by?: string | null;
          establishment_id: string;
          from_status?: Database["public"]["Enums"]["queue_status"] | null;
          id?: string;
          queue_entry_id: string;
          to_status: Database["public"]["Enums"]["queue_status"];
        };
        Update: {
          changed_at?: string;
          changed_by?: string | null;
          establishment_id?: string;
          from_status?: Database["public"]["Enums"]["queue_status"] | null;
          id?: string;
          queue_entry_id?: string;
          to_status?: Database["public"]["Enums"]["queue_status"];
        };
        Relationships: [
          {
            foreignKeyName: "queue_status_history_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "queue_status_history_queue_entry_id_fkey";
            columns: ["queue_entry_id"];
            isOneToOne: false;
            referencedRelation: "queue_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          establishment_id: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          establishment_id?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          establishment_id?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_establishment_fk";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
      vehicles: {
        Row: {
          color: string | null;
          created_at: string;
          customer_id: string;
          establishment_id: string;
          id: string;
          license_plate: string;
          model: string | null;
          updated_at: string;
          vehicle_type: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          customer_id: string;
          establishment_id: string;
          id?: string;
          license_plate: string;
          model?: string | null;
          updated_at?: string;
          vehicle_type?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          customer_id?: string;
          establishment_id?: string;
          id?: string;
          license_plate?: string;
          model?: string | null;
          updated_at?: string;
          vehicle_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
      wash_types: {
        Row: {
          active: boolean;
          created_at: string;
          description: string | null;
          establishment_id: string;
          estimated_minutes: number;
          id: string;
          name: string;
          price: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          establishment_id: string;
          estimated_minutes?: number;
          id?: string;
          name: string;
          price?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          description?: string | null;
          establishment_id?: string;
          estimated_minutes?: number;
          id?: string;
          name?: string;
          price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wash_types_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_establishment_role: {
        Args: {
          _establishment_id: string;
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_establishment_member: {
        Args: { _establishment_id: string; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "owner" | "manager" | "attendant";
      appointment_status: "pendente" | "confirmado" | "cancelado" | "concluido" | "nao_compareceu";
      payment_method: "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "outro";
      queue_status:
        | "aguardando"
        | "em_preparacao"
        | "lavando"
        | "finalizando"
        | "pronto"
        | "concluido"
        | "cancelado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "manager", "attendant"],
      appointment_status: ["pendente", "confirmado", "cancelado", "concluido", "nao_compareceu"],
      payment_method: ["dinheiro", "pix", "cartao_credito", "cartao_debito", "outro"],
      queue_status: [
        "aguardando",
        "em_preparacao",
        "lavando",
        "finalizando",
        "pronto",
        "concluido",
        "cancelado",
      ],
    },
  },
} as const;
