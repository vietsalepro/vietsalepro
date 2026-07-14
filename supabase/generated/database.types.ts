export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_2fa_backup_code_attempts: {
        Row: {
          failed_at: string
          id: string
          user_id: string
        }
        Insert: {
          failed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          failed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_2fa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string | null
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          message: string
          metadata: Json | null
          severity: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message: string
          metadata?: Json | null
          severity: string
          type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          severity?: string
          type?: string
        }
        Relationships: []
      }
      admin_login_history: {
        Row: {
          created_at: string | null
          email: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_role_assignments: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          permissions?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          permissions?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active_from: string | null
          active_to: string | null
          audience: string | null
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          published_at: string | null
          scheduled_at: string | null
          status: string
          target_type: string
          targets: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          active_from?: string | null
          active_to?: string | null
          audience?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          target_type?: string
          targets?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          active_from?: string | null
          active_to?: string | null
          audience?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          target_type?: string
          targets?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_audit_log_partitioned: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          allow_negative_stock: boolean
          bank_info: string | null
          font_family: string | null
          font_size: number | null
          id: string
          invoice_title: string | null
          logo: string | null
          loyalty_policy: string | null
          point_conversion_rate: number | null
          print_size: string | null
          promo_info: string | null
          return_fee_enabled: boolean | null
          return_fee_percent: number | null
          return_max_days: number | null
          store_address: string | null
          store_name: string | null
          store_phone: string | null
          tax_code: string | null
          tenant_id: string
          thank_you_message: string | null
        }
        Insert: {
          allow_negative_stock?: boolean
          bank_info?: string | null
          font_family?: string | null
          font_size?: number | null
          id?: string
          invoice_title?: string | null
          logo?: string | null
          loyalty_policy?: string | null
          point_conversion_rate?: number | null
          print_size?: string | null
          promo_info?: string | null
          return_fee_enabled?: boolean | null
          return_fee_percent?: number | null
          return_max_days?: number | null
          store_address?: string | null
          store_name?: string | null
          store_phone?: string | null
          tax_code?: string | null
          tenant_id: string
          thank_you_message?: string | null
        }
        Update: {
          allow_negative_stock?: boolean
          bank_info?: string | null
          font_family?: string | null
          font_size?: number | null
          id?: string
          invoice_title?: string | null
          logo?: string | null
          loyalty_policy?: string | null
          point_conversion_rate?: number | null
          print_size?: string | null
          promo_info?: string | null
          return_fee_enabled?: boolean | null
          return_fee_percent?: number | null
          return_max_days?: number | null
          store_address?: string | null
          store_name?: string | null
          store_phone?: string | null
          tax_code?: string | null
          tenant_id?: string
          thank_you_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_app_settings_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          created_at: string
          display_order: number
          id: string
          is_default: boolean
          transfer_content: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          created_at?: string
          display_order?: number
          id?: string
          is_default?: boolean
          transfer_content?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          display_order?: number
          id?: string
          is_default?: boolean
          transfer_content?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          invoice_id: string | null
          provider_message_id: string | null
          recipient: string
          status: string
          tenant_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          provider_message_id?: string | null
          recipient: string
          status?: string
          tenant_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          provider_message_id?: string | null
          recipient?: string
          status?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: []
      }
      billing_job_logs: {
        Row: {
          created_at: string
          details: Json | null
          duration_ms: number | null
          id: string
          job_name: string
          message: string | null
          records_affected: number
          run_at: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          id?: string
          job_name: string
          message?: string | null
          records_affected?: number
          run_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          duration_ms?: number | null
          id?: string
          job_name?: string
          message?: string | null
          records_affected?: number
          run_at?: string
          status?: string
        }
        Relationships: []
      }
      billing_reminder_logs: {
        Row: {
          created_at: string | null
          created_date: string | null
          error_message: string | null
          id: string
          reminder_type: string
          sent_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_date?: string | null
          error_message?: string | null
          id?: string
          reminder_type: string
          sent_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_date?: string | null
          error_message?: string | null
          id?: string
          reminder_type?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_reminder_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          tenant_id: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id: string
          name: string
          tenant_id: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_brands_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          tenant_id: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id: string
          name: string
          tenant_id: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_categories_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_logs: {
        Row: {
          completed_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          job_name: string
          retry_count: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          job_name: string
          retry_count?: number | null
          started_at?: string | null
          status: string
        }
        Update: {
          completed_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          job_name?: string
          retry_count?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      customer_payment_ledger: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: number
          reason: string | null
          reference_id: string | null
          reference_type: string
          tenant_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id: number
          reason?: string | null
          reference_id?: string | null
          reference_type: string
          tenant_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_payment_ledger_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          code: string | null
          created_at: string | null
          created_by: string | null
          debt: number | null
          id: string
          last_purchase_date: string | null
          loyalty_points: number | null
          name: string
          phone: string | null
          rank: string | null
          tenant_id: string
          total_spent: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          debt?: number | null
          id: string
          last_purchase_date?: string | null
          loyalty_points?: number | null
          name: string
          phone?: string | null
          rank?: string | null
          tenant_id: string
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          debt?: number | null
          id?: string
          last_purchase_date?: string | null
          loyalty_points?: number | null
          name?: string
          phone?: string | null
          rank?: string | null
          tenant_id?: string
          total_spent?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_customers_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      db_maintenance_jobs: {
        Row: {
          completed_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          operation: string
          result: Json | null
          started_at: string
          status: string
          tables: string[] | null
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          operation: string
          result?: Json | null
          started_at?: string
          status?: string
          tables?: string[] | null
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          operation?: string
          result?: Json | null
          started_at?: string
          status?: string
          tables?: string[] | null
        }
        Relationships: []
      }
      disposal_items: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          category_id: string | null
          category_name: string | null
          cost_price: number | null
          created_at: string | null
          disposal_id: string | null
          expiry_date: string | null
          id: string
          lot_code: string | null
          lot_id: string | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          reason: string | null
          tenant_id: string
          total_value: number | null
        }
        Insert: {
          brand_id?: string | null
          brand_name?: string | null
          category_id?: string | null
          category_name?: string | null
          cost_price?: number | null
          created_at?: string | null
          disposal_id?: string | null
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          reason?: string | null
          tenant_id: string
          total_value?: number | null
        }
        Update: {
          brand_id?: string | null
          brand_name?: string | null
          category_id?: string | null
          category_name?: string | null
          cost_price?: number | null
          created_at?: string | null
          disposal_id?: string | null
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          reason?: string | null
          tenant_id?: string
          total_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_disposal_items_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      disposals: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          date: string | null
          id: string
          note: string | null
          reason: string | null
          status: string | null
          tenant_id: string
          total_quantity: number | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id: string
          note?: string | null
          reason?: string | null
          status?: string | null
          tenant_id: string
          total_quantity?: number | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          note?: string | null
          reason?: string | null
          status?: string | null
          tenant_id?: string
          total_quantity?: number | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_disposals_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoice_config: {
        Row: {
          api_key: string | null
          api_secret: string | null
          approved_at: string | null
          base_url: string | null
          base_url_prod: string | null
          cert_issuer: string | null
          cert_serial: string | null
          cert_type: string | null
          created_at: string | null
          declaration_id: string | null
          declaration_status: string | null
          id: string
          invoice_pattern: string | null
          invoice_serial: string | null
          is_connected: boolean | null
          password: string | null
          provider: string
          store_address: string | null
          store_name: string | null
          store_tax_code: string | null
          tenant_id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          approved_at?: string | null
          base_url?: string | null
          base_url_prod?: string | null
          cert_issuer?: string | null
          cert_serial?: string | null
          cert_type?: string | null
          created_at?: string | null
          declaration_id?: string | null
          declaration_status?: string | null
          id?: string
          invoice_pattern?: string | null
          invoice_serial?: string | null
          is_connected?: boolean | null
          password?: string | null
          provider: string
          store_address?: string | null
          store_name?: string | null
          store_tax_code?: string | null
          tenant_id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          approved_at?: string | null
          base_url?: string | null
          base_url_prod?: string | null
          cert_issuer?: string | null
          cert_serial?: string | null
          cert_type?: string | null
          created_at?: string | null
          declaration_id?: string | null
          declaration_status?: string | null
          id?: string
          invoice_pattern?: string | null
          invoice_serial?: string | null
          is_connected?: boolean | null
          password?: string | null
          provider?: string
          store_address?: string | null
          store_name?: string | null
          store_tax_code?: string | null
          tenant_id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_einvoice_config_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      einvoice_orders: {
        Row: {
          buyer_address: string | null
          buyer_name: string | null
          buyer_tax_code: string | null
          cancel_at: string | null
          cancel_reason: string | null
          created_at: string | null
          einvoice_status: string | null
          error_message: string | null
          id: string
          invoice_number: string | null
          invoice_pattern: string | null
          invoice_serial: string | null
          issued_at: string | null
          order_id: string
          payment_method: string | null
          pdf_url: string | null
          replaced_by_invoice_number: string | null
          replacing_invoice_number: string | null
          tax_code_at: string | null
          tax_code_received: string | null
          tax_rate: number | null
          tenant_id: string
          updated_at: string | null
          xml_data: string | null
        }
        Insert: {
          buyer_address?: string | null
          buyer_name?: string | null
          buyer_tax_code?: string | null
          cancel_at?: string | null
          cancel_reason?: string | null
          created_at?: string | null
          einvoice_status?: string | null
          error_message?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pattern?: string | null
          invoice_serial?: string | null
          issued_at?: string | null
          order_id: string
          payment_method?: string | null
          pdf_url?: string | null
          replaced_by_invoice_number?: string | null
          replacing_invoice_number?: string | null
          tax_code_at?: string | null
          tax_code_received?: string | null
          tax_rate?: number | null
          tenant_id: string
          updated_at?: string | null
          xml_data?: string | null
        }
        Update: {
          buyer_address?: string | null
          buyer_name?: string | null
          buyer_tax_code?: string | null
          cancel_at?: string | null
          cancel_reason?: string | null
          created_at?: string | null
          einvoice_status?: string | null
          error_message?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pattern?: string | null
          invoice_serial?: string | null
          issued_at?: string | null
          order_id?: string
          payment_method?: string | null
          pdf_url?: string | null
          replaced_by_invoice_number?: string | null
          replacing_invoice_number?: string | null
          tax_code_at?: string | null
          tax_code_received?: string | null
          tax_rate?: number | null
          tenant_id?: string
          updated_at?: string | null
          xml_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_einvoice_orders_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          key: string
          name: string
          subject: string
          updated_at: string
          variables: Json
        }
        Insert: {
          body_html: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          key: string
          name: string
          subject: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          body_html?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          key?: string
          name?: string
          subject?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          source: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          level?: string
          message: string
          metadata?: Json | null
          source?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          source?: string
        }
        Relationships: []
      }
      fraud_queue: {
        Row: {
          created_at: string | null
          details: Json
          event_count: number
          id: string
          notes: string | null
          resolver_id: string | null
          severity: string
          status: string
          target_value: string | null
          type: string
          updated_at: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json
          event_count?: number
          id?: string
          notes?: string | null
          resolver_id?: string | null
          severity: string
          status?: string
          target_value?: string | null
          type: string
          updated_at?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json
          event_count?: number
          id?: string
          notes?: string | null
          resolver_id?: string | null
          severity?: string
          status?: string
          target_value?: string | null
          type?: string
          updated_at?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      gdpr_deletion_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          request_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          request_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_deletion_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "gdpr_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      gdpr_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          dry_run: boolean
          id: string
          reason: string | null
          requested_by: string | null
          result_data: Json | null
          result_url: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dry_run?: boolean
          id?: string
          reason?: string | null
          requested_by?: string | null
          result_data?: Json | null
          result_url?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dry_run?: boolean
          id?: string
          reason?: string | null
          requested_by?: string | null
          result_data?: Json | null
          result_url?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      heavy_ops_jobs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json | null
          result: Json | null
          scheduled_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          payload?: Json | null
          result?: Json | null
          scheduled_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          payload?: Json | null
          result?: Json | null
          scheduled_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_items: {
        Row: {
          adjusted_cost: number | null
          cost: number | null
          discount: number | null
          expiry_date: string | null
          id: string
          lot_code: string | null
          lot_id: string | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          receipt_id: string | null
          tenant_id: string
        }
        Insert: {
          adjusted_cost?: number | null
          cost?: number | null
          discount?: number | null
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          receipt_id?: string | null
          tenant_id: string
        }
        Update: {
          adjusted_cost?: number | null
          cost?: number | null
          discount?: number | null
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          receipt_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_import_items_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      import_receipts: {
        Row: {
          created_at: string | null
          date: string | null
          debt_recorded: number | null
          discount_total: number | null
          id: string
          invoice_number: string | null
          note: string | null
          paid_amount: number | null
          shipping_cost: number | null
          status: string | null
          supplier_id: string | null
          supplier_name: string | null
          tenant_id: string
          total_cost: number | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          debt_recorded?: number | null
          discount_total?: number | null
          id: string
          invoice_number?: string | null
          note?: string | null
          paid_amount?: number | null
          shipping_cost?: number | null
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          tenant_id: string
          total_cost?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          debt_recorded?: number | null
          discount_total?: number | null
          id?: string
          invoice_number?: string | null
          note?: string | null
          paid_amount?: number | null
          shipping_cost?: number | null
          status?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          tenant_id?: string
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_import_receipts_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          documentation_url: string | null
          id: string
          name: string
          partner_id: string | null
          slug: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          name: string
          partner_id?: string | null
          slug?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          documentation_url?: string | null
          id?: string
          name?: string
          partner_id?: string | null
          slug?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_count_items: {
        Row: {
          actual_quantity: number | null
          cost: number | null
          count_id: string | null
          expiry_date: string | null
          id: string
          lot_code: string | null
          lot_id: string | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          reason: string | null
          system_quantity: number | null
          tenant_id: string
          unit: string | null
        }
        Insert: {
          actual_quantity?: number | null
          cost?: number | null
          count_id?: string | null
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          reason?: string | null
          system_quantity?: number | null
          tenant_id: string
          unit?: string | null
        }
        Update: {
          actual_quantity?: number | null
          cost?: number | null
          count_id?: string | null
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          reason?: string | null
          system_quantity?: number | null
          tenant_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_count_items_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          code: string | null
          completed_at: string | null
          created_at: string | null
          date: string | null
          id: string
          notes: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          code?: string | null
          completed_at?: string | null
          created_at?: string | null
          date?: string | null
          id: string
          notes?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          code?: string | null
          completed_at?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_counts_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          lot_code: string | null
          movement_type: string
          product_id: string
          qty_after: number
          qty_before: number
          qty_change: number
          reference_id: string
          reference_type: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id: number
          lot_code?: string | null
          movement_type: string
          product_id: string
          qty_after: number
          qty_before: number
          qty_change: number
          reference_id: string
          reference_type: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          lot_code?: string | null
          movement_type?: string
          product_id?: string
          qty_after?: number
          qty_before?: number
          qty_change?: number
          reference_id?: string
          reference_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_movements_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          role: string
          status: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          role?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          tenant_id: string
          unit_price: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          tenant_id: string
          unit_price?: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          tenant_id?: string
          unit_price?: number
        }
        Relationships: []
      }
      invoice_number_counters: {
        Row: {
          counter: number
          year: number
        }
        Insert: {
          counter?: number
          year: number
        }
        Update: {
          counter?: number
          year?: number
        }
        Relationships: []
      }
      invoice_reminder_logs: {
        Row: {
          created_at: string | null
          due_date: string
          error: string | null
          id: string
          invoice_id: string
          milestone: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          due_date: string
          error?: string | null
          id?: string
          invoice_id: string
          milestone: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          due_date?: string
          error?: string | null
          id?: string
          invoice_id?: string
          milestone?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number
          balance: number | null
          created_at: string
          created_by: string | null
          discount: number
          discount_code: string | null
          due_date: string
          id: string
          invoice_no: string
          issue_date: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          status: string
          subscription_id: string | null
          subtotal: number
          tax: number
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          balance?: number | null
          created_at?: string
          created_by?: string | null
          discount?: number
          discount_code?: string | null
          due_date: string
          id?: string
          invoice_no: string
          issue_date?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax?: number
          tenant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          balance?: number | null
          created_at?: string
          created_by?: string | null
          discount?: number
          discount_code?: string | null
          due_date?: string
          id?: string
          invoice_no?: string
          issue_date?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax?: number
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          license_key: string
          max_orders_per_month: number
          max_products: number
          max_users: number
          plan: string
          revoked_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          license_key: string
          max_orders_per_month?: number
          max_products?: number
          max_users?: number
          plan: string
          revoked_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          license_key?: string
          max_orders_per_month?: number
          max_products?: number
          max_users?: number
          plan?: string
          revoked_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string
          success?: boolean
        }
        Relationships: []
      }
      maintenance_windows: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          channel: string
          content: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          sent_by: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          channel: string
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          sent_by?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          sent_by?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          lot_code: string | null
          lot_id: string | null
          order_id: string | null
          price: number | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          tenant_id: string
          unit_name: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          tenant_id: string
          unit_name?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          tenant_id?: string
          unit_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items_archive: {
        Row: {
          cost: number | null
          created_at: string | null
          id: string
          lot_code: string | null
          lot_id: string | null
          order_id: string | null
          price: number | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          tenant_id: string
          unit_name: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          tenant_id: string
          unit_name?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          tenant_id?: string
          unit_name?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          applied_promotions: Json | null
          cancelled_at: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          date: string | null
          debt_recorded: number | null
          has_return: boolean
          id: string
          note: string | null
          order_code: string
          paid_amount: number | null
          payment_method: string | null
          points_earned: number | null
          points_redeemed: number | null
          rewards_redeemed: Json | null
          status: string | null
          tenant_id: string
          total_amount: number | null
          total_returned_amount: number
          total_returned_count: number
          updated_by: string | null
        }
        Insert: {
          applied_promotions?: Json | null
          cancelled_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          date?: string | null
          debt_recorded?: number | null
          has_return?: boolean
          id: string
          note?: string | null
          order_code: string
          paid_amount?: number | null
          payment_method?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          rewards_redeemed?: Json | null
          status?: string | null
          tenant_id: string
          total_amount?: number | null
          total_returned_amount?: number
          total_returned_count?: number
          updated_by?: string | null
        }
        Update: {
          applied_promotions?: Json | null
          cancelled_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          date?: string | null
          debt_recorded?: number | null
          has_return?: boolean
          id?: string
          note?: string | null
          order_code?: string
          paid_amount?: number | null
          payment_method?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          rewards_redeemed?: Json | null
          status?: string | null
          tenant_id?: string
          total_amount?: number | null
          total_returned_amount?: number
          total_returned_count?: number
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_orders_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_archive: {
        Row: {
          applied_promotions: Json | null
          cancelled_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          date: string | null
          debt_recorded: number | null
          has_return: boolean
          id: string
          note: string | null
          order_code: string
          paid_amount: number | null
          payment_method: string | null
          points_earned: number | null
          points_redeemed: number | null
          rewards_redeemed: Json | null
          status: string | null
          tenant_id: string
          total_amount: number | null
          total_returned_amount: number
          total_returned_count: number
        }
        Insert: {
          applied_promotions?: Json | null
          cancelled_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          date?: string | null
          debt_recorded?: number | null
          has_return?: boolean
          id: string
          note?: string | null
          order_code: string
          paid_amount?: number | null
          payment_method?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          rewards_redeemed?: Json | null
          status?: string | null
          tenant_id: string
          total_amount?: number | null
          total_returned_amount?: number
          total_returned_count?: number
        }
        Update: {
          applied_promotions?: Json | null
          cancelled_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          date?: string | null
          debt_recorded?: number | null
          has_return?: boolean
          id?: string
          note?: string | null
          order_code?: string
          paid_amount?: number | null
          payment_method?: string | null
          points_earned?: number | null
          points_redeemed?: number | null
          rewards_redeemed?: Json | null
          status?: string | null
          tenant_id?: string
          total_amount?: number | null
          total_returned_amount?: number
          total_returned_count?: number
        }
        Relationships: []
      }
      partners: {
        Row: {
          contact_email: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string | null
          status: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          reference_code: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          reference_code?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          reference_code?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string
          enabled: boolean
          feature_key: string
          id: string
          limit_value: number | null
          plan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_key: string
          id?: string
          limit_value?: number | null
          plan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_key?: string
          id?: string
          limit_value?: number | null
          plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["key"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          is_active: boolean
          key: string
          max_orders_per_month: number
          max_products: number
          max_users: number
          monthly_price: number
          name: string
          seat_limit: number | null
          updated_at: string
          usage_limits: Json | null
          yearly_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          is_active?: boolean
          key: string
          max_orders_per_month?: number
          max_products?: number
          max_users?: number
          monthly_price?: number
          name: string
          seat_limit?: number | null
          updated_at?: string
          usage_limits?: Json | null
          yearly_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          is_active?: boolean
          key?: string
          max_orders_per_month?: number
          max_products?: number
          max_users?: number
          monthly_price?: number
          name?: string
          seat_limit?: number | null
          updated_at?: string
          usage_limits?: Json | null
          yearly_price?: number
        }
        Relationships: []
      }
      point_history: {
        Row: {
          amount: number | null
          customer_id: string | null
          date: string | null
          description: string | null
          id: string
          order_id: string | null
          tenant_id: string
          type: string | null
        }
        Insert: {
          amount?: number | null
          customer_id?: string | null
          date?: string | null
          description?: string | null
          id: string
          order_id?: string | null
          tenant_id: string
          type?: string | null
        }
        Update: {
          amount?: number | null
          customer_id?: string | null
          date?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          tenant_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_point_history_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_operations: {
        Row: {
          op_id: string
          op_type: string
          processed_at: string
          ref_id: string | null
          tenant_id: string
        }
        Insert: {
          op_id: string
          op_type?: string
          processed_at?: string
          ref_id?: string | null
          tenant_id: string
        }
        Update: {
          op_id?: string
          op_type?: string
          processed_at?: string
          ref_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_processed_operations_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_lots: {
        Row: {
          code: string
          cost: number | null
          created_at: string
          expiry_date: string | null
          id: string
          original_quantity: number | null
          product_id: string
          quantity: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          cost?: number | null
          created_at?: string
          expiry_date?: string | null
          id: string
          original_quantity?: number | null
          product_id: string
          quantity?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          cost?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          original_quantity?: number | null
          product_id?: string
          quantity?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_lots_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          brand_id: string | null
          category: string | null
          category_id: string | null
          conversion_units: Json | null
          cost: number | null
          created_at: string | null
          created_by: string | null
          display_name: string | null
          has_lots: boolean
          id: string
          image: string | null
          is_point_accumulation_enabled: boolean | null
          location: string | null
          max_stock: number | null
          min_stock: number | null
          name: string
          price: number | null
          quantity: number | null
          safety_stock: number | null
          sku: string | null
          tenant_id: string
          unit: string | null
          updated_by: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          conversion_units?: Json | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          has_lots?: boolean
          id: string
          image?: string | null
          is_point_accumulation_enabled?: boolean | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          price?: number | null
          quantity?: number | null
          safety_stock?: number | null
          sku?: string | null
          tenant_id: string
          unit?: string | null
          updated_by?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          brand_id?: string | null
          category?: string | null
          category_id?: string | null
          conversion_units?: Json | null
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          has_lots?: boolean
          id?: string
          image?: string | null
          is_point_accumulation_enabled?: boolean | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          price?: number | null
          quantity?: number | null
          safety_stock?: number | null
          sku?: string | null
          tenant_id?: string
          unit?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_usages: {
        Row: {
          created_at: string
          id: string
          invoice_id: string | null
          promo_code_id: string
          tenant_id: string
          used_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          promo_code_id: string
          tenant_id: string
          used_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string | null
          promo_code_id?: string
          tenant_id?: string
          used_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_value: number
          id: string
          is_active: boolean
          kind: string
          max_discount_amount: number | null
          max_uses_per_tenant: number | null
          max_uses_total: number | null
          min_invoice_amount: number
          target_conditions: Json | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_value?: number
          id?: string
          is_active?: boolean
          kind?: string
          max_discount_amount?: number | null
          max_uses_per_tenant?: number | null
          max_uses_total?: number | null
          min_invoice_amount?: number
          target_conditions?: Json | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_value?: number
          id?: string
          is_active?: boolean
          kind?: string
          max_discount_amount?: number | null
          max_uses_per_tenant?: number | null
          max_uses_total?: number | null
          min_invoice_amount?: number
          target_conditions?: Json | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      promotion_rules: {
        Row: {
          benefit_type: string
          benefit_value: number
          condition_type: string
          condition_value: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          priority: number
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          benefit_type?: string
          benefit_value?: number
          condition_type?: string
          condition_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          benefit_type?: string
          benefit_value?: number
          condition_type?: string
          condition_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          buy_product_id: string | null
          buy_quantity: number | null
          combo_discount_percent: number | null
          combo_product_id: string | null
          created_at: string | null
          description: string | null
          discount_fixed: number | null
          discount_percent: number | null
          end_date: string | null
          gift_discount_percent: number | null
          gift_product_id: string | null
          gift_quantity: number | null
          id: string
          is_active: boolean | null
          main_product_id: string | null
          max_discount: number
          min_customer_rank: string | null
          min_order_value: number
          name: string
          priority: number
          stackable: boolean
          start_date: string | null
          target_category: string | null
          target_product_id: string | null
          target_product_ids: Json | null
          tenant_id: string
          tiers: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          buy_product_id?: string | null
          buy_quantity?: number | null
          combo_discount_percent?: number | null
          combo_product_id?: string | null
          created_at?: string | null
          description?: string | null
          discount_fixed?: number | null
          discount_percent?: number | null
          end_date?: string | null
          gift_discount_percent?: number | null
          gift_product_id?: string | null
          gift_quantity?: number | null
          id: string
          is_active?: boolean | null
          main_product_id?: string | null
          max_discount?: number
          min_customer_rank?: string | null
          min_order_value?: number
          name: string
          priority?: number
          stackable?: boolean
          start_date?: string | null
          target_category?: string | null
          target_product_id?: string | null
          target_product_ids?: Json | null
          tenant_id: string
          tiers?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          buy_product_id?: string | null
          buy_quantity?: number | null
          combo_discount_percent?: number | null
          combo_product_id?: string | null
          created_at?: string | null
          description?: string | null
          discount_fixed?: number | null
          discount_percent?: number | null
          end_date?: string | null
          gift_discount_percent?: number | null
          gift_product_id?: string | null
          gift_quantity?: number | null
          id?: string
          is_active?: boolean | null
          main_product_id?: string | null
          max_discount?: number
          min_customer_rank?: string | null
          min_order_value?: number
          name?: string
          priority?: number
          stackable?: boolean
          start_date?: string | null
          target_category?: string | null
          target_product_id?: string | null
          target_product_ids?: Json | null
          tenant_id?: string
          tiers?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_promotions_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_configs: {
        Row: {
          color: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          discount_percent: number | null
          id: string
          is_default: boolean | null
          key: string
          name: string
          order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id: string
          is_default?: boolean | null
          key: string
          name: string
          order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          is_default?: boolean | null
          key?: string
          name?: string
          order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rank_configs_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_history: {
        Row: {
          changed_at: string | null
          customer_id: string | null
          customer_name: string | null
          id: string
          new_rank: string
          new_rank_name: string
          old_rank: string | null
          old_rank_name: string | null
          reason: string | null
          tenant_id: string
          total_spent_at_change: number | null
        }
        Insert: {
          changed_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id: string
          new_rank: string
          new_rank_name: string
          old_rank?: string | null
          old_rank_name?: string | null
          reason?: string | null
          tenant_id: string
          total_spent_at_change?: number | null
        }
        Update: {
          changed_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          new_rank?: string
          new_rank_name?: string
          old_rank?: string | null
          old_rank_name?: string | null
          reason?: string | null
          tenant_id?: string
          total_spent_at_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rank_history_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_logs: {
        Row: {
          action: string
          attempt_count: number
          created_at: string | null
          id: string
          ip_address: unknown
          tenant_id: string | null
          window_start: string
        }
        Insert: {
          action: string
          attempt_count?: number
          created_at?: string | null
          id?: string
          ip_address: unknown
          tenant_id?: string | null
          window_start?: string
        }
        Update: {
          action?: string
          attempt_count?: number
          created_at?: string | null
          id?: string
          ip_address?: unknown
          tenant_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      return_order_items: {
        Row: {
          created_at: string | null
          id: string
          lot_code: string | null
          lot_id: string | null
          product_id: string
          product_name: string
          quantity: number
          reason: string
          return_order_id: string
          subtotal: number
          tenant_id: string
          unit_name: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id: string
          lot_code?: string | null
          lot_id?: string | null
          product_id: string
          product_name: string
          quantity: number
          reason?: string
          return_order_id: string
          subtotal: number
          tenant_id: string
          unit_name: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          reason?: string
          return_order_id?: string
          subtotal?: number
          tenant_id?: string
          unit_name?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_return_order_items_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_order_items_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "product_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      return_orders: {
        Row: {
          cash_refund: number
          created_at: string
          customer_id: string | null
          customer_name: string
          date: string
          days_since_purchase: number | null
          debt_reduction: number
          fee_amount: number | null
          fee_percent: number | null
          gross_refund_amount: number | null
          id: string
          note: string | null
          original_order_id: string
          original_payment_method: string | null
          points_deducted: number | null
          reason: string
          refund_method: string
          status: string
          tenant_id: string
          total_refund_amount: number
          updated_at: string
        }
        Insert: {
          cash_refund?: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          date?: string
          days_since_purchase?: number | null
          debt_reduction?: number
          fee_amount?: number | null
          fee_percent?: number | null
          gross_refund_amount?: number | null
          id: string
          note?: string | null
          original_order_id: string
          original_payment_method?: string | null
          points_deducted?: number | null
          reason?: string
          refund_method?: string
          status?: string
          tenant_id: string
          total_refund_amount?: number
          updated_at?: string
        }
        Update: {
          cash_refund?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          date?: string
          days_since_purchase?: number | null
          debt_reduction?: number
          fee_amount?: number | null
          fee_percent?: number | null
          gross_refund_amount?: number | null
          id?: string
          note?: string | null
          original_order_id?: string
          original_payment_method?: string | null
          points_deducted?: number | null
          reason?: string
          refund_method?: string
          status?: string
          tenant_id?: string
          total_refund_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_return_orders_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          point_cost: number | null
          stock: number | null
          tenant_id: string
        }
        Insert: {
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          point_cost?: number | null
          stock?: number | null
          tenant_id: string
        }
        Update: {
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          point_cost?: number | null
          stock?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rewards_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          actual_qty: number
          balance_value: number
          created_at: string
          id: string
          incoming_rate: number
          is_cancelled: boolean
          lot_id: string | null
          outgoing_rate: number
          posting_date: string
          product_id: string
          qty_after_transaction: number
          reason: string | null
          stock_value: number
          tenant_id: string
          valuation_rate: number
          voucher_detail_no: string
          voucher_no: string
          voucher_type: string
          warehouse: string
        }
        Insert: {
          actual_qty: number
          balance_value?: number
          created_at?: string
          id?: string
          incoming_rate?: number
          is_cancelled?: boolean
          lot_id?: string | null
          outgoing_rate?: number
          posting_date?: string
          product_id: string
          qty_after_transaction: number
          reason?: string | null
          stock_value?: number
          tenant_id: string
          valuation_rate?: number
          voucher_detail_no: string
          voucher_no: string
          voucher_type: string
          warehouse?: string
        }
        Update: {
          actual_qty?: number
          balance_value?: number
          created_at?: string
          id?: string
          incoming_rate?: number
          is_cancelled?: boolean
          lot_id?: string | null
          outgoing_rate?: number
          posting_date?: string
          product_id?: string
          qty_after_transaction?: number
          reason?: string | null
          stock_value?: number
          tenant_id?: string
          valuation_rate?: number
          voucher_detail_no?: string
          voucher_no?: string
          voucher_type?: string
          warehouse?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_movements_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_exchange_received_items: {
        Row: {
          cost: number
          created_at: string
          exchange_id: string
          expiry_date: string | null
          id: string
          lot_code: string
          lot_id: string | null
          product_id: string
          product_name: string | null
          quantity: number
          tenant_id: string
          total_value: number
        }
        Insert: {
          cost?: number
          created_at?: string
          exchange_id: string
          expiry_date?: string | null
          id?: string
          lot_code: string
          lot_id?: string | null
          product_id: string
          product_name?: string | null
          quantity?: number
          tenant_id: string
          total_value?: number
        }
        Update: {
          cost?: number
          created_at?: string
          exchange_id?: string
          expiry_date?: string | null
          id?: string
          lot_code?: string
          lot_id?: string | null
          product_id?: string
          product_name?: string | null
          quantity?: number
          tenant_id?: string
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_exchange_received_items_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_exchange_return_items: {
        Row: {
          cost: number
          created_at: string
          exchange_id: string
          expiry_date: string | null
          id: string
          lot_code: string | null
          lot_id: string | null
          product_id: string
          product_name: string | null
          quantity: number
          reference_import_item_id: string
          tenant_id: string
          total_value: number
        }
        Insert: {
          cost?: number
          created_at?: string
          exchange_id: string
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_id: string
          product_name?: string | null
          quantity?: number
          reference_import_item_id: string
          tenant_id: string
          total_value?: number
        }
        Update: {
          cost?: number
          created_at?: string
          exchange_id?: string
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          lot_id?: string | null
          product_id?: string
          product_name?: string | null
          quantity?: number
          reference_import_item_id?: string
          tenant_id?: string
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_exchange_return_items_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_exchanges: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          date: string
          debt_adjustment: number
          id: string
          note: string | null
          reason: string | null
          received_total_value: number
          reference_receipt_id: string
          return_total_value: number
          status: string
          supplier_id: string
          supplier_name: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          date?: string
          debt_adjustment?: number
          id: string
          note?: string | null
          reason?: string | null
          received_total_value?: number
          reference_receipt_id: string
          return_total_value?: number
          status?: string
          supplier_id: string
          supplier_name?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          date?: string
          debt_adjustment?: number
          id?: string
          note?: string | null
          reason?: string | null
          received_total_value?: number
          reference_receipt_id?: string
          return_total_value?: number
          status?: string
          supplier_id?: string
          supplier_name?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_exchanges_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payment_ledger: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          created_by: string | null
          id: number
          reason: string | null
          reference_id: string | null
          reference_type: string
          supplier_id: string
          tenant_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          id: number
          reason?: string | null
          reference_id?: string | null
          reference_type: string
          supplier_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          created_by?: string | null
          id?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string
          supplier_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_supplier_payment_ledger_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          code: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          debt: number | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          debt?: number | null
          id: string
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          contact_person?: string | null
          created_at?: string | null
          created_by?: string | null
          debt?: number | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_suppliers_tenant_id"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          priority: string
          resolved_at: string | null
          sla_target_at: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          sla_target_at?: string | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          sla_target_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_admins: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tenant_api_keys: {
        Row: {
          api_key_hash: string
          api_key_preview: string | null
          created_at: string | null
          created_by: string | null
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          revoked_by: string | null
          status: string
          tenant_id: string
          updated_at: string | null
          version: number
        }
        Insert: {
          api_key_hash: string
          api_key_preview?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          api_key_hash?: string
          api_key_preview?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      tenant_credentials: {
        Row: {
          admin_email: string
          created_at: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          admin_email: string
          created_at?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          admin_email?: string
          created_at?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          impersonated_at: string | null
          impersonated_by: string | null
          impersonated_expires_at: string | null
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          impersonated_at?: string | null
          impersonated_by?: string | null
          impersonated_expires_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          impersonated_at?: string | null
          impersonated_by?: string | null
          impersonated_expires_at?: string | null
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tenant_registration_events: {
        Row: {
          created_at: string | null
          creator_id: string | null
          email: string | null
          email_domain: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          owner_user_id: string | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          email?: string | null
          email_domain?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          owner_user_id?: string | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          email?: string | null
          email_domain?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          owner_user_id?: string | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      tenant_restore_snapshots: {
        Row: {
          created_at: string
          id: string
          snapshot: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          snapshot: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          snapshot?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_restore_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          billing_period: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          billing_status: string | null
          current_month_orders: number
          current_month_start: string
          expires_at: string | null
          max_orders_per_month: number
          max_products: number
          max_storage_gb: number
          max_users: number
          plan: string
          plan_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          billing_period?: string | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          billing_status?: string | null
          current_month_orders?: number
          current_month_start?: string
          expires_at?: string | null
          max_orders_per_month?: number
          max_products?: number
          max_storage_gb?: number
          max_users?: number
          plan?: string
          plan_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          billing_period?: string | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          billing_status?: string | null
          current_month_orders?: number
          current_month_start?: string
          expires_at?: string | null
          max_orders_per_month?: number
          max_products?: number
          max_storage_gb?: number
          max_users?: number
          plan?: string
          plan_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "tenant_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["key"]
          },
        ]
      }
      tenant_usage_records: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_key: string
          quantity: number
          recorded_at: string
          source: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_key: string
          quantity?: number
          recorded_at?: string
          source?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_key?: string
          quantity?: number
          recorded_at?: string
          source?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          events: string[]
          id: string
          name: string
          secret: string | null
          status: string
          tenant_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          id?: string
          name: string
          secret?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          id?: string
          name?: string
          secret?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          archived_at: string | null
          connection_pool_config: Json | null
          created_at: string | null
          created_by: string | null
          custom_domain: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_delete_approved_by: string[] | null
          hard_delete_requested_at: string | null
          id: string
          is_personal: boolean
          isolation_mode: string | null
          isolation_project_ref: string | null
          isolation_schema: string | null
          name: string
          owner_id: string | null
          plan: string
          read_replica_url: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string
          updated_at: string | null
          updated_by: string | null
          white_label: Json | null
        }
        Insert: {
          archived_at?: string | null
          connection_pool_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_domain?: string | null
          custom_domain_verification_token?: string | null
          custom_domain_verified_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          hard_delete_approved_by?: string[] | null
          hard_delete_requested_at?: string | null
          id?: string
          is_personal?: boolean
          isolation_mode?: string | null
          isolation_project_ref?: string | null
          isolation_schema?: string | null
          name: string
          owner_id?: string | null
          plan?: string
          read_replica_url?: string | null
          settings?: Json | null
          slug?: string | null
          status?: string
          subdomain: string
          updated_at?: string | null
          updated_by?: string | null
          white_label?: Json | null
        }
        Update: {
          archived_at?: string | null
          connection_pool_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_domain?: string | null
          custom_domain_verification_token?: string | null
          custom_domain_verified_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          hard_delete_approved_by?: string[] | null
          hard_delete_requested_at?: string | null
          id?: string
          is_personal?: boolean
          isolation_mode?: string | null
          isolation_project_ref?: string | null
          isolation_schema?: string | null
          name?: string
          owner_id?: string | null
          plan?: string
          read_replica_url?: string | null
          settings?: Json | null
          slug?: string | null
          status?: string
          subdomain?: string
          updated_at?: string | null
          updated_by?: string | null
          white_label?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_fkey"
            columns: ["plan"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["key"]
          },
        ]
      }
      terms_acceptance: {
        Row: {
          accepted_at: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          tenant_id: string | null
          terms_type: string
          terms_version: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          tenant_id?: string | null
          terms_type: string
          terms_version: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          tenant_id?: string | null
          terms_type?: string
          terms_version?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ticket_replies: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_internal_note: boolean
          tenant_id: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal_note?: boolean
          tenant_id: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_internal_note?: boolean
          tenant_id?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_reply_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_count: number
          attempt_log: Json
          attempted_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          event_type: string
          http_status: number | null
          id: string
          idempotency_key: string
          max_attempts: number
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          status: string
          tenant_id: string
          updated_at: string | null
          webhook_id: string
        }
        Insert: {
          attempt_count?: number
          attempt_log?: Json
          attempted_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type: string
          http_status?: number | null
          id?: string
          idempotency_key: string
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
          webhook_id: string
        }
        Update: {
          attempt_count?: number
          attempt_log?: Json
          attempted_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          event_type?: string
          http_status?: number | null
          id?: string
          idempotency_key?: string
          max_attempts?: number
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
          webhook_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string | null
          created_at: string | null
          id: string
          impersonated_at: string | null
          impersonated_by: string | null
          impersonated_expires_at: string | null
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      acquire_advisory_lock: { Args: { p_lock_id: number }; Returns: boolean }
      activate_pending_memberships: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      add_system_admin: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "system_admins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_system_admin_for_edge: {
        Args: { p_creator_id: string; p_user_id: string }
        Returns: {
          created_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "system_admins"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      adjust_customer_debt: {
        Args: { p_amount: number; p_customer_id: string; p_reason: string }
        Returns: Json
      }
      adjust_supplier_debt: {
        Args: { p_amount: number; p_reason: string; p_supplier_id: string }
        Returns: Json
      }
      apply_voucher_to_invoice: {
        Args: { p_code: string; p_invoice_id: string }
        Returns: Json
      }
      assign_admin_role: {
        Args: { p_role_id: string; p_user_id: string }
        Returns: undefined
      }
      auth_tenant_api_key: { Args: { p_api_key: string }; Returns: string }
      backfill_stock_ledger: { Args: never; Returns: Json }
      backfill_stock_ledger_v2: { Args: never; Returns: Json }
      backfill_v2_allocate_variance: {
        Args: { p_product_id: string; p_variance: number }
        Returns: {
          lot_id: string
          qty: number
        }[]
      }
      backfill_v2_ensure_lot: {
        Args: {
          p_expiry_date?: string
          p_lot_code?: string
          p_product_id: string
        }
        Returns: string
      }
      backfill_v2_resolve_lot: {
        Args: {
          p_direction?: string
          p_expiry_date?: string
          p_lot_code?: string
          p_lot_id?: string
          p_product_id: string
        }
        Returns: string
      }
      bulk_update_tenants: {
        Args: { p_plan?: string; p_status?: string; p_tenant_ids: string[] }
        Returns: Json
      }
      calc_qty_after_transaction:
        | {
            Args: {
              p_actual_qty: number
              p_lot_id: string
              p_product_id: string
            }
            Returns: number
          }
        | {
            Args: {
              p_actual_qty: number
              p_lot_id: string
              p_product_id: string
              p_tenant_id?: string
            }
            Returns: number
          }
      can_use_feature: {
        Args: {
          p_current_usage?: number
          p_feature_key: string
          p_tenant_id: string
        }
        Returns: boolean
      }
      cancel_inventory_count_rpc: {
        Args: { p_count_id: string }
        Returns: undefined
      }
      cancel_order: { Args: { p_order_id: string }; Returns: Json }
      cancel_return_order_v2: { Args: { p_return_id: string }; Returns: Json }
      cancel_subscription: {
        Args: {
          p_cancellation_date?: string
          p_immediate?: boolean
          p_tenant_id: string
        }
        Returns: {
          billing_period: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          billing_status: string | null
          current_month_orders: number
          current_month_start: string
          expires_at: string | null
          max_orders_per_month: number
          max_products: number
          max_storage_gb: number
          max_users: number
          plan: string
          plan_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tenant_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_supplier_exchange: {
        Args: { p_exchange_id: string }
        Returns: Json
      }
      check_inventory_consistency: {
        Args: { p_product_ids: string[] }
        Returns: undefined
      }
      check_product_barcode_exists: {
        Args: { p_barcode: string }
        Returns: boolean
      }
      check_product_code_exists: { Args: { p_code: string }; Returns: boolean }
      check_reward_points_redemption: {
        Args: {
          p_customer_id: string
          p_quantity?: number
          p_reward_id: string
        }
        Returns: boolean
      }
      check_stock_ledger_drift: {
        Args: never
        Returns: {
          diff: number
          lot_id: string
          lot_sum: number
          movement_sum: number
          product_id: string
          products_quantity: number
        }[]
      }
      claim_heavy_op_job: {
        Args: never
        Returns: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json | null
          result: Json | null
          scheduled_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "heavy_ops_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_disposal: {
        Args: { p_disposal_id: string }
        Returns: {
          code: string
          id: string
          status: string
        }[]
      }
      complete_heavy_op_job: {
        Args: {
          p_error_message?: string
          p_job_id: string
          p_result?: Json
          p_status: string
        }
        Returns: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json | null
          result: Json | null
          scheduled_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "heavy_ops_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_inventory_count: {
        Args: { p_count_id: string }
        Returns: undefined
      }
      compute_billing_period_end: {
        Args: { p_billing_period: string; p_start_date: string }
        Returns: string
      }
      confirm_payment: {
        Args: {
          p_invoice_id: string
          p_notes?: string
          p_payment_method?: string
          p_reference_code?: string
        }
        Returns: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          reference_code: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      count_point_products: { Args: never; Returns: number }
      create_admin_role: {
        Args: {
          p_description?: string
          p_name: string
          p_permissions?: string[]
        }
        Returns: Json
      }
      create_exchange_transaction: {
        Args: {
          p_allow_negative?: boolean
          p_cash_diff?: number
          p_cash_refund?: number
          p_customer_id: string
          p_customer_name: string
          p_days_since_purchase?: number
          p_debt_reduction?: number
          p_exchange_debt_recorded?: number
          p_exchange_items?: Json
          p_exchange_order_id?: string
          p_exchange_paid_amount?: number
          p_exchange_payment_method?: string
          p_exchange_total?: number
          p_fee_amount?: number
          p_fee_percent?: number
          p_gross_refund_amount?: number
          p_is_delivery?: boolean
          p_note?: string
          p_offset_amount?: number
          p_original_order_id: string
          p_original_payment_method?: string
          p_reason?: string
          p_return_id: string
          p_return_items?: Json
          p_total_refund_amount?: number
        }
        Returns: Json
      }
      create_gdpr_request: {
        Args: {
          p_dry_run?: boolean
          p_reason?: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      create_integration: {
        Args: {
          p_category?: string
          p_description?: string
          p_documentation_url?: string
          p_name: string
          p_partner_id: string
          p_slug?: string
          p_status?: string
        }
        Returns: Json
      }
      create_invoice: {
        Args: {
          p_bonus_months?: number
          p_cycle_type?: string
          p_notes?: string
          p_quantity?: number
          p_tenant_id: string
        }
        Returns: {
          amount_paid: number
          balance: number | null
          created_at: string
          created_by: string | null
          discount: number
          discount_code: string | null
          due_date: string
          id: string
          invoice_no: string
          issue_date: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          status: string
          subscription_id: string | null
          subtotal: number
          tax: number
          tenant_id: string
          total: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_maintenance_window: {
        Args: {
          p_description?: string
          p_ends_at?: string
          p_starts_at?: string
          p_title: string
        }
        Returns: Json
      }
      create_partner: {
        Args: {
          p_contact_email?: string
          p_description?: string
          p_logo_url?: string
          p_name: string
          p_slug?: string
          p_website?: string
        }
        Returns: Json
      }
      create_plan:
        | {
            Args: {
              p_description?: string
              p_features?: string[]
              p_key: string
              p_max_orders_per_month?: number
              p_max_products?: number
              p_max_users?: number
              p_monthly_price?: number
              p_name: string
              p_seat_limit?: number
              p_usage_limits?: Json
              p_yearly_price?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_description?: string
              p_key: string
              p_max_orders_per_month?: number
              p_max_products?: number
              p_max_users?: number
              p_monthly_price?: number
              p_name: string
              p_yearly_price?: number
            }
            Returns: Json
          }
      create_renewal_invoices: {
        Args: { p_days_before?: number }
        Returns: number
      }
      create_return_order: {
        Args: {
          p_cash_refund?: number
          p_customer_id: string
          p_customer_name: string
          p_days_since_purchase?: number
          p_debt_reduction?: number
          p_fee_amount?: number
          p_fee_percent?: number
          p_gross_refund_amount?: number
          p_id: string
          p_items: Json
          p_note?: string
          p_original_order_id: string
          p_original_payment_method?: string
          p_reason?: string
          p_total_refund_amount: number
        }
        Returns: Json
      }
      create_subscription: {
        Args: {
          p_billing_period?: string
          p_plan: string
          p_start_date?: string
          p_tenant_id: string
          p_trial_days?: number
        }
        Returns: {
          billing_period: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          billing_status: string | null
          current_month_orders: number
          current_month_start: string
          expires_at: string | null
          max_orders_per_month: number
          max_products: number
          max_storage_gb: number
          max_users: number
          plan: string
          plan_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tenant_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_supplier_exchange: { Args: { p_payload: Json }; Returns: Json }
      create_tenant_api_key: {
        Args: { p_name: string; p_tenant_id: string; p_version?: number }
        Returns: Json
      }
      create_tenant_webhook: {
        Args: {
          p_events?: string[]
          p_name: string
          p_secret?: string
          p_tenant_id: string
          p_url: string
        }
        Returns: Json
      }
      create_tenant_with_admin: {
        Args: {
          p_name: string
          p_owner_user_id?: string
          p_plan?: string
          p_subdomain: string
        }
        Returns: {
          archived_at: string | null
          connection_pool_config: Json | null
          created_at: string | null
          created_by: string | null
          custom_domain: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_delete_approved_by: string[] | null
          hard_delete_requested_at: string | null
          id: string
          is_personal: boolean
          isolation_mode: string | null
          isolation_project_ref: string | null
          isolation_schema: string | null
          name: string
          owner_id: string | null
          plan: string
          read_replica_url: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string
          updated_at: string | null
          updated_by: string | null
          white_label: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_tenant_id: { Args: never; Returns: string }
      decrement_product_quantity: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      delete_2fa_backup_codes: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      delete_admin_role: { Args: { p_role_id: string }; Returns: undefined }
      delete_disposal_with_restore: {
        Args: { p_disposal_id: string }
        Returns: undefined
      }
      delete_import_v2: { Args: { p_receipt_id: string }; Returns: Json }
      delete_integration: {
        Args: { p_integration_id: string }
        Returns: undefined
      }
      delete_inventory_count_rpc: {
        Args: { p_count_id: string }
        Returns: undefined
      }
      delete_maintenance_window: { Args: { p_id: string }; Returns: Json }
      delete_order: { Args: { p_order_id: string }; Returns: Json }
      delete_partner: { Args: { p_partner_id: string }; Returns: undefined }
      delete_plan: { Args: { p_key: string }; Returns: boolean }
      delete_tenant_safe: {
        Args: { p_tenant_id: string }
        Returns: {
          archived_at: string | null
          connection_pool_config: Json | null
          created_at: string | null
          created_by: string | null
          custom_domain: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_delete_approved_by: string[] | null
          hard_delete_requested_at: string | null
          id: string
          is_personal: boolean
          isolation_mode: string | null
          isolation_project_ref: string | null
          isolation_schema: string | null
          name: string
          owner_id: string | null
          plan: string
          read_replica_url: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string
          updated_at: string | null
          updated_by: string | null
          white_label: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_tenant_webhook: {
        Args: { p_webhook_id: string }
        Returns: undefined
      }
      downgrade_subscription: {
        Args: {
          p_billing_period?: string
          p_plan: string
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: {
          billing_period: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          billing_status: string | null
          current_month_orders: number
          current_month_start: string
          expires_at: string | null
          max_orders_per_month: number
          max_products: number
          max_storage_gb: number
          max_users: number
          plan: string
          plan_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tenant_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      enqueue_heavy_op_job: {
        Args: {
          p_job_type: string
          p_max_attempts?: number
          p_payload?: Json
          p_scheduled_at?: string
          p_tenant_id: string
        }
        Returns: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json | null
          result: Json | null
          scheduled_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "heavy_ops_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_overdue_invoices: { Args: never; Returns: number }
      expire_pending_invoices: { Args: never; Returns: Json }
      export_tenant_data: { Args: { p_tenant_id: string }; Returns: Json }
      f_unaccent: { Args: { input: string }; Returns: string }
      filter_customers_rpc: {
        Args: {
          p_has_debt?: string
          p_max_points?: number
          p_min_points?: number
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_sort_by?: string
          p_sort_order?: string
        }
        Returns: Json
      }
      filter_disposals_rpc: {
        Args: {
          p_from_date?: string
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_status?: string
          p_to_date?: string
        }
        Returns: Json
      }
      filter_import_receipts_rpc:
        | {
            Args: {
              p_from_date?: string
              p_page?: number
              p_page_size?: number
              p_search_term?: string
              p_supplier_id?: string
              p_to_date?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_from_date?: string
              p_page?: number
              p_page_size?: number
              p_search_term?: string
              p_status?: string
              p_supplier_id?: string
              p_to_date?: string
            }
            Returns: Json
          }
      filter_products_rpc:
        | {
            Args: {
              p_brand_id?: string
              p_category_id?: string
              p_page?: number
              p_page_size?: number
              p_search_term?: string
              p_sort_by?: string
              p_sort_order?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_brand_id?: string
              p_category_id?: string
              p_page?: number
              p_page_size?: number
              p_search_term?: string
              p_sort_by?: string
              p_sort_order?: string
              p_stock_status?: string
            }
            Returns: Json
          }
      filter_return_orders_rpc: {
        Args: {
          p_from_date?: string
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_status?: string
          p_to_date?: string
        }
        Returns: Json
      }
      filter_suppliers_rpc: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search_term?: string
          p_sort_by?: string
          p_sort_order?: string
        }
        Returns: Json
      }
      gdpr_delete_user_data: {
        Args: { p_dry_run?: boolean; p_user_id: string }
        Returns: Json
      }
      gdpr_export_user_data: { Args: { p_user_id: string }; Returns: Json }
      generate_2fa_backup_codes: {
        Args: { p_count?: number; p_user_id: string }
        Returns: Json
      }
      generate_tenant_license: {
        Args: {
          p_expires_at?: string
          p_max_orders_per_month?: number
          p_max_products?: number
          p_max_users?: number
          p_plan: string
          p_tenant_id: string
        }
        Returns: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          license_key: string
          max_orders_per_month: number
          max_products: number
          max_users: number
          plan: string
          revoked_at: string | null
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "licenses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_admin_cron_config: { Args: never; Returns: Json }
      get_admin_login_alerts: { Args: { p_hours_ago?: number }; Returns: Json }
      get_admin_login_history: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_limit?: number
          p_offset?: number
          p_status?: string
        }
        Returns: Json
      }
      get_admin_roles: { Args: never; Returns: Json }
      get_billing_automation_status: { Args: never; Returns: Json }
      get_billing_job_logs: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          details: Json
          duration_ms: number
          id: string
          job_name: string
          message: string
          records_affected: number
          run_at: string
          status: string
        }[]
      }
      get_billing_reminder_config: { Args: never; Returns: Json }
      get_brand_product_counts: { Args: never; Returns: Json }
      get_category_product_counts: { Args: never; Returns: Json }
      get_churn_cohort_metrics: {
        Args: {
          p_cohort_months?: number
          p_end_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_connection_pool_stats: { Args: never; Returns: Json }
      get_current_announcements_for_tenant: {
        Args: { p_tenant_id?: string }
        Returns: {
          active_from: string
          active_to: string
          audience: string
          content: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          published_at: string
          scheduled_at: string
          status: string
          target_type: string
          targets: Json
          title: string
          updated_at: string
        }[]
      }
      get_current_user_tenants: { Args: never; Returns: Json }
      get_customer_debt_ledger: {
        Args: { p_customer_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_customer_report: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_customer_stats: { Args: never; Returns: Json }
      get_dashboard_summary: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      get_data_retention_config: { Args: never; Returns: Json }
      get_data_retention_status: { Args: never; Returns: Json }
      get_db_index_stats: { Args: never; Returns: Json }
      get_db_table_stats: { Args: never; Returns: Json }
      get_default_plan_limit_values: { Args: { p_plan: string }; Returns: Json }
      get_default_plan_limits: { Args: never; Returns: Json }
      get_disposal_auto_code: { Args: never; Returns: string }
      get_email_brand: { Args: never; Returns: Json }
      get_email_template_by_key: {
        Args: { p_key: string }
        Returns: {
          body_html: string
          id: string
          is_active: boolean
          key: string
          name: string
          subject: string
          variables: Json
        }[]
      }
      get_error_log_summary: {
        Args: { p_hours?: number; p_limit?: number }
        Returns: Json
      }
      get_fraud_detection_config: { Args: never; Returns: Json }
      get_fraud_queue: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_severity?: string
          p_status?: string
        }
        Returns: Json
      }
      get_fraud_stats: { Args: never; Returns: Json }
      get_gdpr_requests: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: string
          p_type?: string
        }
        Returns: Json
      }
      get_global_config: { Args: never; Returns: Json }
      get_heavy_op_jobs: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: string
          p_tenant_id?: string
        }
        Returns: {
          attempts: number
          created_at: string
          error_message: string
          id: string
          job_type: string
          max_attempts: number
          payload: Json
          result: Json
          scheduled_at: string
          status: string
          tenant_id: string
          updated_at: string
        }[]
      }
      get_import_receipt_count_by_date: {
        Args: { p_date: string }
        Returns: number
      }
      get_import_receipts_by_product_and_lot: {
        Args: { p_lot_id?: string; p_product_id: string }
        Returns: Json
      }
      get_import_receipts_by_supplier_id: {
        Args: { p_limit?: number; p_supplier_id: string }
        Returns: Json
      }
      get_import_stats: {
        Args: { p_from_date?: string; p_to_date?: string }
        Returns: Json
      }
      get_in_app_messages_for_tenant: {
        Args: { p_limit?: number; p_offset?: number; p_tenant_id?: string }
        Returns: {
          channel: string
          content: string
          created_at: string
          error_message: string
          id: string
          metadata: Json
          sent_by: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }[]
      }
      get_inventory_report: {
        Args: {
          p_category?: string
          p_end_date: string
          p_start_date: string
          p_stock_status?: string
        }
        Returns: Json
      }
      get_locked_emails: { Args: never; Returns: Json }
      get_login_attempts: {
        Args: { p_email?: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_maintenance_mode: { Args: never; Returns: Json }
      get_maintenance_windows: {
        Args: { p_end?: string; p_start?: string }
        Returns: Json
      }
      get_next_invoice_number: { Args: { p_year?: number }; Returns: string }
      get_or_create_custom_domain_token: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_order_auto_code: { Args: never; Returns: string }
      get_pending_billing_reminders: {
        Args: never
        Returns: {
          due_date: string
          invoice_id: string
          milestone: string
        }[]
      }
      get_pending_webhook_deliveries: {
        Args: { p_limit?: number }
        Returns: Json
      }
      get_plan_by_key: { Args: { p_key: string }; Returns: Json }
      get_plans: { Args: never; Returns: Json }
      get_product_by_barcode: {
        Args: { p_barcode: string }
        Returns: {
          barcode: string
          brand: string
          brand_id: string
          category: string
          category_id: string
          code: string
          conversion_units: Json
          cost: number
          created_at: string
          display_name: string
          has_lots: boolean
          id: string
          image: string
          is_point_accumulation_enabled: boolean
          location: string
          max_stock: number
          min_stock: number
          name: string
          price: number
          product_lots: Json
          quantity: number
          safety_stock: number
          unit: string
        }[]
      }
      get_product_stats: { Args: never; Returns: Json }
      get_product_stock_balance: {
        Args: { p_lot_id?: string; p_product_id: string }
        Returns: number
      }
      get_product_valuation_rate: {
        Args: { p_lot_id?: string; p_product_id: string }
        Returns: number
      }
      get_profit_report: {
        Args: {
          p_compare_mode?: string
          p_customer_keyword?: string
          p_end_date: string
          p_payment_method?: string
          p_product_keyword?: string
          p_start_date: string
          p_status?: string
        }
        Returns: Json
      }
      get_promo_code_usage_counts: {
        Args: { p_promo_code_id: string }
        Returns: Json
      }
      get_query_performance_metrics: { Args: never; Returns: Json }
      get_rate_limit_logs: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_read_replica_status: { Args: never; Returns: Json }
      get_return_order_auto_code: { Args: never; Returns: string }
      get_revenue_metrics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_sales_report: {
        Args: {
          p_customer_keyword?: string
          p_end_date: string
          p_payment_method?: string
          p_product_keyword?: string
          p_start_date: string
          p_status?: string
        }
        Returns: Json
      }
      get_session_timeout_minutes: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      get_stock_balance: {
        Args: { p_at_date?: string; p_product_id: string }
        Returns: {
          lot_id: string
          product_id: string
          quantity: number
          valuation_rate: number
          value: number
        }[]
      }
      get_stock_ledger: {
        Args: {
          p_from_date: string
          p_is_cancelled?: boolean
          p_limit?: number
          p_lot_id?: string
          p_offset?: number
          p_product_id: string
          p_to_date: string
          p_voucher_type?: string
        }
        Returns: {
          actual_qty: number
          balance_value: number
          created_at: string
          id: string
          incoming_rate: number
          is_cancelled: boolean
          lot_code: string
          lot_id: string
          outgoing_rate: number
          posting_date: string
          product_id: string
          product_name: string
          qty_after_transaction: number
          reason: string
          stock_value: number
          valuation_rate: number
          voucher_detail_no: string
          voucher_no: string
          voucher_type: string
          warehouse: string
        }[]
      }
      get_supplier_debt_ledger: {
        Args: { p_limit?: number; p_offset?: number; p_supplier_id: string }
        Returns: Json
      }
      get_supplier_exchange_auto_code: { Args: never; Returns: string }
      get_supplier_report: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      get_supplier_stats: { Args: never; Returns: Json }
      get_system_admins: { Args: never; Returns: Json }
      get_system_overview: { Args: never; Returns: Json }
      get_tenant_backup_tables: {
        Args: never
        Returns: {
          table_name: string
        }[]
      }
      get_tenant_by_domain: {
        Args: { p_domain: string }
        Returns: {
          archived_at: string | null
          connection_pool_config: Json | null
          created_at: string | null
          created_by: string | null
          custom_domain: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_delete_approved_by: string[] | null
          hard_delete_requested_at: string | null
          id: string
          is_personal: boolean
          isolation_mode: string | null
          isolation_project_ref: string | null
          isolation_schema: string | null
          name: string
          owner_id: string | null
          plan: string
          read_replica_url: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string
          updated_at: string | null
          updated_by: string | null
          white_label: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_tenant_by_subdomain: {
        Args: { p_subdomain: string }
        Returns: {
          archived_at: string | null
          connection_pool_config: Json | null
          created_at: string | null
          created_by: string | null
          custom_domain: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_delete_approved_by: string[] | null
          hard_delete_requested_at: string | null
          id: string
          is_personal: boolean
          isolation_mode: string | null
          isolation_project_ref: string | null
          isolation_schema: string | null
          name: string
          owner_id: string | null
          plan: string
          read_replica_url: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string
          updated_at: string | null
          updated_by: string | null
          white_label: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_tenant_feature_flags: { Args: { p_tenant_id: string }; Returns: Json }
      get_tenant_growth: { Args: { p_months?: number }; Returns: Json }
      get_tenant_isolation: { Args: { p_tenant_id: string }; Returns: Json }
      get_tenant_members_with_email: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_tenant_restore_table_order: {
        Args: never
        Returns: {
          depth: number
          table_name: string
        }[]
      }
      get_tenant_security_settings: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_tenant_storage_usage: { Args: never; Returns: Json }
      get_tenant_usage_summary: { Args: { p_tenant_id: string }; Returns: Json }
      get_tenants_admin: {
        Args: {
          p_limit?: number
          p_page?: number
          p_plan?: string
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status?: string
        }
        Returns: Json
      }
      get_tenants_for_user: { Args: { p_role?: string }; Returns: string[] }
      get_terms_acceptances: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_tenant_id?: string
          p_terms_type?: string
        }
        Returns: Json
      }
      get_top_tenants: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_unsynced_brands: { Args: never; Returns: Json }
      get_unsynced_categories: { Args: never; Returns: Json }
      get_user_by_email: {
        Args: { p_email: string }
        Returns: {
          confirmed_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      get_users: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      get_users_with_admin_roles: {
        Args: { p_page?: number; p_page_size?: number; p_search?: string }
        Returns: Json
      }
      has_tenant_role: {
        Args: { p_role: string; p_tenant_id: string }
        Returns: boolean
      }
      increment_product_quantity: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      insert_customer_ledger_entry:
        | {
            Args: {
              p_amount?: number
              p_created_at?: string
              p_created_by?: string
              p_customer_id: string
              p_reason?: string
              p_reference_id?: string
              p_reference_type: string
            }
            Returns: number
          }
        | {
            Args: {
              p_amount?: number
              p_created_at?: string
              p_created_by?: string
              p_customer_id: string
              p_reason?: string
              p_reference_id?: string
              p_reference_type: string
              p_tenant_id?: string
            }
            Returns: number
          }
      insert_stock_ledger_entry:
        | {
            Args: {
              p_actual_qty: number
              p_incoming_rate: number
              p_is_cancelled?: boolean
              p_lot_id: string
              p_outgoing_rate: number
              p_posting_date: string
              p_product_id: string
              p_qty_after_transaction: number
              p_reason: string
              p_valuation_rate: number
              p_voucher_detail_no: string
              p_voucher_no: string
              p_voucher_type: string
              p_warehouse: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_actual_qty: number
              p_incoming_rate: number
              p_is_cancelled?: boolean
              p_lot_id: string
              p_outgoing_rate: number
              p_posting_date: string
              p_product_id: string
              p_qty_after_transaction: number
              p_reason: string
              p_tenant_id?: string
              p_valuation_rate: number
              p_voucher_detail_no: string
              p_voucher_no: string
              p_voucher_type: string
              p_warehouse: string
            }
            Returns: undefined
          }
      insert_supplier_ledger_entry: {
        Args: {
          p_amount?: number
          p_created_at?: string
          p_created_by?: string
          p_reason?: string
          p_reference_id?: string
          p_reference_type: string
          p_supplier_id: string
        }
        Returns: number
      }
      is_2fa_enabled: { Args: { p_user_id: string }; Returns: boolean }
      is_ip_allowed: {
        Args: { p_ip_address: string; p_tenant_id: string }
        Returns: boolean
      }
      is_login_locked: { Args: { p_email: string }; Returns: boolean }
      is_system_admin: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: { p_tenant_id: string }; Returns: boolean }
      is_tenant_member: { Args: { p_tenant_id: string }; Returns: boolean }
      is_tenant_owner: { Args: { p_tenant_id: string }; Returns: boolean }
      is_tenant_writable: { Args: { p_tenant_id: string }; Returns: boolean }
      is_valid_admin_cron_url: { Args: { p_url: string }; Returns: boolean }
      is_valid_billing_reminder_url: {
        Args: { p_url: string }
        Returns: boolean
      }
      is_valid_plan: { Args: { p_plan: string }; Returns: boolean }
      is_valid_webhook_url: { Args: { p_url: string }; Returns: boolean }
      list_2fa_backup_codes: { Args: { p_user_id: string }; Returns: Json }
      list_db_maintenance_jobs: { Args: { p_limit?: number }; Returns: Json }
      list_integrations: { Args: never; Returns: Json }
      list_partners: { Args: never; Returns: Json }
      list_tenant_api_keys: { Args: { p_tenant_id: string }; Returns: Json }
      list_tenant_webhooks: { Args: { p_tenant_id: string }; Returns: Json }
      list_webhook_deliveries: {
        Args: { p_limit?: number; p_offset?: number; p_webhook_id: string }
        Returns: Json
      }
      log_billing_job: {
        Args: {
          p_details?: Json
          p_duration_ms?: number
          p_job_name: string
          p_message?: string
          p_records_affected?: number
          p_status: string
        }
        Returns: {
          created_at: string
          details: Json | null
          duration_ms: number | null
          id: string
          job_name: string
          message: string | null
          records_affected: number
          run_at: string
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "billing_job_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      lookup_invitation: {
        Args: { p_token: string }
        Returns: {
          active: boolean
          email: string
          expired: boolean
          role: string
          tenant_custom_domain: string
          tenant_id: string
          tenant_name: string
          tenant_subdomain: string
        }[]
      }
      mark_in_app_message_read: {
        Args: { p_log_id: string; p_tenant_id?: string }
        Returns: boolean
      }
      mark_webhook_delivery: {
        Args: {
          p_delivery_id: string
          p_error_message?: string
          p_http_status?: number
          p_response_body?: string
          p_status: string
        }
        Returns: Json
      }
      migrate_tenant_data: {
        Args: { p_source_tenant_id: string; p_target_tenant_id: string }
        Returns: Json
      }
      pay_order_debt: {
        Args: { p_amount: number; p_order_id: string }
        Returns: Json
      }
      pay_supplier_debt: {
        Args: { p_amount: number; p_receipt_id: string }
        Returns: Json
      }
      process_checkout: {
        Args: {
          p_allow_negative?: boolean
          p_customer_update?: Json
          p_deltas?: Json
          p_items?: Json
          p_op_id?: string
          p_order: Json
          p_point_history?: Json
          p_reward_deltas?: Json
        }
        Returns: Json
      }
      process_checkout_tenant: {
        Args: {
          p_allow_negative?: boolean
          p_customer_update?: Json
          p_deltas?: Json
          p_items?: Json
          p_op_id?: string
          p_order: Json
          p_point_history?: Json
          p_reward_deltas?: Json
          p_tenant_id: string
        }
        Returns: Json
      }
      process_import_v2: { Args: { p_payload: Json }; Returns: Json }
      promotion_rule_matches: {
        Args: { p_cycle_type?: string; p_rule_id: string; p_tenant_id: string }
        Returns: boolean
      }
      publish_scheduled_announcements: { Args: never; Returns: number }
      purge_old_backup_code_attempts: { Args: never; Returns: undefined }
      reconcile_customer_debt: { Args: never; Returns: Json }
      reconcile_supplier_debt: { Args: never; Returns: Json }
      record_admin_login: {
        Args: {
          p_email?: string
          p_failure_reason?: string
          p_ip_address?: string
          p_status?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      record_login_attempt: {
        Args: { p_email: string; p_ip_address: string; p_success?: boolean }
        Returns: string
      }
      record_terms_acceptance: {
        Args: {
          p_ip_address?: string
          p_metadata?: Json
          p_tenant_id?: string
          p_terms_type?: string
          p_terms_version?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      remove_admin_role: {
        Args: { p_role_id: string; p_user_id: string }
        Returns: undefined
      }
      remove_system_admin: { Args: { p_user_id: string }; Returns: boolean }
      remove_tenant_member: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: undefined
      }
      reset_demo_data: { Args: { p_tenant_id: string }; Returns: Json }
      reset_monthly_order_counter: {
        Args: { p_tenant_id: string }
        Returns: {
          billing_period: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          billing_status: string | null
          current_month_orders: number
          current_month_start: string
          expires_at: string | null
          max_orders_per_month: number
          max_products: number
          max_storage_gb: number
          max_users: number
          plan: string
          plan_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tenant_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reset_stale_monthly_order_counters: { Args: never; Returns: number }
      restore_tenant_tables:
        | { Args: { p_tables: Json; p_tenant_id: string }; Returns: Json }
        | {
            Args: {
              p_confirm_overwrite?: boolean
              p_tables: Json
              p_tenant_id: string
            }
            Returns: Json
          }
      retry_heavy_op_job: {
        Args: { p_job_id: string }
        Returns: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json | null
          result: Json | null
          scheduled_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "heavy_ops_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      retry_webhook_delivery: { Args: { p_delivery_id: string }; Returns: Json }
      revoke_tenant_api_key: {
        Args: { p_key_id: string }
        Returns: {
          api_key_hash: string
          api_key_preview: string | null
          created_at: string | null
          created_by: string | null
          id: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          revoked_by: string | null
          status: string
          tenant_id: string
          updated_at: string | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "tenant_api_keys"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      run_admin_cron_audit_cleanup: { Args: never; Returns: Json }
      run_admin_cron_billing_reminders: { Args: never; Returns: Json }
      run_data_retention: { Args: never; Returns: Json }
      run_db_maintenance_job: {
        Args: { p_operation: string; p_tables?: string[] }
        Returns: Json
      }
      run_fraud_detection: { Args: never; Returns: Json }
      search_customers_rpc: {
        Args: { search_term: string }
        Returns: {
          address: string | null
          code: string | null
          created_at: string | null
          created_by: string | null
          debt: number | null
          id: string
          last_purchase_date: string | null
          loyalty_points: number | null
          name: string
          phone: string | null
          rank: string | null
          tenant_id: string
          total_spent: number | null
          updated_at: string | null
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "customers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_orders_rpc: {
        Args: { p_limit?: number; p_search_term: string }
        Returns: Json
      }
      search_products_rpc: {
        Args: { p_limit?: number; p_search_term?: string }
        Returns: {
          barcode: string
          brand: string
          brand_id: string
          category: string
          category_id: string
          code: string
          conversion_units: Json
          cost: number
          created_at: string
          display_name: string
          has_lots: boolean
          id: string
          image: string
          is_point_accumulation_enabled: boolean
          location: string
          max_stock: number
          min_stock: number
          name: string
          price: number
          product_lots: Json
          quantity: number
          safety_stock: number
          unit: string
        }[]
      }
      search_suppliers_rpc: {
        Args: { p_limit?: number; p_search_term?: string }
        Returns: {
          address: string | null
          code: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          debt: number | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "suppliers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_tenant_members: {
        Args: {
          p_is_active?: boolean
          p_page?: number
          p_page_size?: number
          p_role?: string
          p_search?: string
          p_sort_by?: string
          p_sort_dir?: string
          p_status?: string
          p_tenant_id: string
        }
        Returns: Json
      }
      search_tenants: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_plan?: string
          p_search_term?: string
          p_status?: string
        }
        Returns: Json
      }
      send_billing_reminders: { Args: never; Returns: Json }
      send_in_app_message: {
        Args: {
          p_content: string
          p_metadata?: Json
          p_tenant_id: string
          p_title: string
        }
        Returns: {
          channel: string
          content: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          sent_by: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "notification_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_billing_reminder_config: {
        Args: {
          p_enabled: boolean
          p_function_url?: string
          p_milestones: number[]
          p_reminder_secret?: string
          p_send_time?: string
        }
        Returns: Json
      }
      set_data_retention_config: {
        Args: {
          p_cron_schedule?: string
          p_retention_days_fraud_queue?: number
          p_retention_days_orders?: number
          p_retention_days_processed_operations?: number
          p_retention_days_rate_limit_logs?: number
          p_retention_days_registration_events?: number
        }
        Returns: Json
      }
      set_default_plan_limits: {
        Args: {
          p_max_orders_per_month: number
          p_max_products: number
          p_max_users: number
          p_plan: string
        }
        Returns: Json
      }
      set_fraud_detection_config: {
        Args: {
          p_email_domain_max?: number
          p_email_domain_window_hours?: number
          p_enabled?: boolean
          p_ip_max?: number
          p_ip_window_hours?: number
          p_owner_max?: number
          p_owner_window_hours?: number
        }
        Returns: Json
      }
      set_global_config: {
        Args: { p_key: string; p_value: Json }
        Returns: Json
      }
      set_maintenance_mode: {
        Args: { p_enabled: boolean; p_message?: string }
        Returns: Json
      }
      set_tenant_subdomain: {
        Args: { p_subdomain: string; p_tenant_id: string }
        Returns: {
          archived_at: string | null
          connection_pool_config: Json | null
          created_at: string | null
          created_by: string | null
          custom_domain: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_delete_approved_by: string[] | null
          hard_delete_requested_at: string | null
          id: string
          is_personal: boolean
          isolation_mode: string | null
          isolation_project_ref: string | null
          isolation_schema: string | null
          name: string
          owner_id: string | null
          plan: string
          read_replica_url: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string
          updated_at: string | null
          updated_by: string | null
          white_label: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sync_product_quantity_from_lots: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      toggle_tenant_member_active: {
        Args: { p_is_active: boolean; p_tenant_id: string; p_user_id: string }
        Returns: {
          accepted_at: string | null
          created_at: string | null
          id: string
          impersonated_at: string | null
          impersonated_by: string | null
          impersonated_expires_at: string | null
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      trigger_webhook_event: {
        Args: {
          p_event_type: string
          p_idempotency_key?: string
          p_payload?: Json
          p_tenant_id: string
        }
        Returns: Json
      }
      unlock_login_attempts: { Args: { p_email: string }; Returns: undefined }
      update_admin_role: {
        Args: {
          p_description?: string
          p_name: string
          p_permissions?: string[]
          p_role_id: string
        }
        Returns: Json
      }
      update_fraud_queue_status: {
        Args: { p_id: string; p_notes?: string; p_status: string }
        Returns: Json
      }
      update_import_v2: {
        Args: { p_payload: Json; p_receipt_id: string }
        Returns: Json
      }
      update_integration: {
        Args: {
          p_category?: string
          p_description?: string
          p_documentation_url?: string
          p_integration_id: string
          p_name?: string
          p_partner_id?: string
          p_slug?: string
          p_status?: string
        }
        Returns: Json
      }
      update_maintenance_window: {
        Args: {
          p_description?: string
          p_ends_at?: string
          p_id: string
          p_starts_at?: string
          p_status?: string
          p_title?: string
        }
        Returns: Json
      }
      update_partner: {
        Args: {
          p_contact_email?: string
          p_description?: string
          p_logo_url?: string
          p_name?: string
          p_partner_id: string
          p_slug?: string
          p_status?: string
          p_website?: string
        }
        Returns: Json
      }
      update_plan:
        | {
            Args: {
              p_description?: string
              p_features?: string[]
              p_is_active?: boolean
              p_key: string
              p_max_orders_per_month?: number
              p_max_products?: number
              p_max_users?: number
              p_monthly_price?: number
              p_name?: string
              p_seat_limit?: number
              p_usage_limits?: Json
              p_yearly_price?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_description?: string
              p_is_active?: boolean
              p_key: string
              p_max_orders_per_month?: number
              p_max_products?: number
              p_max_users?: number
              p_monthly_price?: number
              p_name?: string
              p_yearly_price?: number
            }
            Returns: Json
          }
      update_tenant: {
        Args: {
          p_connection_pool_config?: Json
          p_custom_domain?: string
          p_isolation_mode?: string
          p_isolation_project_ref?: string
          p_isolation_schema?: string
          p_name?: string
          p_plan?: string
          p_read_replica_url?: string
          p_status?: string
          p_tenant_id: string
          p_white_label?: Json
        }
        Returns: {
          archived_at: string | null
          connection_pool_config: Json | null
          created_at: string | null
          created_by: string | null
          custom_domain: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_delete_approved_by: string[] | null
          hard_delete_requested_at: string | null
          id: string
          is_personal: boolean
          isolation_mode: string | null
          isolation_project_ref: string | null
          isolation_schema: string | null
          name: string
          owner_id: string | null
          plan: string
          read_replica_url: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string
          updated_at: string | null
          updated_by: string | null
          white_label: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_tenant_feature_flags: {
        Args: { p_features: Json; p_tenant_id: string }
        Returns: Json
      }
      update_tenant_ip_allowlist: {
        Args: { p_allowed_ips: string[]; p_tenant_id: string }
        Returns: undefined
      }
      update_tenant_member_role: {
        Args: { p_role: string; p_tenant_id: string; p_user_id: string }
        Returns: {
          accepted_at: string | null
          created_at: string | null
          id: string
          impersonated_at: string | null
          impersonated_by: string | null
          impersonated_expires_at: string | null
          invited_at: string | null
          invited_by: string | null
          is_active: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          status: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_memberships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_tenant_session_timeout: {
        Args: { p_minutes: number; p_tenant_id: string }
        Returns: undefined
      }
      update_tenant_status: {
        Args: { p_status: string; p_tenant_id: string }
        Returns: {
          archived_at: string | null
          connection_pool_config: Json | null
          created_at: string | null
          created_by: string | null
          custom_domain: string | null
          custom_domain_verification_token: string | null
          custom_domain_verified_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          hard_delete_approved_by: string[] | null
          hard_delete_requested_at: string | null
          id: string
          is_personal: boolean
          isolation_mode: string | null
          isolation_project_ref: string | null
          isolation_schema: string | null
          name: string
          owner_id: string | null
          plan: string
          read_replica_url: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string
          updated_at: string | null
          updated_by: string | null
          white_label: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "tenants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_tenant_subscription: {
        Args: {
          p_billing_status?: string
          p_expires_at?: string
          p_max_orders_per_month?: number
          p_max_products?: number
          p_max_storage_gb?: number
          p_max_users?: number
          p_plan?: string
          p_tenant_id: string
        }
        Returns: {
          billing_period: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          billing_status: string | null
          current_month_orders: number
          current_month_start: string
          expires_at: string | null
          max_orders_per_month: number
          max_products: number
          max_storage_gb: number
          max_users: number
          plan: string
          plan_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tenant_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_tenant_webhook: {
        Args: {
          p_events?: string[]
          p_name?: string
          p_secret?: string
          p_status?: string
          p_url?: string
          p_webhook_id: string
        }
        Returns: Json
      }
      update_user_status: {
        Args: { p_status: string; p_user_id: string }
        Returns: Json
      }
      upgrade_subscription: {
        Args: {
          p_billing_period?: string
          p_plan: string
          p_start_date?: string
          p_tenant_id: string
        }
        Returns: {
          billing_period: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          billing_status: string | null
          current_month_orders: number
          current_month_start: string
          expires_at: string | null
          max_orders_per_month: number
          max_products: number
          max_storage_gb: number
          max_users: number
          plan: string
          plan_id: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "tenant_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_tenant_role: { Args: { p_tenant_id: string }; Returns: string }
      validate_promo_code: {
        Args: {
          p_code: string
          p_invoice_subtotal?: number
          p_tenant_id: string
        }
        Returns: Json
      }
      validate_tenant_license: {
        Args: { p_license_key: string }
        Returns: {
          license_id: string
          plan: string
          reason: string
          tenant_id: string
          valid: boolean
        }[]
      }
      verify_2fa_backup_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      webhook_retry_schedule: {
        Args: { p_attempt_count: number }
        Returns: string
      }
    }
    Enums: {
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      tenant_role: "owner" | "admin" | "member" | "viewer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      tenant_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const

