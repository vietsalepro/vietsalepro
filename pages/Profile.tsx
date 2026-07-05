import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon, Pencil, Save, X, StickyNote } from 'lucide-react';
import { PageLayout } from '../components/shared/PageLayout';
import './Profile.css';

interface ProfileData {
  displayName: string;
  username: string;
  role: string;
  phone: string;
  email: string;
  birthday: string;
  address: string;
  note: string;
}

const STORAGE_KEY = 'user_profile';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  const defaultProfile: ProfileData = {
    displayName: '',
    username: user?.email?.split('@')[0] || 'admin',
    role: 'Admin',
    phone: '',
    email: user?.email || '',
    birthday: '',
    address: '',
    note: ''
  };

  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(defaultProfile);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...defaultProfile, ...parsed, email: user?.email || parsed.email };
        setProfile(merged);
        setDraft(merged);
      }
    } catch (e) {

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleEdit = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setIsEditing(false);
  };

  const field = (label: string, value: string, placeholder = 'Chưa cập nhật') => (
    <div className="profile-field">
      <p className="profile-field__label">{label}</p>
      <p className="profile-field__value">{value || <span className="profile-field__placeholder">{placeholder}</span>}</p>
    </div>
  );

  const input = (label: string, key: keyof ProfileData, type = 'text') => (
    <div className="profile-input-group">
      <label className="profile-input-group__label">{label}</label>
      <input
        type={type}
        className="profile-input"
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <PageLayout>
      <div className="profile-page">
        <h2 className="profile-page__title">Tài khoản</h2>

      <div className="profile-card">
        <div className="profile-card__header">
          <h3 className="profile-card__heading">
            <UserIcon className="w-5 h-5 profile-card__heading-icon" />
            Thông tin người dùng
          </h3>
          {!isEditing ? (
            <button onClick={handleEdit} className="profile-btn profile-btn--edit">
              <Pencil className="w-4 h-4" /> Chỉnh sửa
            </button>
          ) : (
            <div className="profile-header-actions">
              <button onClick={handleCancel} className="profile-btn profile-btn--cancel">
                <X className="w-4 h-4" /> Huỷ
              </button>
              <button onClick={handleSave} className="profile-btn profile-btn--save">
                <Save className="w-4 h-4" /> Lưu
              </button>
            </div>
          )}
        </div>

        <div className="profile-card__body">
          {!isEditing ? (
            <>
              <div className="profile-fields-grid">
                {field('Tên hiển thị', profile.displayName)}
                {field('Tên đăng nhập', profile.username)}
                {field('Vai trò', profile.role)}
                {field('Điện thoại', profile.phone)}
                {field('Email', profile.email)}
                {field('Sinh nhật', profile.birthday)}
              </div>
              <div className="profile-field__address-wrap">
                {field('Địa chỉ', profile.address)}
              </div>
              <div className="profile-note-row">
                <StickyNote className="w-4 h-4" />
                {profile.note ? <span className="profile-note-row__text">{profile.note}</span> : 'Chưa có ghi chú'}
              </div>
            </>
          ) : (
            <div className="profile-edit-form">
              <div className="profile-fields-grid">
                {input('Tên hiển thị', 'displayName')}
                {input('Tên đăng nhập', 'username')}
                {input('Vai trò', 'role')}
                {input('Điện thoại', 'phone')}
                {input('Email', 'email', 'email')}
                {input('Sinh nhật', 'birthday')}
              </div>
              {input('Địa chỉ', 'address')}
              <div className="profile-input-group">
                <label className="profile-input-group__label">Ghi chú</label>
                <textarea
                  className="profile-textarea"
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  placeholder="Thêm ghi chú..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </PageLayout>
  );
};
