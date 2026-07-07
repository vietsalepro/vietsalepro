// ============================================================
// ANNOUNCEMENT TYPES — P12.1
// ============================================================

export type AnnouncementStatus = 'draft' | 'scheduled' | 'active' | 'archived';
export type AnnouncementTargetType = 'all' | 'specific_tenants' | 'specific_plans';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetType: AnnouncementTargetType;
  targets?: string[];
  status: AnnouncementStatus;
  scheduledAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  targetType?: AnnouncementTargetType;
  targets?: string[];
  status?: AnnouncementStatus;
  scheduledAt?: string | null;
  expiresAt?: string | null;
}

export type UpdateAnnouncementInput = Partial<
  Pick<
    Announcement,
    | 'title'
    | 'content'
    | 'targetType'
    | 'targets'
    | 'status'
  >
> & {
  scheduledAt?: string | null;
  expiresAt?: string | null;
};

export interface AnnouncementListFilters {
  status?: AnnouncementStatus;
  targetType?: AnnouncementTargetType;
  searchTerm?: string;
}
