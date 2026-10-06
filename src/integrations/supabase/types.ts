export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      data_modul: {
        Row: {
          data: Json
          kunci: string
          lembar: string
          modul: string
          updated_at: string
        }
        Insert: {
          data: Json
          kunci: string
          lembar: string
          modul: string
          updated_at?: string
        }
        Update: {
          data?: Json
          kunci?: string
          lembar?: string
          modul?: string
          updated_at?: string
        }
        Relationships: []
      }
      guru: {
        Row: {
          email: string | null
          jabatan: string | null
          jenis_kelamin: string | null
          mapel: string | null
          nama: string
          nip: string
          status: string | null
          telp: string | null
          updated_at: string
          wali_kelas: string | null
        }
        Insert: {
          email?: string | null
          jabatan?: string | null
          jenis_kelamin?: string | null
          mapel?: string | null
          nama: string
          nip: string
          status?: string | null
          telp?: string | null
          updated_at?: string
          wali_kelas?: string | null
        }
        Update: {
          email?: string | null
          jabatan?: string | null
          jenis_kelamin?: string | null
          mapel?: string | null
          nama?: string
          nip?: string
          status?: string | null
          telp?: string | null
          updated_at?: string
          wali_kelas?: string | null
        }
        Relationships: []
      }
      kehadiran: {
        Row: {
          kelas_id: string
          keterangan: string | null
          nisn: string
          status: string
          tanggal: string
        }
        Insert: {
          kelas_id: string
          keterangan?: string | null
          nisn: string
          status: string
          tanggal: string
        }
        Update: {
          kelas_id?: string
          keterangan?: string | null
          nisn?: string
          status?: string
          tanggal?: string
        }
        Relationships: []
      }
      kelas: {
        Row: {
          id: string
          kapasitas: number | null
          nip_wali: string | null
          rombel: string | null
          ruang: string | null
          tingkat: number
          updated_at: string
        }
        Insert: {
          id: string
          kapasitas?: number | null
          nip_wali?: string | null
          rombel?: string | null
          ruang?: string | null
          tingkat: number
          updated_at?: string
        }
        Update: {
          id?: string
          kapasitas?: number | null
          nip_wali?: string | null
          rombel?: string | null
          ruang?: string | null
          tingkat?: number
          updated_at?: string
        }
        Relationships: []
      }
      siswa: {
        Row: {
          alamat: string | null
          email_wali: string | null
          jenis_kelamin: string | null
          kelas_id: string
          nama: string
          nama_ayah: string | null
          nama_ibu: string | null
          nama_wali: string | null
          nis: string | null
          nisn: string
          tanggal_lahir: string | null
          telp_wali: string | null
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          email_wali?: string | null
          jenis_kelamin?: string | null
          kelas_id: string
          nama: string
          nama_ayah?: string | null
          nama_ibu?: string | null
          nama_wali?: string | null
          nis?: string | null
          nisn: string
          tanggal_lahir?: string | null
          telp_wali?: string | null
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          email_wali?: string | null
          jenis_kelamin?: string | null
          kelas_id?: string
          nama?: string
          nama_ayah?: string | null
          nama_ibu?: string | null
          nama_wali?: string | null
          nis?: string | null
          nisn?: string
          tanggal_lahir?: string | null
          telp_wali?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
