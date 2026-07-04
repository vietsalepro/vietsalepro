import React, { useState, useRef, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import './QuantityStepper.css';

interface QuantityStepperProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (newQuantity: number) => void;
}

/**
 * QuantityStepper — Stepper số lượng với bounce animation
 * [-] [N] [+]
 * - Bo góc lớn, border-2
 * - Bounce animation khi thay đổi giá trị
 * - Hold-to-increase: giữ chuột để tăng/giảm liên tục
 * - Min: 1, Max: 999
 */
export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity, min = 1, max = 999, onChange
}) => {
  const [isBouncing, setIsBouncing] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdDelay = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBounce = useCallback(() => {
    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 300);
  }, []);

  const handleChange = useCallback((newQty: number) => {
    const clamped = Math.max(min, Math.min(max, newQty));
    onChange(clamped);
    triggerBounce();
  }, [min, max, onChange, triggerBounce]);

  const startHold = useCallback((delta: number) => {
    // Delay before continuous increment
    holdDelay.current = setTimeout(() => {
      holdTimer.current = setInterval(() => {
        handleChange(quantity + delta);
      }, 100);
    }, 300);
  }, [quantity, handleChange]);

  const stopHold = useCallback(() => {
    if (holdDelay.current) clearTimeout(holdDelay.current);
    if (holdTimer.current) clearInterval(holdTimer.current);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleChange(quantity + 1);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleChange(quantity - 1);
    }
  }, [quantity, handleChange]);

  return (
    <div className="quantity-stepper">
      {/* Minus Button */}
      <button
        onClick={() => handleChange(quantity - 1)}
        onMouseDown={() => quantity > min && startHold(-1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        disabled={quantity <= min}
        className="pos-stepper-btn quantity-stepper__btn"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Value */}
      <span
        key={quantity}
        className={`pos-stepper-value quantity-stepper__value ${
          isBouncing ? 'pos-anim-bounce-stepper' : ''
        }`}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {quantity}
      </span>

      {/* Plus Button */}
      <button
        onClick={() => handleChange(quantity + 1)}
        onMouseDown={() => quantity < max && startHold(1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        disabled={quantity >= max}
        className="pos-stepper-btn pos-stepper-plus quantity-stepper__btn"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
