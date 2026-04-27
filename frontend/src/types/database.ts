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
      markets: {
        Row: {
          id: number
          question: string
          description: string | null
          image_uri: string | null
          end_time: string // ISO timestamp
          category: string | null
          created_at: string
          outcome: number // 0=Undecided, 1=Yes, 2=No, 3=Cancelled
          total_yes: number
          total_no: number
          total_pool: number
          resolved: boolean
          refunded: boolean
          volume_24h: number | null
          last_trade_price: number | null
          updated_at: string
        }
        Insert: {
          id: number
          question: string
          description?: string | null
          image_uri?: string | null
          end_time: string
          category?: string | null
          created_at?: string
          outcome?: number
          total_yes?: number
          total_no?: number
          total_pool?: number
          resolved?: boolean
          refunded?: boolean
          volume_24h?: number | null
          last_trade_price?: number | null
          updated_at?: string
        }
        Update: {
          id?: number
          question?: string
          description?: string | null
          image_uri?: string | null
          end_time?: string
          category?: string | null
          created_at?: string
          outcome?: number
          total_yes?: number
          total_no?: number
          total_pool?: number
          resolved?: boolean
          refunded?: boolean
          volume_24h?: number | null
          last_trade_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_bets: {
        Row: {
          id: string
          user_address: string
          market_id: number
          outcome: boolean // true = Yes, false = No
          amount: number
          transaction_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_address: string
          market_id: number
          outcome: boolean
          amount: number
          transaction_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_address?: string
          market_id?: number
          outcome?: boolean
          amount?: number
          transaction_hash?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type MarketRow = Database['public']['Tables']['markets']['Row']
export type MarketInsert = Database['public']['Tables']['markets']['Insert']
export type MarketUpdate = Database['public']['Tables']['markets']['Update']

export type UserBetRow = Database['public']['Tables']['user_bets']['Row']
export type UserBetInsert = Database['public']['Tables']['user_bets']['Insert']
export type UserBetUpdate = Database['public']['Tables']['user_bets']['Update']