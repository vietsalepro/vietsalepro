import React, { useEffect, useRef, useState } from 'react';
import './SplitPane.css';

export interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  /** Percentage width (0–100) for the right pane. When set, left pane fills the rest. */
  rightPercent?: number;
  minRightPercent?: number;
  maxRightPercent?: number;
}

export const SplitPane: React.FC<SplitPaneProps> = ({
  left,
  right,
  defaultLeftWidth = 320,
  minLeftWidth = 280,
  maxLeftWidth = 500,
  rightPercent,
  minRightPercent = 25,
  maxRightPercent = 50,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [leftWidth, setLeftWidth] = useState<number>(defaultLeftWidth);
  const [rightPercentState, setRightPercentState] = useState<number | undefined>(rightPercent);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(defaultLeftWidth);

  useEffect(() => {
    setRightPercentState(rightPercent);
  }, [rightPercent]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateWidth = () => setContainerWidth(el.getBoundingClientRect().width);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    window.addEventListener('resize', updateWidth);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const isPercentMode = rightPercentState !== undefined && containerWidth > 0;

  const clampedRightPercent = isPercentMode
    ? Math.min(maxRightPercent, Math.max(minRightPercent, rightPercentState!))
    : undefined;

  const currentLeftWidth = isPercentMode
    ? containerWidth * (1 - clampedRightPercent! / 100)
    : leftWidth;

  const leftPaneStyle: React.CSSProperties = isPercentMode
    ? { '--split-pane-left-width': `${currentLeftWidth}px` } as React.CSSProperties
    : {
        '--split-pane-left-width': `${currentLeftWidth}px`,
        minWidth: `${minLeftWidth}px`,
        maxWidth: `${maxLeftWidth}px`,
      } as React.CSSProperties;

  const handleDividerMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResizing(true);
    startXRef.current = event.clientX;
    startWidthRef.current = currentLeftWidth;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const delta = event.clientX - startXRef.current;
      const nextWidth = startWidthRef.current + delta;

      if (isPercentMode) {
        const nextRightPercent = 100 - (nextWidth / containerWidth) * 100;
        const clamped = Math.min(
          maxRightPercent,
          Math.max(minRightPercent, nextRightPercent)
        );
        setRightPercentState(clamped);
      } else {
        setLeftWidth(Math.min(maxLeftWidth, Math.max(minLeftWidth, nextWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isPercentMode, containerWidth, minLeftWidth, maxLeftWidth, minRightPercent, maxRightPercent]);

  const ariaMin = isPercentMode
    ? containerWidth * (1 - maxRightPercent / 100)
    : minLeftWidth;
  const ariaMax = isPercentMode
    ? containerWidth * (1 - minRightPercent / 100)
    : maxLeftWidth;

  return (
    <div
      ref={containerRef}
      className={`split-pane ${isResizing ? 'split-pane--resizing' : ''}`}
    >
      <div
        className="split-pane__left"
        style={leftPaneStyle}
      >
        {left}
      </div>

      <div
        className="split-pane__divider"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(currentLeftWidth)}
        aria-valuemin={Math.round(ariaMin)}
        aria-valuemax={Math.round(ariaMax)}
        onMouseDown={handleDividerMouseDown}
      >
        <div className="split-pane__divider-line" />
      </div>

      <div className="split-pane__right">
        {right}
      </div>
    </div>
  );
};
