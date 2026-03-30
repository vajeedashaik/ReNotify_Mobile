export interface Bill {
  id: string;
  user_id: string;
  file_url?: string;
  original_filename?: string;
  vendor_name?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  amc_renewal_date?: string;
  service_due_date?: string;
  extracted_text?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  bill_id: string;
  user_id: string;
  reminder_type: 'warranty' | 'amc' | 'service';
  remind_at: string;
  is_sent: boolean;
  push_token?: string;
  created_at: string;
}

export interface ExtractedBillData {
  vendorName?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  amcRenewalDate?: string;
  serviceDueDate?: string;
  rawText?: string;
}

export interface DashboardStats {
  totalBills: number;
  activeReminders: number;
  expiringSoon: number;
  expired: number;
}

export type ReminderType = 'warranty' | 'amc' | 'service';

export type UrgencyLevel = 'safe' | 'warning' | 'danger' | 'expired';
