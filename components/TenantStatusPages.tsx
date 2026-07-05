import React from 'react';

export function TenantNotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-lg text-gray-600 mb-6">Cửa hàng không tồn tại.</p>
        <a
          href="https://vietsalepro.com"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          Quay về trang chủ
        </a>
      </div>
    </div>
  );
}

export function TenantSuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Tài khoản đã bị tạm dừng</h1>
        <p className="text-gray-600">
          Tài khoản cửa hàng này đã bị tạm dừng. Vui lòng liên hệ quản trị viên để được hỗ trợ.
        </p>
      </div>
    </div>
  );
}

export function TenantForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
        <p className="text-gray-600">Bạn không có quyền truy cập cửa hàng này.</p>
      </div>
    </div>
  );
}
