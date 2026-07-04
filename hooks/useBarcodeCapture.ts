import { useRef, useCallback, useEffect, useState } from 'react';

interface UseBarcodeCaptureOptions {
  onBarcodeScanned: (code: string) => void;
  /**
   * Khoảng thời gian (ms) tối đa giữa các ký tự để được coi là quét từ máy quét.
   * Máy quét thường gõ rất nhanh, < 50ms. Người gõ tay thường > 100ms.
   */
  charIntervalThreshold?: number;
  /**
   * Khoảng thời gian (ms) tự động reset buffer nếu không có ký tự mới.
   */
  bufferTimeout?: number;
  /**
   * Khoảng thời gian (ms) debounce cho cùng một mã quét.
   */
  debounceTime?: number;
  /**
   * Cho phép emit âm thanh beep khi quét thành công.
   */
  enableSound?: boolean;
  /**
   * Prefix và suffix mà máy quét có thể thêm vào (nếu có cấu hình).
   * Một số máy quét thêm ký tự đặc biệt như TAB, F1, v.v. ở đầu/cuối mã.
   */
  stripPrefix?: string;
  stripSuffix?: string;
}

interface BarcodeCaptureState {
  /** Đang trong trạng thái lắng nghe quét */
  isListening: boolean;
  /** Mã vừa quét thành công */
  lastScannedCode: string | null;
  /** Đang hiệu ứng flash (để phản hồi UI) */
  flashFeedback: boolean;
  /** Bật/tắt chế độ lắng nghe */
  setListening: (active: boolean) => void;
  /** Kích hoạt lắng nghe và focus vào input */
  activate: () => void;
  /** Tạm dừng lắng nghe */
  deactivate: () => void;
  /** Gán ref cho input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Xoá bộ đệm quét */
  clearBuffer: () => void;
}

/**
 * useBarcodeCapture — Hook phát hiện máy quét barcode hồng ngoại (HID keyboard emulation)
 * trên desktop. Dùng pattern nhận diện tốc độ gõ phím nhanh để phân biệt máy quét với người dùng.
 */
export function useBarcodeCapture({
  onBarcodeScanned,
  charIntervalThreshold = 50,
  bufferTimeout = 200,
  debounceTime = 2000,
  enableSound = true,
  stripPrefix = '',
  stripSuffix = '',
}: UseBarcodeCaptureOptions): BarcodeCaptureState {
  const [isListening, setListening] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [flashFeedback, setFlashFeedback] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const bufferRef = useRef('');
  const lastCharTimeRef = useRef(0);
  const bufferTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastScannedRef = useRef('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scanningRef = useRef(false);

  // ── Sound feedback ──
  const playBeep = useCallback(() => {
    if (!enableSound) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880; // A5 note
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio không available — bỏ qua
    }
  }, [enableSound]);

  // ── Xử lý buffer ──
  const clearBuffer = useCallback(() => {
    bufferRef.current = '';
    lastCharTimeRef.current = 0;
    if (bufferTimerRef.current) {
      clearTimeout(bufferTimerRef.current);
      bufferTimerRef.current = undefined;
    }
  }, []);

  const processBuffer = useCallback(() => {
    let code = bufferRef.current.trim();
    clearBuffer();

    if (!code) return;

    // Strip prefix/suffix nếu có
    if (stripPrefix && code.startsWith(stripPrefix)) {
      code = code.slice(stripPrefix.length);
    }
    if (stripSuffix && code.endsWith(stripSuffix)) {
      code = code.slice(0, -stripSuffix.length);
    }

    // Debounce: bỏ qua nếu giống mã trùng trong thời gian ngắn
    if (code === lastScannedRef.current && debounceTimerRef.current) {
      return;
    }

    scanningRef.current = true;
    lastScannedRef.current = code;
    setLastScannedCode(code);

    // Flash feedback
    setFlashFeedback(true);
    setTimeout(() => setFlashFeedback(false), 200);

    // Sound
    playBeep();

    // Callback
    onBarcodeScanned(code);

    // Reset debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      scanningRef.current = false;
      setLastScannedCode(null);
    }, debounceTime);

    // Clear last scanned code after debounce
    setLastScannedCode(code);
  }, [clearBuffer, stripPrefix, stripSuffix, debounceTime, onBarcodeScanned, playBeep]);

  // ── Keyboard handler ──
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isListening) return;

    // Bỏ qua nếu đang trong thời gian debounce
    if (scanningRef.current) return;

    // Bỏ qua các phím modifier, function keys, arrow keys (trừ Enter)
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' ||
        e.key === 'Tab' || e.key === 'Escape' || e.key === 'CapsLock' ||
        e.key.startsWith('F') || // F1-F12
        e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown' ||
        e.key === 'Delete' || e.key === 'Insert') {
      return;
    }

    // Enter → process buffer
    if (e.key === 'Enter') {
      e.preventDefault();
      if (bufferRef.current.length > 0) {
        processBuffer();
      }
      return;
    }

    // Backspace → xoá ký tự cuối trong buffer (phòng khi máy quét gõ sai)
    if (e.key === 'Backspace') {
      if (bufferRef.current.length > 0) {
        bufferRef.current = bufferRef.current.slice(0, -1);
        lastCharTimeRef.current = Date.now();
        // Reset timer
        if (bufferTimerRef.current) {
          clearTimeout(bufferTimerRef.current);
        }
        bufferTimerRef.current = setTimeout(processBuffer, bufferTimeout);
      }
      return;
    }

    // Nếu sự kiện đến từ một ô input → người dùng đang gõ tay, bỏ qua hoàn toàn
    // (máy quét HID thường gửi sự kiện đến document/window, không vào input element)
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
      clearBuffer();
      return;
    }

    // Single character (máy quét thường gõ ký tự đơn lẻ)
    if (e.key.length === 1) {
      const now = Date.now();
      const timeSinceLastChar = now - lastCharTimeRef.current;

      // Nếu khoảng cách > threshold, reset buffer (người gõ tay)
      if (lastCharTimeRef.current > 0 && timeSinceLastChar > charIntervalThreshold) {
        clearBuffer();
      }

      // Accumulate character
      bufferRef.current += e.key;
      lastCharTimeRef.current = now;

      // Reset buffer timeout
      if (bufferTimerRef.current) {
        clearTimeout(bufferTimerRef.current);
      }
      bufferTimerRef.current = setTimeout(processBuffer, bufferTimeout);

      // Prevent default để không gõ vào input nếu đang quét
      // (nếu input đang focus, máy quét sẽ tự nhập vào input, cần chặn)
      if (e.target === inputRef.current) {
        e.preventDefault();
      }
    }
  }, [isListening, charIntervalThreshold, bufferTimeout, processBuffer, clearBuffer]);

  // ── Activation / Deactivation ──
  const activate = useCallback(() => {
    setListening(true);
    clearBuffer();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [clearBuffer]);

  const deactivate = useCallback(() => {
    setListening(false);
    clearBuffer();
  }, [clearBuffer]);

  // ── Register global keyboard listener ──
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // ── Listen for F4 custom event từ usePOS ──
  useEffect(() => {
    const handleActivate = () => activate();
    window.addEventListener('pos-activate-barcode', handleActivate);
    return () => {
      window.removeEventListener('pos-activate-barcode', handleActivate);
    };
  }, [activate]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      clearBuffer();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [clearBuffer]);

  return {
    isListening,
    lastScannedCode,
    flashFeedback,
    setListening,
    activate,
    deactivate,
    inputRef,
    clearBuffer,
  };
}