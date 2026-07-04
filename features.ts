/**
 * ═══════════════════════════════════════════════════════════════
 *  VIETSALE PRO — FEATURE FLAGS
 *  Centralized feature flag configuration for incremental rollout
 *  ═══════════════════════════════════════════════════════════════
 *
 *  Usage:
 *    import { useNewActionButton } from '../features';
 *    if (useNewActionButton) { ... }
 *
 *  Rollback:
 *    Set flag to false → no code changes needed → immediate revert
 */

/** Use the new ActionButton component (PrimaryButton, SecondaryButton, DangerButton, GhostButton) */
export const useNewActionButton: boolean = true;

/** Use the new Input System (TextInput, SelectInput, FormField) */
export const useNewInputSystem: boolean = true;

/** Use the new State Components (LoadingState, EmptyState, ErrorState) */
export const useNewStateComponents: boolean = true;

/** Use the new StatusBadge component with standardized status colors and size variants */
export const useNewStatusBadge: boolean = true;

/** Use the new SectionBox container component (SectionBox, SectionHeader, SectionContent) */
export const useNewSectionBox: boolean = true;

/** Use the new FormField component with SectionBox integration and enhanced CSS organization */
export const useNewFormField: boolean = true;

/** Use the new NotificationSystem component with success/error/warning/info variants and dismiss support */
export const useNewNotificationSystem: boolean = true;

/** Use the new Picker component with dropdown option list, search/filter, and keyboard navigation */
export const useNewPicker: boolean = true;

/** Use the new MasterModal v2 shell with hardened container, overlay, sizing, z-index, animation, and scroll lock */
export const useMasterModalV2: boolean = true;

/** Use the refactored PromotionModal with MasterModal container, ActionButton, and standardized layout */
export const useRefactoredPromotionModal: boolean = true;

/** Use the refactored PayDebtModal with MasterModal container, ActionButton, SectionBox, and standardized layout */
export const useRefactoredPayDebtModal: boolean = true;

/** Use the refactored TaxCalculationModal with MasterModal container, ActionButton, TextInput, SectionBox, and SummaryRow */
export const useRefactoredTaxModal: boolean = true;

/** Use the refactored DisposalDetailModal with MasterModal, SectionBox, ModalInfoGrid, ModalTable, StatusBadge, ActionButton, and SummaryRow */
export const useRefactoredDisposalDetailModal: boolean = true;

/** Use the new DataGrid component with toolbar, sortable headers, pagination, row selection, and state handling */
export const useNewDataGrid: boolean = true;

/** Use the new DataGrid integration on the Inventory page */
export const useNewDataGridInventory: boolean = true;

/** Use the new DataGrid integration on the Inventory Counts tab */
export const useNewDataGridInventoryCounts: boolean = true;

/** Use the new DataGrid integration on the Disposals page */
export const useNewDataGridDisposals: boolean = true;

/** Use the new DataGrid integration on the Orders page */
export const useNewDataGridOrders: boolean = true;

/** Use the new DataGrid integration on the Customers page */
export const useNewDataGridCustomers: boolean = true;

/** Use the new DataGrid integration on the Suppliers page */
export const useNewDataGridSuppliers: boolean = true;

/** Use the new DataGrid integration on the ReturnOrders page */
export const useNewDataGridReturnOrders: boolean = true;

/** Use the new DataGrid integration on the ImportGoods page */
export const useNewDataGridImportGoods: boolean = true;

/** Use the new App Shell (left sidebar + standardized page layout wrapper) */
export const useNewAppShell: boolean = true;

/** Use the new SplitPane component (resizable left/right panes) for master-detail layouts */
export const useNewSplitPane: boolean = true;

/** Use the standardized Dashboard page with SectionBox widget cards and typography tokens */
export const useNewDashboard: boolean = true;

/** Use the new Tabs component (TabList, Tab, TabPanel) with keyboard navigation, disabled tabs, horizontal/vertical support */
export const useNewTabs: boolean = true;

/** Use the refactored ProductEditModal with MasterModal, SectionBox, TextInput, SelectInput, StatusBadge, ActionButton, LoadingState, ErrorState */
export const useRefactoredProductEditModal: boolean = true;
