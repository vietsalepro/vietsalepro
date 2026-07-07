import { supabase } from '../lib/supabase';
import {
  SupportTicket,
  TicketReply,
  TicketReplyTemplate,
  CreateSupportTicketInput,
  UpdateSupportTicketInput,
  CreateTicketReplyInput,
  UpdateTicketReplyInput,
  CreateTicketReplyTemplateInput,
  UpdateTicketReplyTemplateInput,
  SupportTicketListFilters,
} from '../types/support';

const mapSupportTicketFromDB = (row: any): SupportTicket => ({
  id: row.id,
  tenantId: row.tenant_id,
  createdBy: row.created_by,
  title: row.title,
  description: row.description,
  category: row.category,
  status: row.status,
  priority: row.priority,
  assignedTo: row.assigned_to,
  resolvedAt: row.resolved_at,
  closedAt: row.closed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  replyCount: row.reply_count ? Number(row.reply_count) : undefined,
});

const mapTicketReplyFromDB = (row: any): TicketReply => ({
  id: row.id,
  ticketId: row.ticket_id,
  tenantId: row.tenant_id,
  createdBy: row.created_by,
  isInternalNote: row.is_internal_note ?? false,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTicketReplyTemplateFromDB = (row: any): TicketReplyTemplate => ({
  id: row.id,
  title: row.title,
  category: row.category,
  content: row.content,
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// --- support_tickets CRUD ---

export async function getSupportTickets(
  filters: SupportTicketListFilters = {}
): Promise<SupportTicket[]> {
  let query = supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.tenantId) {
    query = query.eq('tenant_id', filters.tenantId);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters.searchTerm) {
    query = query.ilike('title', `%${filters.searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapSupportTicketFromDB);
}

export async function getSupportTicketById(id: string): Promise<SupportTicket | null> {
  const { data, error } = await supabase.from('support_tickets').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapSupportTicketFromDB(data) : null;
}

export async function getSupportTicketsByTenant(tenantId: string): Promise<SupportTicket[]> {
  return getSupportTickets({ tenantId });
}

export async function getSupportTicketWithReplies(
  id: string
): Promise<{ ticket: SupportTicket; replies: TicketReply[] } | null> {
  const ticket = await getSupportTicketById(id);
  if (!ticket) return null;

  const replies = await getTicketReplies(id);
  return { ticket: { ...ticket, replyCount: replies.length }, replies };
}

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<SupportTicket> {
  const insert: Record<string, any> = {
    tenant_id: input.tenantId,
    title: input.title,
    description: input.description,
    category: input.category ?? 'support',
    priority: input.priority ?? 'medium',
  };
  if (input.createdBy) insert.created_by = input.createdBy;

  const { data, error } = await supabase.from('support_tickets').insert(insert).select().single();
  if (error) throw error;
  return mapSupportTicketFromDB(data);
}

export async function updateSupportTicket(
  id: string,
  input: UpdateSupportTicketInput
): Promise<SupportTicket> {
  const update: Record<string, any> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description;
  if (input.category !== undefined) update.category = input.category;
  if (input.status !== undefined) update.status = input.status;
  if (input.priority !== undefined) update.priority = input.priority;
  if (input.assignedTo !== undefined) update.assigned_to = input.assignedTo;
  if (input.resolvedAt !== undefined) update.resolved_at = input.resolvedAt;
  if (input.closedAt !== undefined) update.closed_at = input.closedAt;

  const { data, error } = await supabase
    .from('support_tickets')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapSupportTicketFromDB(data);
}

export async function deleteSupportTicket(id: string): Promise<void> {
  const { error } = await supabase.from('support_tickets').delete().eq('id', id);
  if (error) throw error;
}

export async function assignSupportTicket(
  id: string,
  assignedTo: string | null
): Promise<SupportTicket> {
  return updateSupportTicket(id, { assignedTo: assignedTo ?? undefined });
}

export async function updateSupportTicketStatus(
  id: string,
  status: SupportTicket['status']
): Promise<SupportTicket> {
  const updates: UpdateSupportTicketInput = { status };
  if (status === 'resolved') updates.resolvedAt = new Date().toISOString();
  if (status === 'closed') updates.closedAt = new Date().toISOString();
  return updateSupportTicket(id, updates);
}

// --- ticket_replies CRUD ---

export async function getTicketReplies(ticketId: string): Promise<TicketReply[]> {
  const { data, error } = await supabase
    .from('ticket_replies')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapTicketReplyFromDB);
}

export async function createTicketReply(input: CreateTicketReplyInput): Promise<TicketReply> {
  const insert: Record<string, any> = {
    ticket_id: input.ticketId,
    content: input.content,
    is_internal_note: input.isInternalNote ?? false,
  };
  if (input.createdBy) insert.created_by = input.createdBy;

  const { data, error } = await supabase.from('ticket_replies').insert(insert).select().single();
  if (error) throw error;
  return mapTicketReplyFromDB(data);
}

export async function updateTicketReply(
  id: string,
  input: UpdateTicketReplyInput
): Promise<TicketReply> {
  const update: Record<string, any> = {};
  if (input.content !== undefined) update.content = input.content;

  const { data, error } = await supabase
    .from('ticket_replies')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapTicketReplyFromDB(data);
}

export async function deleteTicketReply(id: string): Promise<void> {
  const { error } = await supabase.from('ticket_replies').delete().eq('id', id);
  if (error) throw error;
}

// --- ticket_reply_templates CRUD ---

export async function getTicketReplyTemplates(
  filters: { category?: string; activeOnly?: boolean } = {}
): Promise<TicketReplyTemplate[]> {
  let query = supabase.from('ticket_reply_templates').select('*').order('created_at', { ascending: false });
  if (filters.category) {
    query = query.eq('category', filters.category);
  }
  if (filters.activeOnly) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapTicketReplyTemplateFromDB);
}

export async function getTicketReplyTemplateById(id: string): Promise<TicketReplyTemplate | null> {
  const { data, error } = await supabase
    .from('ticket_reply_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapTicketReplyTemplateFromDB(data) : null;
}

export async function createTicketReplyTemplate(
  input: CreateTicketReplyTemplateInput
): Promise<TicketReplyTemplate> {
  const { data, error } = await supabase
    .from('ticket_reply_templates')
    .insert({
      title: input.title,
      category: input.category,
      content: input.content,
      is_active: input.isActive ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTicketReplyTemplateFromDB(data);
}

export async function updateTicketReplyTemplate(
  id: string,
  input: UpdateTicketReplyTemplateInput
): Promise<TicketReplyTemplate> {
  const update: Record<string, any> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.category !== undefined) update.category = input.category;
  if (input.content !== undefined) update.content = input.content;
  if (input.isActive !== undefined) update.is_active = input.isActive;

  const { data, error } = await supabase
    .from('ticket_reply_templates')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapTicketReplyTemplateFromDB(data);
}

export async function deleteTicketReplyTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('ticket_reply_templates').delete().eq('id', id);
  if (error) throw error;
}
