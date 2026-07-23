export type UserRole = "admin" | "leader" | "member";
export type MemberStatus = "pending" | "active" | "inactive";
export type BomCategory = "chassis" | "powertrain" | "aero" | "electrical" | "common";
export type VehicleStatus = "planning" | "active" | "archived";
export type ManufacturingStatus =
  | "designing"
  | "ready_for_manufacturing"
  | "manufacturing"
  | "inspection"
  | "assembly"
  | "completed";
export type InventoryMovementType = "in" | "out" | "adjustment" | "transfer" | "work_journal_consumption";
export type InventoryItemStatus = "in_stock" | "low_stock" | "out_of_stock" | "discontinued";
export type InventoryCategory = "fastener" | "consumable" | "electrical";
export type AssetCondition = "excellent" | "good" | "fair" | "poor" | "out_of_service";
export type PurchasePriority = "low" | "normal" | "high" | "urgent";
export type PurchaseStatus = "draft" | "pending_approval" | "approved" | "rejected" | "purchased" | "cancelled";
export type PurchaseTimelineEvent =
  | "created"
  | "submitted"
  | "approved"
  | "rejected"
  | "purchased"
  | "cancelled"
  | "receipt_updated";
export type AnnualPlanStatus = "planning" | "active" | "completed" | "archived";
export type MilestoneStatus = "planned" | "completed";
export type DocumentCategory = "rules" | "design_report" | "cost_report" | "ses" | "team_documents" | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          student_id: string | null;
          phone: string | null;
          department: string | null;
          bom_category: BomCategory | null;
          is_treasurer: boolean;
          is_team_leader: boolean;
          joined_at: string;
          status: MemberStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          student_id?: string | null;
          phone?: string | null;
          department?: string | null;
          bom_category?: BomCategory | null;
          is_treasurer?: boolean;
          is_team_leader?: boolean;
          joined_at?: string;
          status?: MemberStatus;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          student_id?: string | null;
          phone?: string | null;
          department?: string | null;
          bom_category?: BomCategory | null;
          is_treasurer?: boolean;
          is_team_leader?: boolean;
          joined_at?: string;
          status?: MemberStatus;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          vehicle_name: string;
          competition_year: number;
          status: VehicleStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          vehicle_name: string;
          competition_year: number;
          status?: VehicleStatus;
        };
        Update: {
          vehicle_name?: string;
          competition_year?: number;
          status?: VehicleStatus;
        };
        Relationships: [];
      };
      engineering_categories: {
        Row: {
          id: string;
          vehicle_id: string;
          name: BomCategory;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      subsystems: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          name: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      assemblies: {
        Row: {
          id: string;
          subsystem_id: string;
          name: string;
          description: string | null;
          revision: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          subsystem_id: string;
          name: string;
          description?: string | null;
          revision?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          revision?: string;
        };
        Relationships: [];
      };
      bom_parts: {
        Row: {
          id: string;
          assembly_id: string;
          part_number: string;
          part_name: string;
          revision: string;
          material: string | null;
          weight: number | null;
          manufacturing_status: ManufacturingStatus;
          owner_id: string | null;
          supplier: string | null;
          description: string | null;
          inventory_item_id: string | null;
          asset_id: string | null;
          material_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          assembly_id: string;
          part_number: string;
          part_name: string;
          revision?: string;
          material?: string | null;
          weight?: number | null;
          manufacturing_status?: ManufacturingStatus;
          owner_id?: string | null;
          supplier?: string | null;
          description?: string | null;
          inventory_item_id?: string | null;
          asset_id?: string | null;
          material_quantity?: number;
        };
        Update: {
          assembly_id?: string;
          part_number?: string;
          part_name?: string;
          revision?: string;
          material?: string | null;
          weight?: number | null;
          manufacturing_status?: ManufacturingStatus;
          owner_id?: string | null;
          supplier?: string | null;
          description?: string | null;
          inventory_item_id?: string | null;
          asset_id?: string | null;
          material_quantity?: number;
        };
        Relationships: [];
      };
      bom_part_revisions: {
        Row: {
          id: string;
          part_id: string;
          part_number: string;
          part_name: string;
          assembly_id: string;
          revision: string;
          material: string | null;
          weight: number | null;
          manufacturing_status: ManufacturingStatus;
          owner_id: string | null;
          supplier: string | null;
          description: string | null;
          recorded_at: string;
          recorded_by: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      part_files: {
        Row: {
          id: string;
          part_id: string;
          lineage_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          version: number;
          is_current: boolean;
          external_url: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          item_code: string;
          item_name: string;
          category: InventoryCategory;
          manufacturer: string | null;
          supplier: string | null;
          description: string | null;
          current_quantity: number;
          minimum_quantity: number;
          unit: string;
          storage_location: string | null;
          unit_cost: number | null;
          total_asset_value: number;
          status: InventoryItemStatus;
          related_part_id: string | null;
          owning_department: string | null;
          source_purchase_request_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          item_code: string;
          item_name: string;
          category: InventoryCategory;
          manufacturer?: string | null;
          supplier?: string | null;
          description?: string | null;
          current_quantity?: number;
          minimum_quantity?: number;
          unit?: string;
          storage_location?: string | null;
          unit_cost?: number | null;
          related_part_id?: string | null;
          owning_department?: string | null;
          source_purchase_request_id?: string | null;
        };
        Update: {
          item_code?: string;
          item_name?: string;
          category?: InventoryCategory;
          manufacturer?: string | null;
          supplier?: string | null;
          description?: string | null;
          minimum_quantity?: number;
          unit?: string;
          storage_location?: string | null;
          unit_cost?: number | null;
          status?: InventoryItemStatus;
          related_part_id?: string | null;
          owning_department?: string | null;
        };
        Relationships: [];
      };
      inventory_movements: {
        Row: {
          id: string;
          inventory_item_id: string;
          movement_type: InventoryMovementType;
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          reason: string | null;
          performed_by: string | null;
          reference_type: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          asset_number: string;
          asset_name: string;
          engineering_category: BomCategory | null;
          description: string | null;
          current_condition: AssetCondition;
          purchase_date: string | null;
          purchase_cost: number | null;
          assigned_to: string | null;
          notes: string | null;
          source_purchase_request_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          asset_number: string;
          asset_name: string;
          engineering_category?: BomCategory | null;
          description?: string | null;
          current_condition?: AssetCondition;
          purchase_date?: string | null;
          purchase_cost?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
          source_purchase_request_id?: string | null;
        };
        Update: {
          asset_number?: string;
          asset_name?: string;
          engineering_category?: BomCategory | null;
          description?: string | null;
          current_condition?: AssetCondition;
          purchase_date?: string | null;
          purchase_cost?: number | null;
          assigned_to?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      fasteners: {
        Row: {
          id: string;
          name: string;
          spec: string | null;
          unit_cost: number | null;
          supplier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          spec?: string | null;
          unit_cost?: number | null;
          supplier?: string | null;
        };
        Update: {
          name?: string;
          spec?: string | null;
          unit_cost?: number | null;
          supplier?: string | null;
        };
        Relationships: [];
      };
      assembly_fasteners: {
        Row: {
          id: string;
          assembly_id: string;
          fastener_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          assembly_id: string;
          fastener_id: string;
          quantity?: number;
        };
        Update: {
          quantity?: number;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          vehicle_id: string;
          category_id: string | null;
          allocated_budget: number;
          used_budget: number;
          remaining_budget: number;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: {
          allocated_budget?: number;
        };
        Relationships: [];
      };
      purchase_requests: {
        Row: {
          id: string;
          request_number: string;
          title: string;
          description: string | null;
          vehicle_id: string;
          category_id: string;
          subsystem_id: string | null;
          assembly_id: string | null;
          part_id: string | null;
          supplier: string | null;
          product_url: string | null;
          quantity: number;
          estimated_cost: number;
          final_cost: number | null;
          priority: PurchasePriority;
          status: PurchaseStatus;
          requested_by: string;
          approved_by: string | null;
          purchased_by: string | null;
          receipt_file: string | null;
          purchase_notes: string | null;
          requested_at: string;
          approved_at: string | null;
          purchased_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          vehicle_id: string;
          category_id: string;
          subsystem_id?: string | null;
          assembly_id?: string | null;
          part_id?: string | null;
          supplier?: string | null;
          product_url?: string | null;
          quantity?: number;
          estimated_cost?: number;
          priority?: PurchasePriority;
          status?: PurchaseStatus;
          requested_by: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          vehicle_id?: string;
          category_id?: string;
          subsystem_id?: string | null;
          assembly_id?: string | null;
          part_id?: string | null;
          supplier?: string | null;
          product_url?: string | null;
          quantity?: number;
          estimated_cost?: number;
          final_cost?: number | null;
          priority?: PurchasePriority;
          status?: PurchaseStatus;
          approved_by?: string | null;
          purchased_by?: string | null;
          receipt_file?: string | null;
          purchase_notes?: string | null;
          approved_at?: string | null;
          purchased_at?: string | null;
        };
        Relationships: [];
      };
      purchase_request_files: {
        Row: {
          id: string;
          purchase_request_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          uploaded_by: string | null;
          uploaded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          purchase_request_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          uploaded_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      purchase_timeline: {
        Row: {
          id: string;
          purchase_request_id: string;
          event_type: PurchaseTimelineEvent;
          note: string | null;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          purchase_request_id: string;
          event_type: PurchaseTimelineEvent;
          note?: string | null;
          actor_id?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      annual_plans: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          season: number;
          start_date: string;
          end_date: string;
          status: AnnualPlanStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          season: number;
          start_date: string;
          end_date: string;
          status?: AnnualPlanStatus;
          created_by?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          season?: number;
          start_date?: string;
          end_date?: string;
          status?: AnnualPlanStatus;
        };
        Relationships: [];
      };
      milestones: {
        Row: {
          id: string;
          annual_plan_id: string;
          title: string;
          description: string | null;
          due_date: string;
          status: MilestoneStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          annual_plan_id: string;
          title: string;
          description?: string | null;
          due_date: string;
          status?: MilestoneStatus;
          created_by?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          due_date?: string;
          status?: MilestoneStatus;
        };
        Relationships: [];
      };
      assembly_files: {
        Row: {
          id: string;
          assembly_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          external_url: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          assembly_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          uploaded_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      general_documents: {
        Row: {
          id: string;
          category: DocumentCategory;
          title: string;
          description: string | null;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          external_url: string | null;
          uploaded_by: string | null;
          uploaded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          category?: DocumentCategory;
          title: string;
          description?: string | null;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          uploaded_by?: string | null;
        };
        Update: {
          category?: DocumentCategory;
          title?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      design_journals: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string;
          vehicle_id: string;
          engineering_category: BomCategory;
          subsystem_id: string | null;
          assembly_id: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          content?: string;
          author_id: string;
          vehicle_id: string;
          engineering_category: BomCategory;
          subsystem_id?: string | null;
          assembly_id?: string | null;
          tags?: string[];
        };
        Update: {
          title?: string;
          content?: string;
          vehicle_id?: string;
          engineering_category?: BomCategory;
          subsystem_id?: string | null;
          assembly_id?: string | null;
          tags?: string[];
        };
        Relationships: [];
      };
      design_journal_files: {
        Row: {
          id: string;
          journal_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          storage_provider: string;
          file_size: number;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          journal_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          storage_provider?: string;
          file_size: number;
          uploaded_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      work_journals: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string;
          vehicle_id: string;
          engineering_category: BomCategory;
          subsystem_id: string | null;
          assembly_id: string | null;
          work_start: string;
          work_end: string;
          total_work_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          content?: string;
          author_id: string;
          vehicle_id: string;
          engineering_category: BomCategory;
          subsystem_id?: string | null;
          assembly_id?: string | null;
          work_start: string;
          work_end: string;
        };
        Update: {
          title?: string;
          content?: string;
          vehicle_id?: string;
          engineering_category?: BomCategory;
          subsystem_id?: string | null;
          assembly_id?: string | null;
          work_start?: string;
          work_end?: string;
        };
        Relationships: [];
      };
      work_journal_participants: {
        Row: {
          id: string;
          journal_id: string;
          member_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          journal_id: string;
          member_id: string;
        };
        Update: never;
        Relationships: [];
      };
      work_journal_files: {
        Row: {
          id: string;
          journal_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          storage_provider: string;
          file_size: number;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          journal_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          storage_provider?: string;
          file_size: number;
          uploaded_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      work_journal_consumables: {
        Row: {
          id: string;
          journal_id: string;
          inventory_item_id: string;
          quantity_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      data_entries: {
        Row: {
          id: string;
          category: string;
          title: string;
          description: string | null;
          related_vehicle_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          title: string;
          description?: string | null;
          related_vehicle_id?: string | null;
          created_by?: string | null;
        };
        Update: {
          category?: string;
          title?: string;
          description?: string | null;
          related_vehicle_id?: string | null;
        };
        Relationships: [];
      };
      data_entry_files: {
        Row: {
          id: string;
          data_entry_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          data_entry_id: string;
          file_name: string;
          file_type: string;
          storage_path: string;
          file_size: number;
          uploaded_by?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_inventory_movement: {
        Args: {
          p_item_id: string;
          p_movement_type: InventoryMovementType;
          p_quantity?: number | null;
          p_reason?: string | null;
          p_new_quantity?: number | null;
          p_new_location?: string | null;
        };
        Returns: Database["public"]["Tables"]["inventory_movements"]["Row"];
      };
      upload_part_file: {
        Args: {
          p_part_id: string;
          p_file_name: string;
          p_file_type: string;
          p_storage_path: string;
          p_file_size: number;
          p_replaces_file_id?: string | null;
        };
        Returns: Database["public"]["Tables"]["part_files"]["Row"];
      };
      record_work_journal_consumables: {
        Args: {
          p_journal_id: string;
          p_items: { item_id: string; quantity: number }[];
        };
        Returns: void;
      };
      update_work_journal_consumables: {
        Args: {
          p_journal_id: string;
          p_items: { item_id: string; quantity: number }[];
        };
        Returns: void;
      };
    };
    Enums: {
      user_role: UserRole;
      member_status: MemberStatus;
      bom_category: BomCategory;
      vehicle_status: VehicleStatus;
      manufacturing_status: ManufacturingStatus;
      inventory_movement_type: InventoryMovementType;
      purchase_priority: PurchasePriority;
      purchase_status: PurchaseStatus;
      purchase_timeline_event: PurchaseTimelineEvent;
      annual_plan_status: AnnualPlanStatus;
      milestone_status: MilestoneStatus;
      document_category: DocumentCategory;
      inventory_category: InventoryCategory;
    };
    CompositeTypes: Record<string, never>;
  };
}
