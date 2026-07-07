import { supabase } from '../lib/supabase';
import {
  EmailTemplate,
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
  EmailBrandConfig,
  SendTemplateEmailInput,
  SendTemplateEmailResult,
} from '../types/emailTemplate';

const mapTemplateFromDB = (row: any): EmailTemplate => ({
  id: row.id,
  key: row.key,
  name: row.name,
  description: row.description ?? undefined,
  subject: row.subject,
  bodyHtml: row.body_html,
  variables: Array.isArray(row.variables) ? row.variables : [],
  isDefault: !!row.is_default,
  isActive: !!row.is_active,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
});

const mapBrandFromDB = (value: any): EmailBrandConfig => ({
  logoUrl: value?.logo_url ?? '',
  brandColor: value?.brand_color ?? '#2563eb',
  signatureHtml: value?.signature_html ?? 'Trân trọng,<br/>Đội ngũ VietSales Pro',
  fromName: value?.from_name ?? 'VietSales Pro',
});

const brandToDB = (b: EmailBrandConfig) => ({
  logo_url: b.logoUrl,
  brand_color: b.brandColor,
  signature_html: b.signatureHtml,
  from_name: b.fromName,
});

// --- email_templates CRUD (system admin) ---

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapTemplateFromDB);
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? mapTemplateFromDB(data) : null;
}

export async function getEmailTemplateByKey(key: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTemplateFromDB(data) : null;
}

export async function createEmailTemplate(input: CreateEmailTemplateInput): Promise<EmailTemplate> {
  const insert: Record<string, any> = {
    key: input.key.trim().toLowerCase(),
    name: input.name.trim(),
    subject: input.subject,
    body_html: input.bodyHtml,
    variables: input.variables ?? [],
    is_default: input.isDefault ?? false,
    is_active: input.isActive ?? true,
  };
  if (input.description !== undefined) insert.description = input.description;

  const { data, error } = await supabase
    .from('email_templates')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;
  return mapTemplateFromDB(data);
}

export async function updateEmailTemplate(
  id: string,
  input: UpdateEmailTemplateInput
): Promise<EmailTemplate> {
  const update: Record<string, any> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.description !== undefined) update.description = input.description;
  if (input.subject !== undefined) update.subject = input.subject;
  if (input.bodyHtml !== undefined) update.body_html = input.bodyHtml;
  if (input.variables !== undefined) update.variables = input.variables;
  if (input.isDefault !== undefined) update.is_default = input.isDefault;
  if (input.isActive !== undefined) update.is_active = input.isActive;

  const { data, error } = await supabase
    .from('email_templates')
    .update(update)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapTemplateFromDB(data);
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('email_templates').delete().eq('id', id);
  if (error) throw error;
}

// --- brand config (system_settings key 'email_brand') ---

export async function getEmailBrand(): Promise<EmailBrandConfig> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'email_brand')
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return mapBrandFromDB(data?.value || {});
}

export async function updateEmailBrand(config: EmailBrandConfig): Promise<EmailBrandConfig> {
  const { error } = await supabase
    .from('system_settings')
    .upsert(
      { key: 'email_brand', value: brandToDB(config) },
      { onConflict: 'key' }
    );
  if (error) throw error;
  return config;
}

// --- send email via Edge Function ---

export async function sendTemplateEmail(
  input: SendTemplateEmailInput
): Promise<SendTemplateEmailResult> {
  const { data, error } = await supabase.functions.invoke('send-template-email', {
    body: {
      template_key: input.templateKey,
      to: input.to,
      variables: input.variables,
      test: input.test,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return {
    success: !!data?.success,
    id: data?.id ?? null,
    to: data?.to ?? [],
    templateKey: data?.template_key ?? input.templateKey,
    subject: data?.subject ?? '',
    test: !!data?.test,
  };
}
