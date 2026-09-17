export type IntakeChannel =
  'Website Form' | 'Direct Phone Call' | 'WhatsApp' | 'Email' | 'Facebook / Social' | 'Walk-ins';

export type PipelineStatus =
  | 'New'
  | 'Contacted'
  | 'Waiting for Response'
  | 'Quote Sent'
  | 'Approved'
  | 'Work in Progress'
  | 'Completed'
  | 'Cancelled';

export type LifecycleMilestone =
  | 'Enquiry Received'
  | 'Customer Contacted'
  | 'Inspection & Quote Provided'
  | 'Work Approved & Executed'
  | 'Handover & Payment Completed';

export type StaffRole = 'Admin' | 'Technician' | 'Front Desk' | 'Billing';

export interface CustomerRecord {
  id: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  regNumber: string;
  vehicleModel: string;
  year: number;
  vin?: string;
  paintCode?: string;
  serviceScope: string;
  channel: IntakeChannel;
  status: PipelineStatus;
  currentMilestone: 1 | 2 | 3 | 4 | 5;
  estimateValue: number;
  assignedTech?: string;
  bay?: string;
  progressPercent: number;
  dueTarget: string;
  photos: string[];
  customNotes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  status: 'Active' | 'On Shift' | 'Off Duty';
  assignedBays?: string[];
  permissions: {
    canManageEnquiries: boolean;
    canEditJobStatus: boolean;
    canViewFinancials: boolean;
    canManageStaff: boolean;
    canIssueInvoices: boolean;
  };
}

export interface DashboardMetrics {
  totalNewEnquiries: number;
  activeJobs: number;
  completedWork: number;
  pendingQuotesValue: number;
  pendingQuotesCount: number;
  bayUtilizationPercent: number;
  monthlyRevenue: number;
  revenueGrowthPercent: number;
}
