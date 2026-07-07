import { supabase } from '../lib/supabase';
import {
  Announcement,
  AnnouncementStatus,
  AnnouncementTargetType,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementListFilters,
} from '../types/announcement';

const mapAnnouncementFromDB = (row: any): Announcement => ({
  id: row.id,
  title: row.title,
  content: row.content,
  targetType: row.target_type,
  targets: row.targets ? Array.from(row.targets) : undefined,
  status: row.status,
  scheduledAt: row.scheduled_at,
  publishedAt: row.published_at,
  expiresAt: row.expires_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// --- announcements CRUD (system admin) ---

export async function getAnnouncements(
  filters: AnnouncementListFilters = {}
): Promise<Announcement[]> {
  let query = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.targetType) {
    query = query.eq('target_type', filters.targetType);
  }
  if (filters.searchTerm) {
    query = query.ilike('title', `%${filters.searchTerm}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapAnnouncementFromDB);
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapAnnouncementFromDB(data) : null;
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
  const insert: Record<string, any> = {
    title: input.title,
    content: input.content,
    target_type: input.targetType ?? 'all',
    targets: input.targets && input.targets.length > 0 ? input.targets : null,
    status: input.status ?? 'draft',
  };
  if (input.scheduledAt !== undefined) insert.scheduled_at = input.scheduledAt;
  if (input.expiresAt !== undefined) insert.expires_at = input.expiresAt;

  const { data, error } = await supabase
    .from('announcements')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return mapAnnouncementFromDB(data);
}

export async function updateAnnouncement(
  id: string,
  input: UpdateAnnouncementInput
): Promise<Announcement> {
  const update: Record<string, any> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.content !== undefined) update.content = input.content;
  if (input.targetType !== undefined) update.target_type = input.targetType;
  if (input.targets !== undefined) update.targets = input.targets && input.targets.length > 0 ? input.targets : null;
  if (input.status !== undefined) update.status = input.status;
  if (input.scheduledAt !== undefined) update.scheduled_at = input.scheduledAt;
  if (input.expiresAt !== undefined) update.expires_at = input.expiresAt;

  const { data, error } = await supabase
    .from('announcements')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapAnnouncementFromDB(data);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}

// --- tenant-facing API ---

export async function getCurrentAnnouncementsForTenant(tenantId: string): Promise<Announcement[]> {
  const { data, error } = await supabase.rpc('get_current_announcements_for_tenant', {
    p_tenant_id: tenantId,
  });
  if (error) throw error;
  return (data || []).map(mapAnnouncementFromDB);
}

// --- helpers ---

export const announcementStatusLabel = (status: AnnouncementStatus) => {
  switch (status) {
    case 'draft': return 'Bản nháp';
    case 'scheduled': return 'Đã lên lịch';
    case 'active': return 'Đang hiển thị';
    case 'archived': return 'Đã lưu trữ';
    default: return status;
  }
};

export const announcementTargetTypeLabel = (type: AnnouncementTargetType) => {
  switch (type) {
    case 'all': return 'Tất cả';
    case 'specific_tenants': return 'Tenant cụ thể';
    case 'specific_plans': return 'Gói cụ thể';
    default: return type;
  }
};

export const todayStr = () => new Date().toISOString().slice(0, 10);
