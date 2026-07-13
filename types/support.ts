// ============================================================
// SUPPORT TICKET TYPES — P11.1
// ============================================================

export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_customer'
  | 'resolved'
  | 'closed';

export type SupportTicketCategory =
  | 'bug'
  | 'billing'
  | 'support'
  | 'feature_request';

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  tenantId: string;
  createdBy?: string;
  title: string;
  description?: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assignedTo?: string;
  resolvedAt?: string;
  closedAt?: string;
  slaTargetAt?: string;
  createdAt?: string;
  updatedAt?: string;
  replyCount?: number;
}

export interface CreateSupportTicketInput {
  tenantId: string;
  title: string;
  description?: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
  createdBy?: string;
}

export type UpdateSupportTicketInput = Partial<
  Pick<
    SupportTicket,
    | 'title'
    | 'description'
    | 'category'
    | 'status'
    | 'priority'
    | 'assignedTo'
    | 'resolvedAt'
    | 'closedAt'
    | 'slaTargetAt'
  >
>;

export interface TicketReply {
  id: string;
  ticketId: string;
  tenantId: string;
  createdBy?: string;
  isInternalNote: boolean;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketReplyInput {
  ticketId: string;
  content: string;
  isInternalNote?: boolean;
  createdBy?: string;
}

export type UpdateTicketReplyInput = Partial<Pick<TicketReply, 'content'>>;

export interface TicketReplyTemplate {
  id: string;
  title: string;
  category?: SupportTicketCategory;
  content: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketReplyTemplateInput {
  title: string;
  category?: SupportTicketCategory;
  content: string;
  isActive?: boolean;
}

export type UpdateTicketReplyTemplateInput = Partial<
  Pick<TicketReplyTemplate, 'title' | 'category' | 'content' | 'isActive'>
>;

export interface SupportTicketListFilters {
  tenantId?: string;
  status?: SupportTicketStatus;
  category?: SupportTicketCategory;
  assignedTo?: string;
  searchTerm?: string;
}
