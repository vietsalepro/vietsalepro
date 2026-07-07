import React, { useEffect, useMemo, useState } from 'react';
import {
  Inbox, MessageSquare, Send, User, Search, Plus, X, ChevronLeft, Trash2, Edit2, Save, Mail, Tag, AlertCircle, CheckCircle2, Clock, ArrowRight, FileText, MoreHorizontal, LayoutTemplate, RefreshCw,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../contexts/AuthContext';
import {
  SupportTicket,
  TicketReply,
  TicketReplyTemplate,
  SupportTicketStatus,
  SupportTicketCategory,
  SupportTicketPriority,
  CreateSupportTicketInput,
} from '../types/support';
import {
  getSupportTickets,
  getSupportTicketWithReplies,
  createSupportTicket,
  createTicketReply,
  assignSupportTicket,
  updateSupportTicketStatus,
  updateSupportTicket,
  getTicketReplyTemplates,
  createTicketReplyTemplate,
  updateTicketReplyTemplate,
  deleteTicketReplyTemplate,
  sendTicketUpdateEmail,
} from '../services/ticketService';
import { getAllTenants } from '../services/tenantService';
import { getSystemAdmins } from '../services/systemAdminService';
import { Tenant } from '../types/tenant';

const STATUS_LIST: SupportTicketStatus[] = ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const CATEGORY_LIST: SupportTicketCategory[] = ['bug', 'billing', 'support', 'feature_request'];
const PRIORITY_LIST: SupportTicketPriority[] = ['low', 'medium', 'high', 'urgent'];

const statusLabel = (status?: SupportTicketStatus) => {
  switch (status) {
    case 'open': return 'Mở';
    case 'in_progress': return 'Đang xử lý';
    case 'waiting_customer': return 'Chờ khách';
    case 'resolved': return 'Đã giải quyết';
    case 'closed': return 'Đã đóng';
    default: return status || 'Không xác định';
  }
};

const statusClass = (status?: SupportTicketStatus) => {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-700';
    case 'in_progress': return 'bg-amber-100 text-amber-700';
    case 'waiting_customer': return 'bg-purple-100 text-purple-700';
    case 'resolved': return 'bg-green-100 text-green-700';
    case 'closed': return 'bg-gray-200 text-gray-600';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const categoryLabel = (category?: SupportTicketCategory) => {
  switch (category) {
    case 'bug': return 'Lỗi';
    case 'billing': return 'Thanh toán';
    case 'support': return 'Hỗ trợ';
    case 'feature_request': return 'Yêu cầu tính năng';
    default: return category || 'Không xác định';
  }
};

const priorityLabel = (priority?: SupportTicketPriority) => {
  switch (priority) {
    case 'low': return 'Thấp';
    case 'medium': return 'TB';
    case 'high': return 'Cao';
    case 'urgent': return 'Khẩn';
    default: return priority || 'Không xác định';
  }
};

const priorityClass = (priority?: SupportTicketPriority) => {
  switch (priority) {
    case 'low': return 'bg-gray-100 text-gray-700';
    case 'medium': return 'bg-blue-100 text-blue-700';
    case 'high': return 'bg-amber-100 text-amber-700';
    case 'urgent': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const formatDate = (d?: string) => (d ? new Date(d).toLocaleString('vi-VN') : '-');

export default function TicketInbox() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [admins, setAdmins] = useState<{ userId: string; email?: string }[]>([]);
  const [templates, setTemplates] = useState<TicketReplyTemplate[]>([]);

  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<SupportTicketCategory | ''>('');
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [assignedFilter, setAssignedFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [sendingReply, setSendingReply] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateSupportTicketInput>({
    tenantId: '',
    title: '',
    description: '',
    category: 'support',
    priority: 'medium',
  });
  const [creating, setCreating] = useState(false);

  const [templatePanelOpen, setTemplatePanelOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<Partial<TicketReplyTemplate>>({});
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const tenantById = useMemo(() => {
    const map = new Map<string, Tenant>();
    tenants.forEach(t => map.set(t.id, t));
    return map;
  }, [tenants]);

  const adminById = useMemo(() => {
    const map = new Map<string, { userId: string; email?: string }>();
    admins.forEach(a => map.set(a.userId, a));
    return map;
  }, [admins]);

  const loadTenantsAndAdmins = async () => {
    try {
      const [t, a] = await Promise.all([getAllTenants(), getSystemAdmins()]);
      setTenants(t);
      setAdmins(a);
    } catch (err: any) {
      setError(err?.message || 'Không tải được danh sách cửa hàng / admin');
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        tenantId: tenantFilter || undefined,
        assignedTo: assignedFilter || undefined,
        searchTerm: debouncedSearch || undefined,
      };
      const data = await getSupportTickets(filters);
      setTickets(data);
    } catch (err: any) {
      setError(err?.message || 'Không tải được danh sách ticket');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await getTicketReplyTemplates({ activeOnly: true });
      setTemplates(data);
    } catch (err: any) {
      // best-effort: templates không block inbox
      setTemplates([]);
    }
  };

  useEffect(() => {
    loadTenantsAndAdmins();
    loadTemplates();
  }, []);

  useEffect(() => {
    loadTickets();
    // ponytail: reset selected khi filter thay đổi để tránh stale detail
    setSelectedTicket(null);
    setReplies([]);
  }, [statusFilter, categoryFilter, tenantFilter, assignedFilter, debouncedSearch]);

  const openTicket = async (ticket: SupportTicket) => {
    setDetailLoading(true);
    setError(null);
    try {
      const result = await getSupportTicketWithReplies(ticket.id);
      if (result) {
        setSelectedTicket(result.ticket);
        setReplies(result.replies);
      } else {
        setSelectedTicket(null);
        setReplies([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Không tải được chi tiết ticket');
    } finally {
      setDetailLoading(false);
    }
  };

  const notifyTicketUpdate = async (
    ticketId: string,
    event: 'reply' | 'assigned' | 'status',
    replyId?: string
  ) => {
    try {
      await sendTicketUpdateEmail({ ticketId, event, replyId });
    } catch (err: any) {
      // best-effort: hiển thị nhẹ, không block luồng chính
      setError(prev => prev || `Email thông báo chưa gửi được: ${err?.message || 'lỗi không xác định'}`);
    }
  };

  const handleAssign = async (ticketId: string, adminId: string | '') => {
    setError(null);
    try {
      await assignSupportTicket(ticketId, adminId || null);
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        await openTicket({ ...selectedTicket, assignedTo: adminId || undefined });
      }
      await notifyTicketUpdate(ticketId, 'assigned');
    } catch (err: any) {
      setError(err?.message || 'Gán ticket thất bại');
    }
  };

  const handleStatusChange = async (ticketId: string, status: SupportTicketStatus) => {
    setError(null);
    try {
      await updateSupportTicketStatus(ticketId, status);
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        await openTicket({ ...selectedTicket, status });
      }
      await notifyTicketUpdate(ticketId, 'status');
    } catch (err: any) {
      setError(err?.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handlePriorityChange = async (ticketId: string, priority: SupportTicketPriority) => {
    setError(null);
    try {
      await updateSupportTicket(ticketId, { priority });
      await loadTickets();
      if (selectedTicket?.id === ticketId) {
        await openTicket({ ...selectedTicket, priority });
      }
    } catch (err: any) {
      setError(err?.message || 'Cập nhật ưu tiên thất bại');
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    setSendingReply(true);
    setError(null);
    try {
      const reply = await createTicketReply({
        ticketId: selectedTicket.id,
        content: replyContent.trim(),
        isInternalNote: isInternal,
        createdBy: user?.id,
      });
      setReplyContent('');
      setIsInternal(false);
      setSelectedTemplateId('');
      await openTicket(selectedTicket);
      await loadTickets();
      if (!reply.isInternalNote) {
        await notifyTicketUpdate(selectedTicket.id, 'reply', reply.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Gửi phản hồi thất bại');
    } finally {
      setSendingReply(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    if (!templateId) return;
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    setReplyContent(prev => (prev ? prev + '\n\n' : '') + tpl.content);
    setSelectedTemplateId('');
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.tenantId || !createForm.title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createSupportTicket({
        ...createForm,
        createdBy: user?.id,
      });
      setCreateOpen(false);
      setCreateForm({
        tenantId: '',
        title: '',
        description: '',
        category: 'support',
        priority: 'medium',
      });
      await loadTickets();
    } catch (err: any) {
      setError(err?.message || 'Tạo ticket thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.title?.trim() || !templateForm.content?.trim()) return;
    setSavingTemplate(true);
    try {
      if (editingTemplateId) {
        await updateTicketReplyTemplate(editingTemplateId, {
          title: templateForm.title,
          category: templateForm.category,
          content: templateForm.content,
          isActive: templateForm.isActive,
        });
      } else {
        await createTicketReplyTemplate({
          title: templateForm.title,
          category: templateForm.category,
          content: templateForm.content,
          isActive: templateForm.isActive ?? true,
        });
      }
      setTemplateForm({});
      setEditingTemplateId(null);
      await loadTemplates();
    } catch (err: any) {
      setError(err?.message || 'Lưu mẫu trả lời thất bại');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Xóa mẫu trả lời này?')) return;
    try {
      await deleteTicketReplyTemplate(id);
      await loadTemplates();
    } catch (err: any) {
      setError(err?.message || 'Xóa mẫu thất bại');
    }
  };

  const startEditTemplate = (tpl: TicketReplyTemplate) => {
    setTemplateForm({
      title: tpl.title,
      category: tpl.category,
      content: tpl.content,
      isActive: tpl.isActive,
    });
    setEditingTemplateId(tpl.id);
  };

  const filteredTickets = useMemo(() => tickets, [tickets]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Ticket inbox</h2>
            <p className="text-sm text-gray-600">{tickets.length} ticket</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTemplatePanelOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            <LayoutTemplate className="w-4 h-4" /> Mẫu trả lời
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Tạo ticket
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Tìm kiếm</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SupportTicketStatus | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Phân loại</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as SupportTicketCategory | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {CATEGORY_LIST.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Cửa hàng</label>
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Gán cho</label>
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="__unassigned__">Chưa gán</option>
            {admins.map(a => <option key={a.userId} value={a.userId}>{a.email || a.userId}</option>)}
          </select>
        </div>
        <button
          onClick={loadTickets}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          title="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 font-medium text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Danh sách ticket
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {loading && <p className="p-4 text-gray-600">Đang tải...</p>}
            {!loading && filteredTickets.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                Không có ticket nào.
              </div>
            )}
            {filteredTickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {tenantById.get(ticket.tenantId)?.name || ticket.tenantId}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusClass(ticket.status)}`}>{statusLabel(ticket.status)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${priorityClass(ticket.priority)}`}>{priorityLabel(ticket.priority)}</span>
                  <span className="text-gray-500">{categoryLabel(ticket.category)}</span>
                  <span className="text-gray-400 ml-auto">{formatDate(ticket.createdAt)}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {ticket.assignedTo ? (adminById.get(ticket.assignedTo)?.email || ticket.assignedTo) : 'Chưa gán'}
                  {!!ticket.replyCount && <span className="ml-auto flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {ticket.replyCount}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${selectedTicket ? 'flex' : 'hidden lg:flex'}`}>
          {!selectedTicket ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-3" />
                <p>Chọn một ticket để xem chi tiết</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedTicket.title}</h3>
                  <p className="text-sm text-gray-500">
                    #{selectedTicket.id.slice(0, 8)} · {tenantById.get(selectedTicket.tenantId)?.name || selectedTicket.tenantId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusClass(selectedTicket.status)}`}>{statusLabel(selectedTicket.status)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityClass(selectedTicket.priority)}`}>{priorityLabel(selectedTicket.priority)}</span>
                </div>
              </div>

              {detailLoading ? (
                <div className="flex-1 p-8 text-center text-gray-600">Đang tải...</div>
              ) : (
                <div className="flex-1 overflow-auto p-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Gán cho</label>
                      <select
                        value={selectedTicket.assignedTo || ''}
                        onChange={(e) => handleAssign(selectedTicket.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Chưa gán</option>
                        {admins.map(a => <option key={a.userId} value={a.userId}>{a.email || a.userId}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as SupportTicketStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUS_LIST.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ưu tiên</label>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value as SupportTicketPriority)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PRIORITY_LIST.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-1">Mô tả</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTicket.description || 'Không có mô tả.'}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span><Tag className="w-3 h-3 inline mr-1" />{categoryLabel(selectedTicket.category)}</span>
                      <span><Clock className="w-3 h-3 inline mr-1" />Tạo: {formatDate(selectedTicket.createdAt)}</span>
                      <span><Clock className="w-3 h-3 inline mr-1" />Cập nhật: {formatDate(selectedTicket.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Trao đổi ({replies.length})
                    </h4>
                    {replies.length === 0 && <p className="text-sm text-gray-500">Chưa có phản hồi.</p>}
                    {replies.map(reply => (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-lg border text-sm ${reply.isInternalNote ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-700 flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {reply.createdBy || 'Hệ thống'}
                            {reply.isInternalNote && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">Internal</span>}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Send className="w-4 h-4" /> Trả lời
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => applyTemplate(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Chèn mẫu trả lời...</option>
                          {templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.title}</option>)}
                        </select>
                      </div>
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Nhập nội dung phản hồi..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Ghi chú nội bộ (không gửi email)
                        </label>
                        <button
                          onClick={handleSendReply}
                          disabled={!replyContent.trim() || sendingReply}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                        >
                          {sendingReply ? 'Đang gửi...' : <><Send className="w-4 h-4" /> Gửi phản hồi</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Tạo ticket mới</h3>
              <button onClick={() => setCreateOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cửa hàng <span className="text-red-500">*</span></label>
                <select
                  value={createForm.tenantId}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, tenantId: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn cửa hàng</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tiêu đề <span className="text-red-500">*</span></label>
                <input
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phân loại</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value as SupportTicketCategory }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORY_LIST.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ưu tiên</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value as SupportTicketPriority }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITY_LIST.map(p => <option key={p} value={p}>{priorityLabel(p)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mô tả</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {creating ? 'Đang tạo...' : 'Tạo ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {templatePanelOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Mẫu trả lời</h3>
              <button onClick={() => setTemplatePanelOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-6">
              <form onSubmit={handleSaveTemplate} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={templateForm.title || ''}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Tên mẫu"
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={templateForm.category || ''}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as SupportTicketCategory || undefined }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Phân loại (tùy chọn)</option>
                    {CATEGORY_LIST.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                  </select>
                </div>
                <textarea
                  value={templateForm.content || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Nội dung mẫu"
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={templateForm.isActive ?? true}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Đang sử dụng
                  </label>
                  <div className="flex gap-2">
                    {editingTemplateId && (
                      <button
                        type="button"
                        onClick={() => { setTemplateForm({}); setEditingTemplateId(null); }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingTemplate ? 'Đang lưu...' : <><Save className="w-4 h-4" /> {editingTemplateId ? 'Cập nhật' : 'Thêm mẫu'}</>}
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                {templates.length === 0 && <p className="text-sm text-gray-500">Chưa có mẫu nào.</p>}
                {templates.map(tpl => (
                  <div key={tpl.id} className="p-3 border border-gray-100 rounded-lg flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800">{tpl.title}</p>
                      <p className="text-xs text-gray-500">{tpl.category ? categoryLabel(tpl.category) : 'Chung'} · {tpl.isActive ? 'Đang dùng' : 'Tắt'}</p>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{tpl.content}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditTemplate(tpl)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
