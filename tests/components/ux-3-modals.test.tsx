import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ToastProvider, useToast, ToastContainer } from '../../components/ToastContainer';
import { FormField } from '../../components/FormField';
import { SkeletonLoader } from '../../components/SkeletonLoader';

describe('UX-3 Modal Polish', () => {
  describe('Toast system', () => {
    it('adds and renders a toast with message', () => {
      let addToastRef: ReturnType<typeof useToast>['addToast'];

      const Trigger = () => {
        const { addToast } = useToast();
        addToastRef = addToast;
        return <button onClick={() => addToast({ type: 'success', message: 'Saved!' })}>Notify</button>;
      };

      render(
        <ToastProvider>
          <Trigger />
        </ToastProvider>
      );

      act(() => {
        addToastRef!({ type: 'success', message: 'Saved!' });
      });

      expect(screen.getByRole('status')).toHaveTextContent('Saved!');
    });

    it('respects max visible toasts and removes oldest', () => {
      let addToastRef: ReturnType<typeof useToast>['addToast'];

      const Trigger = () => {
        const { addToast } = useToast();
        addToastRef = addToast;
        return <button onClick={() => addToast({ type: 'info', message: 'x' })}>Add</button>;
      };

      render(
        <ToastProvider maxVisible={3}>
          <Trigger />
        </ToastProvider>
      );

      act(() => {
        addToastRef!({ type: 'info', message: 'one' });
        addToastRef!({ type: 'info', message: 'two' });
        addToastRef!({ type: 'info', message: 'three' });
        addToastRef!({ type: 'info', message: 'four' });
      });

      const statuses = screen.getAllByRole('status');
      expect(statuses).toHaveLength(3);
      expect(statuses[0]).toHaveTextContent('two');
      expect(statuses[2]).toHaveTextContent('four');
    });

    it('dismisses toast when close button is clicked', async () => {
      const onDismiss = vi.fn();
      render(<ToastContainer toasts={[{ id: '1', type: 'error', message: 'Oops' }]} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByLabelText('Dismiss notification'));
      await waitFor(() => expect(onDismiss).toHaveBeenCalledWith('1'));
    });
  });

  describe('FormField', () => {
    it('renders label, required star, hint and error', () => {
      render(
        <FormField label="Email" htmlFor="email" required error="Required" hint="We never share your email.">
          <input id="email" type="email" />
        </FormField>
      );

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Required');
      expect(screen.queryByText('We never share your email.')).not.toBeInTheDocument();
      expect(document.querySelector('label[for="email"]')).toBeInTheDocument();
    });

    it('label for attribute matches input id', () => {
      render(
        <FormField label="Name" htmlFor="name">
          <input id="name" type="text" />
        </FormField>
      );

      const label = document.querySelector('label[for="name"]');
      expect(label).toBeInTheDocument();
      expect(document.getElementById('name')).toBe(document.querySelector('input#name'));
    });
  });

  describe('SkeletonLoader', () => {
    it('renders text lines count', () => {
      const { container } = render(<SkeletonLoader variant="text" lines={4} />);
      expect(container.querySelectorAll('.skeleton-text-line')).toHaveLength(4);
    });

    it('renders table rows count', () => {
      const { container } = render(<SkeletonLoader variant="table-row" rows={2} />);
      expect(container.querySelectorAll('.skeleton-table-row')).toHaveLength(2);
    });
  });
});
