// ============================================================
// EMAIL TEMPLATE TYPES — P12.2
// ============================================================

export interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  description?: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmailTemplateInput {
  key: string;
  name: string;
  description?: string;
  subject: string;
  bodyHtml: string;
  variables?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

export type UpdateEmailTemplateInput = Partial<
  Pick<
    EmailTemplate,
    | 'name'
    | 'description'
    | 'subject'
    | 'bodyHtml'
    | 'variables'
    | 'isDefault'
    | 'isActive'
  >
>;

export interface EmailBrandConfig {
  logoUrl: string;
  brandColor: string;
  signatureHtml: string;
  fromName: string;
}

export interface SendTemplateEmailInput {
  templateKey: string;
  to: string | string[];
  variables?: Record<string, string>;
  test?: boolean;
}

export interface SendTemplateEmailResult {
  success: boolean;
  id: string | null;
  to: string[];
  templateKey: string;
  subject: string;
  test: boolean;
}
