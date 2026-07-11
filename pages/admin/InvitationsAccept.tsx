import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  lookupInvitation,
  acceptInvitation,
  LookupInvitationResult,
} from '../../services/admin/memberAdminService';
import { getTenantUrl } from '../../lib/tenant';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Store,
  User,
  ArrowRight,
} from 'lucide-react';

type AcceptState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'alreadyMember' }
  | { kind: 'accepted' }
  | { kind: 'mismatch' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; info: LookupInvitationResult }
  | { kind: 'success'; info: LookupInvitationResult };

function classifyError(error: unknown): Exclude<AcceptState, { kind: 'loading' | 'ready' | 'success' }> {
  const message = error instanceof Error ? error.message : String(error || 'Lỗi không xác định');
  if (message.includes('không tồn tại')) return { kind: 'invalid' };
  if (message.includes('hết hạn')) return { kind: 'expired' };
  if (message.includes('đã là thành viên')) return { kind: 'alreadyMember' };
  if (message.includes('Email đăng nhập không khớp')) return { kind: 'mismatch' };
  if (message.includes('đã được sử dụng') || message.includes('đã bị thu hồi')) {
    return { kind: 'accepted' };
  }
  return { kind: 'error', message };
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: 'Chủ sở hữu',
    admin: 'Quản trị viên',
    cashier: 'Thu ngân',
    inventory_manager: 'Quản lý kho',
    accountant: 'Kế toán',
    viewer: 'Người xem',
    member: 'Thành viên',
  };
  return labels[role] || role;
}

export default function InvitationsAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const token = searchParams.get('token');

  const [state, setState] = useState<AcceptState>({ kind: 'loading' });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setState({ kind: 'invalid' });
      return;
    }
    if (!user) {
      navigate(`/login?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`, {
        replace: true,
      });
      return;
    }

    let cancelled = false;
    lookupInvitation(token)
      .then((info) => {
        if (cancelled) return;
        if (!info) {
          setState({ kind: 'invalid' });
          return;
        }
        if (info.expired) {
          setState({ kind: 'expired' });
          return;
        }
        if (!info.active) {
          setState({ kind: 'accepted' });
          return;
        }
        setState({ kind: 'ready', info });
      })
      .catch((err) => {
        if (!cancelled) setState(classifyError(err));
      });
    return () => { cancelled = true; };
  }, [token, user, authLoading, navigate]);

  const handleAccept = async () => {
    if (!token || state.kind !== 'ready') return;
    setAccepting(true);
    try {
      await acceptInvitation(token);
      setState({ kind: 'success', info: state.info });
    } catch (err) {
      setState(classifyError(err));
    } finally {
      setAccepting(false);
    }
  };

  const redirectToTenant = (info: LookupInvitationResult) => {
    const url = getTenantUrl(info.tenantSubdomain, info.tenantCustomDomain);
    window.location.href = url;
  };

  const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 ${className || ''}`}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8">
        {children}
      </div>
    </div>
  );

  if (state.kind === 'loading' || authLoading) {
    return (
      <Card>
        <div className="flex flex-col items-center py-8 text-slate-600">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p>Đang kiểm tra lời mời...</p>
        </div>
      </Card>
    );
  }

  if (state.kind === 'invalid') {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-4">
          <XCircle className="w-14 h-14 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Lời mời không hợp lệ</h1>
          <p className="text-slate-600">Liên kết bạn truy cập không tồn tại hoặc đã bị xóa.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            Về trang chủ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    );
  }

  if (state.kind === 'expired') {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-4">
          <AlertCircle className="w-14 h-14 text-amber-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Lời mời đã hết hạn</h1>
          <p className="text-slate-600">Liên kết này đã quá thời hạn chấp nhận. Vui lòng yêu cầu người quản trị gửi lại lời mời.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            Về trang chủ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    );
  }

  if (state.kind === 'accepted') {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Lời mời đã được sử dụng</h1>
          <p className="text-slate-600">Lời mời này đã được chấp nhận hoặc thu hồi trước đó.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            Về trang chủ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    );
  }

  if (state.kind === 'mismatch') {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-4">
          <AlertCircle className="w-14 h-14 text-orange-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Email không khớp</h1>
          <p className="text-slate-600">Bạn đã đăng nhập bằng email khác với email được mời. Vui lòng đăng xuất và đăng nhập lại bằng đúng email.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            Về trang chủ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    );
  }

  if (state.kind === 'alreadyMember') {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle className="w-14 h-14 text-blue-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Bạn đã là thành viên</h1>
          <p className="text-slate-600">Tài khoản của bạn đã thuộc cửa hàng này. Không cần chấp nhận lại lời mời.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            Về trang chủ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Card>
    );
  }

  if (state.kind === 'error') {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-4">
          <XCircle className="w-14 h-14 text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Không thể xử lý lời mời</h1>
          <p className="text-slate-600">{state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </Card>
    );
  }

  if (state.kind === 'success') {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Chấp nhận lời mời thành công</h1>
          <p className="text-slate-600 mb-6">
            Bạn đã gia nhập <strong>{state.info.tenantName}</strong> với vai trò{' '}
            <strong>{roleLabel(state.info.role)}</strong>.
          </p>
          <button
            onClick={() => redirectToTenant(state.info)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Vào cửa hàng <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Card>
    );
  }

  const { info } = state;
  return (
    <Card>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Lời mời tham gia</h1>
        <p className="text-sm text-slate-600 mt-1">
          Bạn được mời tham gia quản lý cửa hàng.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
          <Store className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Cửa hàng</p>
            <p className="font-medium text-slate-900">{info.tenantName}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
          <User className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Vai trò</p>
            <p className="font-medium text-slate-900">{roleLabel(info.role)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
          <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Email được mời</p>
            <p className="font-medium text-slate-900">{info.email}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
        >
          Từ chối
        </button>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium inline-flex items-center justify-center gap-2"
        >
          {accepting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              Chấp nhận <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </Card>
  );
}
