import { supabase } from '../lib/supabase';
import { Integration, Partner } from '../types/tenant';

const mapPartnerFromDB = (row: any): Partner => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  website: row.website,
  contactEmail: row.contactEmail ?? row.contact_email,
  logoUrl: row.logoUrl ?? row.logo_url,
  status: row.status,
  createdBy: row.createdBy ?? row.created_by,
  createdAt: row.createdAt ?? row.created_at,
  updatedAt: row.updatedAt ?? row.updated_at,
});

const mapIntegrationFromDB = (row: any): Integration => ({
  id: row.id,
  partnerId: row.partnerId ?? row.partner_id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  category: row.category,
  status: row.status,
  documentationUrl: row.documentationUrl ?? row.documentation_url,
  partnerName: row.partnerName ?? row.partner_name,
  createdBy: row.createdBy ?? row.created_by,
  createdAt: row.createdAt ?? row.created_at,
  updatedAt: row.updatedAt ?? row.updated_at,
});

export async function getPartners(): Promise<Partner[]> {
  const { data, error } = await supabase.rpc('list_partners');
  if (error) throw error;
  return (data || []).map(mapPartnerFromDB);
}

export async function createPartner(input: {
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  logoUrl?: string;
}): Promise<Partner> {
  const { data, error } = await supabase.rpc('create_partner', {
    p_name: input.name,
    p_slug: input.slug ?? null,
    p_description: input.description ?? null,
    p_website: input.website ?? null,
    p_contact_email: input.contactEmail ?? null,
    p_logo_url: input.logoUrl ?? null,
  });
  if (error) throw error;
  return mapPartnerFromDB(data);
}

export async function updatePartner(
  partnerId: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string;
    website: string;
    contactEmail: string;
    logoUrl: string;
    status: Partner['status'];
  }>
): Promise<Partner> {
  const { data, error } = await supabase.rpc('update_partner', {
    p_partner_id: partnerId,
    p_name: input.name ?? null,
    p_slug: input.slug ?? null,
    p_description: input.description ?? null,
    p_website: input.website ?? null,
    p_contact_email: input.contactEmail ?? null,
    p_logo_url: input.logoUrl ?? null,
    p_status: input.status ?? null,
  });
  if (error) throw error;
  return mapPartnerFromDB(data);
}

export async function deletePartner(partnerId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_partner', { p_partner_id: partnerId });
  if (error) throw error;
}

export async function getIntegrations(): Promise<Integration[]> {
  const { data, error } = await supabase.rpc('list_integrations');
  if (error) throw error;
  return (data || []).map(mapIntegrationFromDB);
}

export async function createIntegration(input: {
  partnerId?: string;
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  status?: Integration['status'];
  documentationUrl?: string;
}): Promise<Integration> {
  const { data, error } = await supabase.rpc('create_integration', {
    p_partner_id: input.partnerId ?? null,
    p_name: input.name,
    p_slug: input.slug ?? null,
    p_description: input.description ?? null,
    p_category: input.category ?? null,
    p_status: input.status ?? 'active',
    p_documentation_url: input.documentationUrl ?? null,
  });
  if (error) throw error;
  return mapIntegrationFromDB(data);
}

export async function updateIntegration(
  integrationId: string,
  input: Partial<{
    partnerId: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    status: Integration['status'];
    documentationUrl: string;
  }>
): Promise<Integration> {
  const { data, error } = await supabase.rpc('update_integration', {
    p_integration_id: integrationId,
    p_partner_id: input.partnerId ?? null,
    p_name: input.name ?? null,
    p_slug: input.slug ?? null,
    p_description: input.description ?? null,
    p_category: input.category ?? null,
    p_status: input.status ?? null,
    p_documentation_url: input.documentationUrl ?? null,
  });
  if (error) throw error;
  return mapIntegrationFromDB(data);
}

export async function deleteIntegration(integrationId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_integration', { p_integration_id: integrationId });
  if (error) throw error;
}
