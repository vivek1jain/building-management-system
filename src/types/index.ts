// User roles and types
export type UserRole = 'manager' | 'supplier' | 'requester' | 'client';

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

// Ticket status types
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

// Ticket interface
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
  id: string;
  ticketId: string;
  rating: number; // 1-5 stars
  comment?: string;
  submittedBy: string; // User ID
  submittedAt: Date;
}

// Notification interface
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

// Form data interfaces
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

// Dashboard statistics
export interface DashboardStats {
  totalTickets: number;
  ticketsByStatus: Record<TicketStatus, number>;
  upcomingEvents: BuildingEvent[];
  recentActivity: ActivityLogEntry[];
  unreadNotifications: number;
} 