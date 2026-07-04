import React from 'react';
import { useNewSplitPane } from '../../features';
import { SplitPane } from '../SplitPane';
import './POSLayout.css';

interface POSLayoutProps {
  topNav: React.ReactNode;
  leftContent: React.ReactNode;
  rightSidebar: React.ReactNode;
}

/**
 * POSLayout — Layout chia 2 vùng Left / Right.
 *
 * V2 path (useNewSplitPane = true):
 *   - Sử dụng SplitPane chuẩn, right pane (box khách hàng + thanh toán) cố định 30%,
 *     left pane (sản phẩm + giỏ hàng) chiếm 70% còn lại. Có thể resize divider.
 *   - Tất cả style V2 dùng Design Tokens từ SplitPane.css.
 *
 * Legacy path (useNewSplitPane = false):
 *   - Giữ nguyên grid 1fr 30% như cũ.
 */
export const POSLayout: React.FC<POSLayoutProps> = ({ topNav, leftContent, rightSidebar }) => {
  if (useNewSplitPane) {
    return (
      <div className="pos-layout pos-layout--split-pane">
        <SplitPane
          left={
            <div className="pos-layout__left-pane">
              <div className="pos-layout__top-nav">
                {topNav}
              </div>
              <div className="pos-layout__left-content">
                {leftContent}
              </div>
            </div>
          }
          right={rightSidebar}
          rightPercent={30}
          minRightPercent={25}
          maxRightPercent={50}
        />
      </div>
    );
  }

  // Legacy path — unchanged
  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden">
      <div className="flex-1 min-h-0 p-6 pb-3 overflow-hidden">
        <div
          className="flex-1 min-h-0 h-full pos-legacy-grid"
        >
          {/* LEFT — 1fr */}
          <div className="flex flex-col min-h-0 gap-4">
            <div className="shrink-0">
              {topNav}
            </div>
            <div className="flex-1 min-h-0">
              {leftContent}
            </div>
          </div>

          {/* RIGHT — 30% */}
          <aside className="flex flex-col min-h-0">
            {rightSidebar}
          </aside>
        </div>
      </div>
    </div>
  );
};