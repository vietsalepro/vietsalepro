import React from 'react';
import { Plus } from 'lucide-react';
import { VoucherButton, VoucherButtonProps } from './VoucherButton';
import { classNames } from '../../utils/classNames';
import './VoucherAddButton.css';

export interface VoucherAddButtonProps extends Omit<VoucherButtonProps, 'variant' | 'icon'> {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
}

export const VoucherAddButton: React.FC<VoucherAddButtonProps> = ({
  onClick,
  label = 'Thêm',
  icon = <Plus size={16} />,
  className = '',
  ...rest
}) => {
  return (
    <VoucherButton
      variant="secondary"
      size="md"
      icon={icon}
      className={classNames('voucher-add-button', className)}
      onClick={onClick}
      {...rest}
    >
      {label}
    </VoucherButton>
  );
};
