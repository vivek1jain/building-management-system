// User roles and types
export type UserRole = 'admin' | 'manager' | 'finance' | 'supplier' | 'requester' | 'client' | 'vendor' | 'resident' | 'tenant';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Person Management (from studio-master)
export enum PersonStatus {
  OWNER = "Owner",
  TENANT = "Tenant", 
  RESIDENT = "Resident",
  MANAGER = "Manager",
  PROSPECT = "Prospect",
  ARCHIVED = "Archived",
  PENDING_APPROVAL = "Pending Approval",
}

export interface Person {
  id: string;
  uid?: string;
  name: string;
  buildingId: string | null;
  accessibleBuildingIds?: string[] | null;
  flatId: string | null;
  flatNumber?: string | null;
  role?: UserRole;
  status: PersonStatus;
  email?: string;
  phone?: string;
  isPrimaryContact?: boolean;
  moveInDate?: Date | null;
  moveOutDate?: Date | null;
  notes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  createdByUid: string;
  updatedByUid?: string;
}

// Flat Management System
export interface Flat {
  id: string;
  flatNumber: string;
  buildingId: string;
  floor?: number;
  buildingBlock?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  groundRent?: number | null;
  status?: string;
  currentRent?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Asset Management
export enum AssetStatus {
  OPERATIONAL = "Operational",
  NEEDS_REPAIR = "Needs Repair", 
  IN_REPAIR = "In Repair",
  DECOMMISSIONED = "Decommissioned",
  UNKNOWN = "Unknown",
}

export interface Asset {
  id: string;
  name: string;
  buildingId: string;
  type?: string;
  status: AssetStatus;
  locationDescription?: string;
  flatId?: string | null;
  flatNumber?: string | null;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate?: Date | null;
  installationDate?: Date | null;
  commissionedDate?: Date | null;
  decommissionedDate?: Date | null;
  warrantyExpiryDate?: Date | null;
  nextServiceDate?: Date | null;
  supplierId?: string | null;
  supplierName?: string | null;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUid: string;
}

// Enhanced Work Order System
export enum WorkOrderStatus {
  TRIAGE = "Triage",
  QUOTING = "Quoting", 
  AWAITING_USER_FEEDBACK = "With User",
  SCHEDULED = "Scheduled",
  RESOLVED = "Resolved",
  CLOSED = "Closed",
  CANCELLED = "Cancelled",
}

export enum WorkOrderPriority {
  LOW = "Low",
  MEDIUM = "Medium", 
  HIGH = "High",
  URGENT = "Urgent",
}

export enum QuoteRequestStatus {
  PENDING = "Pending",
  RECEIVED = "Received",
  ACCEPTED = "Accepted", 
  REJECTED = "Rejected",
  CANCELLED = "Cancelled"
}

export interface QuoteRequest {
  supplierId: string;
  supplierName: string;
  sentAt: Date;
  quoteAmount?: number | null;
  quoteDocumentUrl?: string | null;
  notes?: string | null;
  status: QuoteRequestStatus;
  updatedAt?: Date;
}

export interface UserFeedback {
  message: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

export interface LogEntry {
  message: string;
  timestamp: Date;
  authorName: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  createdByUid: string;
  createdByUserEmail: string;
  createdAt: Date;
  updatedAt: Date;
  buildingId: string;
  assignedToUid?: string;
  assignedToUserEmail?: string;
  resolutionNotes?: LogEntry[];
  flatId?: string;
  flatNumber?: string | null;
  assetId?: string;
  supplierId?: string;
  supplierName?: string;
  quotePrice?: number | null;
  cost?: number | null;
  scheduledDate?: Date | null;
  quoteRequests?: QuoteRequest[];
  managerCommunication?: LogEntry[];
  lastStatusChangeByUid?: string;
  resolvedAt?: Date | null;
  userFeedbackLog?: UserFeedback[];
}

// Enhanced Event System
export interface ScheduledEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  buildingId: string;
  contractorName?: string;
  supplierId?: string;
  notes?: string;
  workOrderId?: string;
  flatId?: string;
  assetId?: string;
  assetName?: string;
  createdByUid: string;
  createdAt: Date;
  updatedAt: Date;
  isPrivate?: boolean;
  ownerUid?: string;
}

// Service Charge Management
export enum ServiceChargeDemandStatus {
  DRAFT = "Draft",
  ISSUED = "Issued",
  REMINDER_SENT = "Reminder Sent",
  OVERDUE = "Overdue",
  PARTIALLY_PAID = "Partially Paid",
  PAID = "Paid",
  CANCELLED = "Cancelled",
}

export enum PaymentMethod {
  ONLINE = "Online",
  BANK_TRANSFER = "Bank Transfer",
  CHEQUE = "Cheque",
  CASH = "Cash",
  OTHER = "Other",
}

export interface PaymentRecord {
  paymentId: string;
  paymentDate: Date;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedByUid: string;
  recordedAt: Date;
}

export interface ServiceChargeDemand {
  id: string;
  flatId: string;
  buildingId: string;
  flatNumber: string;
  residentUid?: string;
  residentName?: string;
  financialQuarterDisplayString: string;
  areaSqFt: number;
  rateApplied: number;
  baseAmount: number;
  groundRentAmount?: number;
  penaltyAmountApplied: number;
  totalAmountDue: number;
  amountPaid: number;
  outstandingAmount: number;
  dueDate: Date;
  issuedDate: Date;
  status: ServiceChargeDemandStatus;
  paymentHistory?: PaymentRecord[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  issuedByUid: string;
  penaltyAppliedAt?: Date | null;
  
  // Enhanced features from buildingcharges.md
  invoiceGrouping: 'per_unit' | 'per_resident';
  showBreakdown: boolean;
  chargeBreakdown?: ChargeBreakdownItem[];
  penaltyConfig: PenaltyConfig;
  remindersConfig: ReminderConfig;
  remindersSent: number;
  lastReminderSent?: Date;
}

export interface ChargeBreakdownItem {
  id: string;
  description: string;
  amount: number;
  category: string;
}

export interface PenaltyConfig {
  type: 'flat' | 'percentage' | 'both';
  flatAmount?: number;
  percentage?: number;
  gracePeriodDays: number;
  maxPenaltyAmount?: number;
}

export interface ReminderConfig {
  reminderDays: number[]; // Days relative to due date
  emailTemplate?: string;
  maxReminders: number;
}

// Enhanced Financial Settings
export interface GlobalFinancialSettings {
  serviceChargeRatePerSqFt: number | null;
  paymentDueLeadDays: number | null;
  financialYearStartDate: Date | null;
  reserveFundContributionPercentage?: number | null;
  isBudgetLocked?: boolean;
  reminderPrioritySettings?: { [key in ReminderType]?: ReminderPriority };
}

// Reminder System
export enum ReminderSeverity {
  INFO = "info",
  WARNING = "warning",
  DESTRUCTIVE = "destructive",
}

export enum ReminderPriority {
  HIGH = "High",
  NORMAL = "Normal",
  LOW = "Low",
}

export enum ReminderType {
  LATE_PAYMENT_PENALTY = "Late Payment Penalty",
  USER_FEEDBACK_REQUESTED = "User Feedback Requested",
}

export interface Reminder {
  id: string;
  userId: string;
  buildingId: string;
  title: string;
  description: string;
  link?: string;
  type: ReminderType;
  severity: ReminderSeverity;
  priority: ReminderPriority;
  isDismissed: boolean;
  createdAt: Date;
  relatedDocId?: string;
  relatedCollection?: string;
}

// Enhanced Building Charges - Income Tracking
export interface Income {
  id: string;
  buildingId: string;
  date: Date;
  amount: number;
  source: 'building_charges' | 'penalty' | 'interest' | 'miscellaneous' | 'other';
  description: string;
  relatedInvoiceId?: string;
  recordedByUid: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Building Charges - Expenditure Tracking
export interface Expenditure {
  id: string;
  buildingId: string;
  date: Date;
  amount: number;
  category: 'proactive_maintenance' | 'reactive_maintenance' | 'salary' | 'utility' | 'insurance' | 'cleaning' | 'security' | 'other';
  description: string;
  tag?: 'proactive' | 'reactive'; // For maintenance expenses
  supportingDocumentUrl?: string;
  vendorId?: string;
  vendorName?: string;
  recordedByUid: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enhanced Building Charges - Financial Summary
export interface BuildingFinancialSummary {
  buildingId: string;
  period: string; // e.g., "Q1 2024"
  totalIncome: number;
  totalExpenditure: number;
  netCashFlow: number;
  incomeBreakdown: Record<string, number>; // by source
  expenditureBreakdown: Record<string, number>; // by category
  maintenanceBreakdown: {
    proactive: number;
    reactive: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Ticket status types (keeping existing for compatibility)
export type TicketStatus = 
  | 'New'
  | 'Quote Requested'
  | 'Quote Received'
  | 'PO Sent'
  | 'Contracted'
  | 'Scheduled'
  | 'In Progress'
  | 'Complete'
  | 'Closed';

// Urgency levels
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// Ticket interface (enhanced)
export interface Ticket {
  id: string;
  title: string;
  description: string;
  location: string;
  urgency: UrgencyLevel;
  status: TicketStatus;
  requestedBy: string; // User ID
  assignedTo?: string; // User ID
  attachments: string[]; // File URLs
  activityLog: ActivityLogEntry[];
  quotes: Quote[];
  scheduledDate?: Date;
  completedDate?: Date;
  feedback?: Feedback;
  createdAt: Date;
  updatedAt: Date;
}

// Activity log entry
export interface ActivityLogEntry {
  id: string;
  action: string;
  description: string;
  performedBy: string; // User ID
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Quote interface
export interface Quote {
  id: string;
  supplierId: string; // User ID
  amount: number;
  currency: string;
  description: string;
  terms: string;
  validUntil: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  submittedAt: Date;
  attachments?: string[]; // File URLs
}

// Supplier interface (extends User)
export interface Supplier extends User {
  role: 'supplier';
  companyName: string;
  specialties: string[];
  rating?: number;
  totalJobs?: number;
  isActive: boolean;
}

// Building event interface
export interface BuildingEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  ticketId?: string; // Linked ticket
  assignedTo: string[]; // User IDs
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Feedback interface
export interface Feedback {
  ticketId: string;
  rating: number; // 1-5 stars
  comment?: string;
  submittedBy: string; // User ID
  submittedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedTicketId?: string;
  createdAt: Date;
}

export interface CreateTicketForm {
  title: string;
  description: string;
  location: string;
  urgency: UrgencyLevel;
  attachments: File[];
}

export interface QuoteForm {
  amount: number;
  currency: string;
  description: string;
  terms: string;
  validUntil: Date;
  attachments?: File[];
}

export type BudgetCategory = 
  | 'repairs'
  | 'maintenance'
  | 'sinking'
  | 'capital'
  | 'insurance'
  | 'energy'
  | 'external'
  | 'utilities'
  | 'cleaning'
  | 'security'
  | 'other';

export type BudgetStatus = 'draft' | 'awaiting_approval' | 'approved' | 'rejected' | 'locked';

export enum InvoiceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  QUERIED = 'queried',
  REJECTED = 'rejected'
}

export type PaymentStatus = 'pending' | 'approved' | 'paid' | 'overdue';

export interface Building {
  id: string;
  name: string;
  address: string;
  code: string; // Unique building code
  buildingType: string;
  floors: number;
  units: number;
  capacity: number;
  area: number; // in sq ft/meters
  financialYearStart: Date; // Annual financial month
  managers: string[]; // User IDs
  admins: string[]; // User IDs
  assets: Asset[];
  meters: Meter[];
  totalFloors?: number;
  totalUnits?: number;
  yearBuilt?: number;
  propertyType?: string;
  amenities?: string[];
  managerId?: string;
  contactInfo?: {
    phone: string;
    email: string;
  };
  financialInfo?: {
    serviceChargeRate: number;
    reserveFundBalance: number;
    monthlyExpenses: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Meter {
  id: string;
  buildingId: string;
  unitId?: string;
  type: 'electricity' | 'water' | 'gas' | 'heating' | 'cooling';
  meterNumber: string;
  currentReading: number;
  lastReading: number;
  lastReadingDate: Date;
  threshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  buildingId: string;
  year: number;
  status: BudgetStatus;
  categories: BudgetCategoryItem[];
  totalAmount: number;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  approvedBy?: string; // User ID
  approvedAt?: Date;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCategoryItem {
  id: string;
  budgetId: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  approvalThreshold: number;
  notes?: string;
  attachments: string[]; // File URLs
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  ticketId: string;
  vendorId: string; // User ID
  buildingId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  category: string; // BudgetCategory type
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  dueDate: Date;
  paidDate?: Date;
  description: string;
  attachments: string[]; // File URLs
  approvedBy?: string; // User ID
  approvedAt?: Date;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface Expense {
  id: string;
  buildingId: string;
  budgetId: string;
  categoryId: string;
  ticketId?: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  vendorId?: string; // User ID
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // User ID
  approvedAt?: Date;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalTickets: number;
  ticketsByStatus: Record<TicketStatus, number>;
  upcomingEvents: BuildingEvent[];
  recentActivity: ActivityLogEntry[];
  unreadNotifications: number;
  budgetStats: BudgetStats;
}

export interface BudgetStats {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  budgetUtilization: number; // percentage
  categoryBreakdown: Record<string, { allocated: number; spent: number; remaining: number }>;
  overdueInvoices: number;
  pendingApprovals: number;
}

// Enhanced Dashboard Stats for comprehensive view
export interface ComprehensiveDashboardStats {
  // People stats
  totalResidents: number;
  totalOwners: number;
  totalTenants: number;
  pendingApprovals: number;
  
  // Financial stats
  totalServiceCharges: number;
  totalCollected: number;
  outstandingAmount: number;
  overduePayments: number;
  
  // Work order stats
  totalWorkOrders: number;
  workOrdersByStatus: Record<WorkOrderStatus, number>;
  urgentWorkOrders: number;
  
  // Building stats
  totalFlats: number;
  occupiedFlats: number;
  totalAssets: number;
  assetsNeedingRepair: number;
  
  // Event stats
  upcomingEvents: number;
  todayEvents: number;
  
  // Reminder stats
  activeReminders: number;
  highPriorityReminders: number;
} 