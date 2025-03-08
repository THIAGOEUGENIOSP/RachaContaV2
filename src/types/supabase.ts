export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      carnivals: {
        Row: {
          id: string
          year: number
          name: string
          start_date: string
          end_date: string
          status: 'planning' | 'active' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          year: number
          name: string
          start_date: string
          end_date: string
          status?: 'planning' | 'active' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          year?: number
          name?: string
          start_date?: string
          end_date?: string
          status?: 'planning' | 'active' | 'completed'
          created_at?: string
        }
      }
      carnival_participants: {
        Row: {
          id: string
          carnival_id: string
          participant_id: string
          created_at: string
        }
        Insert: {
          id?: string
          carnival_id: string
          participant_id: string
          created_at?: string
        }
        Update: {
          id?: string
          carnival_id?: string
          participant_id?: string
          created_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          name: string
          type: 'individual' | 'casal'
          children: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'individual' | 'casal'
          children?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'individual' | 'casal'
          children?: number
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          description: string
          amount: number
          category: string
          date: string
          created_at: string
          payer_id?: string
          carnival_id?: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          category: string
          date: string
          created_at?: string
          payer_id?: string
          carnival_id?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          category?: string
          date?: string
          created_at?: string
          payer_id?: string
          carnival_id?: string
        }
      }
      expense_participants: {
        Row: {
          id: string
          expense_id: string
          participant_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          expense_id: string
          participant_id: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          expense_id?: string
          participant_id?: string
          amount?: number
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          payer_id: string
          receiver_id: string
          amount: number
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          payer_id: string
          receiver_id: string
          amount: number
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          payer_id?: string
          receiver_id?: string
          amount?: number
          notes?: string
          created_at?: string
        }
      }
      shopping_list: {
        Row: {
          id: string
          name: string
          quantity: number
          category: string
          completed: boolean
          created_at: string
          carnival_id?: string
        }
        Insert: {
          id?: string
          name: string
          quantity?: number
          category: string
          completed?: boolean
          created_at?: string
          carnival_id?: string
        }
        Update: {
          id?: string
          name?: string
          quantity?: number
          category?: string
          completed?: boolean
          created_at?: string
          carnival_id?: string
        }
      }
      contributions: {
        Row: {
          id: string
          participant_id: string
          amount: number
          month: string
          receipt_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          participant_id: string
          amount: number
          month: string
          receipt_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          participant_id?: string
          amount?: number
          month?: string
          receipt_url?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}