
import type { Timestamp, FieldValue } from 'firebase/firestore';

export enum UserRole {
  RESIDENT = "Resident",
  MANAGER = "Manager",
  ADMIN = "Admin",
}

export enum PersonStatus {
  OWNER = "Owner",
  TENANT = "Tenant",
  RESIDENT = "Resident",
  MANAGER = "Manager",
  PROSPECT = "Prospect",
  ARCHIVED = "Archived",
  PENDING_APPROVAL = "Pending Approval",
}

export type Building = {
  id: string;
  name: string;
  address: string;
  createdAt: Timestamp;
  createdByUid: string;
};

export type UserProfile = {
  id: string; 
  uid: string;
  email: string | null;
  displayName: string | null; 
  photoURL: string | null;
  role?: UserRole;
  flatId: string | null;
  flatNumber: string | null;
  status: PersonStatus | null; 
  buildingId: string | null;
  accessibleBuildingIds?: string[] | null; 
  name?: string | null; 
  moveInDate?: Timestamp | Date | null; 
};

export type UserApprovalData = {
  name: string; 
  flatId: string | null; 
  status: PersonStatus;
  phone?: string;
  moveInDate?: Date | null; 
  moveOutDate?: Date | null;
  notes?: string;
};


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

export type QuoteRequest = {
  supplierId: string;
  supplierName: string;
  sentAt: Timestamp;
  quoteAmount?: number | null;
  quoteDocumentUrl?: string | null;
  notes?: string | null;
  status: QuoteRequestStatus;
  updatedAt?: Timestamp;
};

export type UserFeedback = {
  message: string;
  timestamp: Timestamp;
  userId: string;
  userName: string; 
};

export type LogEntry = {
    message: string;
    timestamp: Timestamp;
    authorId: string;
    authorName: string;
};

export type WorkOrder = {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  createdByUid: string;
  createdByUserEmail: string;
  createdAt: Timestamp;
  updatedAt: Timestamp | Date;
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
  scheduledDate?: Timestamp | null;
  quoteRequests?: QuoteRequest[];
  managerCommunication?: LogEntry[];
  lastStatusChangeByUid?: string;
  resolvedAt?: Timestamp | null; 
  userFeedbackLog?: UserFeedback[]; 
};

export type ScheduledEvent = {
  id: string;
  title: string;
  start: Timestamp;
  end: Timestamp;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPrivate?: boolean;
  ownerUid?: string;
};

export type CreateScheduledEventData = {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  buildingId: string;
  contractorName?: string | null;
  supplierId?: string | null;
  notes?: string;
  workOrderId?: string;
  flatId?: string | null;
  assetId?: string | null;
  assetName?: string | null;
  isPrivate?: boolean;
  ownerUid?: string;
};

export type UpdateScheduledEventData = Partial<CreateScheduledEventData> & {
  isPrivate?: boolean;
  ownerUid?: string | null;
};

export type Supplier = {
  id: string;
  name: string;
  buildingId: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  specialties?: string[];
  address?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateSupplierData = Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'buildingId'>;
export type UpdateSupplierData = Partial<CreateSupplierData>;


export type Flat = {
  id: string;
  flatNumber: string;
  buildingId: string;
  floor?: number;
  buildingBlock?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  groundRent?: number | null;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateFlatData = Omit<Flat, 'id' | 'createdAt' | 'updatedAt' | 'buildingId'>;
export type UpdateFlatData = Partial<CreateFlatData>;


export enum AssetStatus {
  OPERATIONAL = "Operational",
  NEEDS_REPAIR = "Needs Repair",
  IN_REPAIR = "In Repair",
  DECOMMISSIONED = "Decommissioned",
  UNKNOWN = "Unknown",
}

export type Asset = {
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
  purchaseDate?: Timestamp | Date | null;
  installationDate?: Timestamp | Date | null;
  commissionedDate?: Timestamp | Date | null;
  decommissionedDate?: Timestamp | Date | null;
  warrantyExpiryDate?: Timestamp | Date | null;
  nextServiceDate?: Timestamp | Date | null;
  supplierId?: string | null;
  supplierName?: string | null;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdByUid: string;
};

export type CreateAssetData = Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'buildingId'>;
export type UpdateAssetData = Partial<CreateAssetData>;

export type Person = {
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
  moveInDate?: Timestamp | Date | null;
  moveOutDate?: Timestamp | Date | null;
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  createdByUid: string;
  updatedByUid?: string;
};

export type CreatePersonData = Omit<Person, 'id' | 'uid' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'updatedByUid'>;
export type UpdatePersonData = Partial<Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'updatedByUid' | 'uid'>>;

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

export type PaymentRecord = {
  paymentId: string;
  paymentDate: Timestamp;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  recordedByUid: string;
  recordedAt: Timestamp;
};

export type ServiceChargeDemand = {
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
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  issuedByUid: string;
  penaltyAppliedAt?: Timestamp | null;
};

export interface RecordPaymentInput extends Omit<PaymentRecord, 'paymentId' | 'recordedByUid' | 'recordedAt' | 'paymentDate'> {
  paymentDate: Date;
}

export type BudgetCategory = {
    id: string;
    name: string;
    forecastPercentage: number;
    financialYear: string;
    buildingId: string;
    isArchived?: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type CreateBudgetCategoryData = Omit<BudgetCategory, 'id' | 'createdAt' | 'updatedAt' | 'isArchived' | 'buildingId'>;

export type Expense = {
  id: string;
  description: string;
  buildingId: string;
  amount: number;
  date: Timestamp | Date;
  categoryId: string;
  categoryName: string;
  supplierId?: string;
  supplierName?: string;
  workOrderId?: string;
  notes?: string;
  createdByUid: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateExpenseData = Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'buildingId'>;

export type GlobalFinancialSettings = {
  serviceChargeRatePerSqFt: number | null;
  paymentDueLeadDays: number | null;
  financialYearStartDate: Date | null;
  reserveFundContributionPercentage?: number | null;
  isBudgetLocked?: boolean;
  reminderPrioritySettings?: { [key in ReminderType]?: ReminderPriority };
};

export type FirestoreGlobalFinancialSettings = Omit<GlobalFinancialSettings, 'financialYearStartDate'> & {
  financialYearStartDate: Timestamp | null;
  updatedAt?: FieldValue;
  updatedByUid?: string;
};

export type CreateServiceChargeDemandsInput = {
  buildingId: string;
  flatsToProcess: Flat[]; 
  financialQuarterDisplayString: string;
  financialQuarterStartDate: Date;
  serviceChargeRatePerSqFt: number;
  paymentDueLeadDays: number;
  managerUid: string;
  includeGroundRent: boolean;
};

export type CreateServiceChargeDemandsOutput = {
  success: boolean;
  message: string;
  demandsGenerated: number;
};

export interface FinancialQuarterOption {
  value: string;
  label: string; 
  financialQuarterDisplayString: string; 
  isPast: boolean;
}

export interface FlatWithServiceCharge extends Flat {
  calculatedServiceCharge: number;
}

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

export type Reminder = {
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
  createdAt: Timestamp;
  relatedDocId?: string; 
  relatedCollection?: string;
};

export type CreateBuildingData = Omit<Building, 'id' | 'createdAt' | 'createdByUid'>;
