import { supabase } from '../lib/supabase';
import { AppError } from '../utils/errors';

export interface TotpEnrollment {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export interface BackupCode {
  id: string;
  createdAt: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  factorId?: string;
  backupCodesRemaining: number;
}

/**
 * Kiểm tra mức độ bảo đảm xác thực hiện tại.
 * Trả về true nếu user đã ở AAL2 (đã qua 2FA).
 */
export async function isMfaRequired(): Promise<{
  required: boolean;
  currentLevel: string;
  nextLevel: string;
}> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw new AppError(error.message, 'MFA_STATUS_ERROR', { originalError: error });
  const currentLevel = data?.currentLevel ?? 'aal1';
  const nextLevel = data?.nextLevel ?? 'aal1';
  return {
    required: currentLevel === 'aal1' && nextLevel === 'aal2',
    currentLevel,
    nextLevel,
  };
}

/**
 * Lấy danh sách TOTP factors đã xác minh của user hiện tại.
 */
export async function getVerifiedTotpFactor(): Promise<{ id: string } | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new AppError(error.message, 'MFA_LIST_ERROR', { originalError: error });
  const totp = (data?.totp || []).find((f: any) => f.status === 'verified');
  return totp ? { id: totp.id } : null;
}

/**
 * Bắt đầu enroll TOTP. Trả về QR code và secret để user quét.
 */
export async function enrollTotp(): Promise<TotpEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Google Authenticator',
  });
  if (error) throw new AppError(error.message, 'MFA_ENROLL_ERROR', { originalError: error });
  const factor = (data as any)?.totp;
  if (!data?.id || !factor?.qr_code) {
    throw new AppError('Không nhận được thông tin TOTP từ Supabase', 'MFA_ENROLL_INVALID');
  }
  return {
    factorId: data.id,
    qrCode: factor.qr_code,
    secret: factor.secret,
    uri: data.totp?.uri ?? '',
  };
}

/**
 * Xác minh factor TOTP vừa enroll. Nếu đúng, factor chuyển sang verified.
 */
export async function verifyTotpEnrollment(factorId: string, code: string): Promise<void> {
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId,
  });
  if (challengeError) {
    throw new AppError(challengeError.message, 'MFA_CHALLENGE_ERROR', { originalError: challengeError });
  }
  const challengeId = (challengeData as any)?.id;
  if (!challengeId) throw new AppError('Không nhận được challenge', 'MFA_CHALLENGE_INVALID');

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code: code.replace(/\s/g, ''),
  });
  if (verifyError) throw new AppError(verifyError.message, 'MFA_VERIFY_ERROR', { originalError: verifyError });
}

/**
 * Tạo backup codes cho user hiện tại.
 */
export async function generateBackupCodes(count = 10): Promise<string[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new AppError('Chưa đăng nhập', 'UNAUTHENTICATED');

  const { data, error } = await supabase.rpc('generate_2fa_backup_codes', {
    p_user_id: userId,
    p_count: count,
  });
  if (error) throw new AppError(error.message, 'BACKUP_CODES_GENERATE_ERROR', { originalError: error });
  return (data?.codes || []) as string[];
}

/**
 * Kiểm tra số backup code còn lại.
 */
export async function getBackupCodesRemaining(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return 0;

  const { data, error } = await supabase.rpc('list_2fa_backup_codes', {
    p_user_id: userId,
  });
  if (error) throw new AppError(error.message, 'BACKUP_CODES_LIST_ERROR', { originalError: error });
  return ((data || []) as BackupCode[]).length;
}

/**
 * Xác minh backup code trong quá trình đăng nhập.
 * ponytail: backup code được verify server-side; nếu đúng, cho phép đăng nhập dù
 * session vẫn ở AAL1 vì Supabase Auth không cấp AAL2 từ static recovery code.
 */
export async function verifyBackupCode(code: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new AppError('Chưa đăng nhập', 'UNAUTHENTICATED');

  const { data, error } = await supabase.rpc('verify_2fa_backup_code', {
    p_user_id: userId,
    p_code: code.replace(/\s/g, '').toUpperCase(),
  });
  if (error) throw new AppError(error.message, 'BACKUP_CODE_VERIFY_ERROR', { originalError: error });
  return !!data?.valid;
}

/**
 * Lấy trạng thái 2FA của user hiện tại.
 */
export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { enabled: false, backupCodesRemaining: 0 };

  const [{ data: enabledData, error: enabledError }, remaining] = await Promise.all([
    supabase.rpc('is_2fa_enabled', { p_user_id: userId }),
    getBackupCodesRemaining().catch(() => 0),
  ]);
  if (enabledError) throw new AppError(enabledError.message, 'MFA_STATUS_ERROR', { originalError: enabledError });

  const factor = await getVerifiedTotpFactor().catch(() => null);
  return {
    enabled: !!enabledData,
    factorId: factor?.id,
    backupCodesRemaining: remaining,
  };
}

/**
 * Tắt 2FA cho user hiện tại (unenroll factor + xóa backup codes).
 */
export async function disableTwoFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new AppError(error.message, 'MFA_UNENROLL_ERROR', { originalError: error });

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (userId) {
    await supabase.rpc('delete_2fa_backup_codes', { p_user_id: userId });
  }
}

/**
 * Xác minh mã TOTP trong quá trình đăng nhập. Trả về session AAL2.
 */
export async function verifyLoginTotp(factorId: string, code: string): Promise<void> {
  const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) {
    throw new AppError(challengeError.message, 'MFA_CHALLENGE_ERROR', { originalError: challengeError });
  }
  const challengeId = (challengeData as any)?.id;
  if (!challengeId) throw new AppError('Không nhận được challenge', 'MFA_CHALLENGE_INVALID');

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code: code.replace(/\s/g, ''),
  });
  if (verifyError) throw new AppError(verifyError.message, 'MFA_VERIFY_ERROR', { originalError: verifyError });
}

/**
 * Manual override: system admin yêu cầu unenroll 2FA của admin khác.
 * Cần >=2 system admin: người gọi và người phê duyệt.
 */
export async function overrideAdmin2FA(
  targetUserId: string,
  approvedByUserId: string
): Promise<{ success: boolean; unenrolledFactorIds: string[] }> {
  const { data, error } = await supabase.functions.invoke<{ success: boolean; unenrolled_factor_ids?: string[]; error?: string }>('admin-2fa-override', {
    body: {
      target_user_id: targetUserId,
      approved_by_user_id: approvedByUserId,
    },
  });
  if (error) throw new AppError(error.message, 'ADMIN_2FA_OVERRIDE_ERROR', { originalError: error });
  if (!data || typeof data !== 'object' || !data.success) {
    throw new AppError(data?.error || 'Phản hồi override 2FA không hợp lệ', 'ADMIN_2FA_OVERRIDE_INVALID');
  }
  return {
    success: data.success,
    unenrolledFactorIds: data.unenrolled_factor_ids || [],
  };
}
