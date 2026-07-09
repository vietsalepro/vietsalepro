import { useCallback, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const onConfirmRef = useRef<(() => void | Promise<void>) | null>(null);

  const openConfirmDialog = useCallback((opts: ConfirmDialogOptions) => {
    onConfirmRef.current = opts.onConfirm;
    setOptions(opts);
    setOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirmRef.current?.();
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const confirmDialog = open && options ? (
    <ConfirmDialog
      open={open}
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      variant={options.variant ?? 'danger'}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null;

  return { openConfirmDialog, confirmDialog };
}
