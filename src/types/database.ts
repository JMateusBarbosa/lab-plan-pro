export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      exams: {
        Row: {
          created_at: string;
          exam_date: string;
          exam_type: string;
          id: string;
          laboratory_id: string;
          module: string;
          pc_number: number;
          previous_exam_id: string | null;
          status: string;
          student_class_time: string;
          student_name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          exam_date: string;
          exam_type: string;
          id?: string;
          laboratory_id: string;
          module: string;
          pc_number: number;
          previous_exam_id?: string | null;
          status?: string;
          student_class_time: string;
          student_name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          exam_date?: string;
          exam_type?: string;
          id?: string;
          laboratory_id?: string;
          module?: string;
          pc_number?: number;
          previous_exam_id?: string | null;
          status?: string;
          student_class_time?: string;
          student_name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exams_laboratory_id_fkey";
            columns: ["laboratory_id"];
            isOneToOne: false;
            referencedRelation: "laboratories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_previous_exam_id_fkey";
            columns: ["previous_exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      laboratories: {
        Row: {
          city: string;
          computer_count: number;
          created_at: string;
          id: string;
          name: string;
          phone: string | null;
          responsible: string | null;
          school_name: string;
          state: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          city: string;
          computer_count: number;
          created_at?: string;
          id?: string;
          name: string;
          phone?: string | null;
          responsible?: string | null;
          school_name: string;
          state: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          city?: string;
          computer_count?: number;
          created_at?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          responsible?: string | null;
          school_name?: string;
          state?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      laboratory_schedules: {
        Row: {
          active: boolean;
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          laboratory_id: string;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          laboratory_id: string;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          laboratory_id?: string;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "laboratory_schedules_laboratory_id_fkey";
            columns: ["laboratory_id"];
            isOneToOne: false;
            referencedRelation: "laboratories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          laboratory_id: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          laboratory_id?: string | null;
          role: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          laboratory_id?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_laboratory_id_fkey";
            columns: ["laboratory_id"];
            isOneToOne: false;
            referencedRelation: "laboratories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_bootstrap_available: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
