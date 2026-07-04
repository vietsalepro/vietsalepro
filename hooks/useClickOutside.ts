import { useEffect, RefObject } from 'react';

/**
 * useClickOutside — hook đóng component khi click bên ngoài element.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useClickOutside(ref, () => setOpen(false), open);
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onClickOutside: () => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClickOutside, active]);
}
