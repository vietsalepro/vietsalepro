import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, Camera, AlertCircle } from 'lucide-react';
import './BarcodeScannerFix.css';

interface BarcodeScannerFixProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const SCANNER_ELEMENT_ID = 'html5-qrcode-scanner';

const BarcodeScannerFix: React.FC<BarcodeScannerFixProps> = ({ onScanSuccess, onClose, isOpen }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const lastScannedRef = useRef<string>('');
  const scanTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const mountedRef = useRef(true);

  const handleScanSuccess = (decodedText: string) => {
    if (!mountedRef.current || scanningRef.current) return;

    // Debounce: bỏ qua nếu trùng mã trong 2 giây
    if (lastScannedRef.current === decodedText) {
      return;
    }

    scanningRef.current = true;
    lastScannedRef.current = decodedText;

    // Hiệu ứng flash
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    // Rung nhẹ khi quét thành công
    if (navigator.vibrate) navigator.vibrate(100);

    // Gọi callback thành công
    onScanSuccess(decodedText);

    // Tự động đóng sau 1.5 giây
    scanTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        onClose();
      }
    }, 1500);
  };

  useEffect(() => {
    if (!isOpen) return;

    mountedRef.current = true;
    setIsInitializing(true);
    scanningRef.current = false;
    lastScannedRef.current = '';

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(SCANNER_ELEMENT_ID);
        html5QrCodeRef.current = html5QrCode;

        // iOS Safari fix QUAN TRỌNG: 
        // getUserMedia yêu cầu transient activation (user gesture context) trên iOS 16+.
        // Camera permission đã được pre-request trong click handler của MobilePOS.tsx,
        // vì vậy html5-qrcode sẽ không cần gọi getUserMedia từ useEffect/rAF nữa.
        // Tuy nhiên iOS vẫn có thể từ chối nếu camera stream bị stop sau khi pre-request.
        // 
        // Cách này đảm bảo permission đã được cấp, và `navigator.mediaDevices.enumerateDevices()`
        // trả về danh sách camera với label.
        //
        // Nếu vẫn thất bại, fallback: liệt kê camera và thử từng camera.

        // Đảm bảo video element có playsinline attribute (iOS yêu cầu)
        const ensureVideoPlaysInline = setInterval(() => {
          const video = document.querySelector(`#${SCANNER_ELEMENT_ID} video`);
          if (video && !video.hasAttribute('playsinline')) {
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            clearInterval(ensureVideoPlaysInline);
          }
          // Nếu container bị unmount thì dừng interval
          if (!document.getElementById(SCANNER_ELEMENT_ID)) {
            clearInterval(ensureVideoPlaysInline);
          }
        }, 100);

        setHasPermission(true);

        // Cấu hình camera: thử với `facingMode: 'environment'` trước, nếu fail thì fallback
        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.7777778,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Bỏ qua lỗi scan thông thường (không cần log)
          }
        );
        // Lưu interval ID để cleanup
        (window as any).__qrcodeVideoInterval = ensureVideoPlaysInline;
      } catch (err: any) {
        const errStr = err?.toString?.() || err?.message || '';
        const isNotFound = errStr.includes('NotFoundError') || errStr.includes('Requested device not found');

        if (isNotFound) {
          console.log('No camera hardware found, barcode scan unavailable on this device');
        } else {
          console.error('html5-qrcode error:', err);
        }

        if (isNotFound) {
          // iOS Safari: thử fallback - enumerate cameras và dùng deviceId
          try {
            const cameras = await Html5Qrcode.getCameras().catch(() => []);
            console.log('Available cameras:', cameras);
            
            if (cameras.length === 0) {
              setErrorMessage(
                '⚠️ Không tìm thấy camera.\n\n' +
                'Trên iOS: (1) Vào Cài đặt > Safari > Camera và chọn "Cho phép", ' +
                '(2) Đảm bảo bạn đang dùng thiết bị có camera sau, ' +
                '(3) Nếu dùng iPhone mirror trên Mac, hãy dùng trực tiếp trên iPhone.'
              );
            } else {
              // Tìm camera sau (environment)
              const rearCam = cameras.find((c: any) => 
                c.label?.toLowerCase().includes('back') || 
                c.label?.toLowerCase().includes('rear') ||
                c.label?.toLowerCase().includes('môi trường')
              ) || cameras[cameras.length - 1]; // Fallback: camera cuối cùng thường là camera sau

              console.log('Retrying with camera:', rearCam?.id);
              
              // Thử lại với deviceId cụ thể
              const html5QrCodeRetry = new Html5Qrcode(SCANNER_ELEMENT_ID);
              html5QrCodeRef.current = html5QrCodeRetry;
              
              await html5QrCodeRetry.start(
                { deviceId: { exact: rearCam.id } },
                {
                  fps: 10,
                  qrbox: { width: 250, height: 250 },
                  aspectRatio: 1.7777778,
                },
                (decodedText) => handleScanSuccess(decodedText),
                () => {}
              );
              setErrorMessage(null);
            }
          } catch (retryErr: any) {
            const retryStr = retryErr?.toString?.() || retryErr?.message || '';
            if (retryStr.includes('NotAllowedError') || retryStr.includes('Permission denied')) {
              setErrorMessage('Quyền truy cập camera bị từ chối. Vui lòng bật camera trong cài đặt trình duyệt.');
            } else {
              setErrorMessage(
                'Không thể truy cập camera trên thiết bị này.\n\n' +
                'Nguyên nhân có thể: (1) Thiết bị không có camera, ' +
                '(2) Camera đang được app khác sử dụng, ' +
                '(3) Cần cấp quyền trong Cài đặt > Safari > Camera.'
              );
            }
            setHasPermission(false);
          }
        } else if (errStr.includes('NotAllowedError') || errStr.includes('Permission denied')) {
          setErrorMessage('Quyền truy cập camera bị từ chối. Vui lòng bật camera trong cài đặt trình duyệt.');
        } else if (errStr.includes('NotReadableError') || errStr.includes('NotReadable')) {
          setErrorMessage(
            'Không thể truy cập camera. Trên iOS Safari: (1) vào Cài đặt > Safari > Camera và bật quyền, (2) đảm bảo không có app khác đang dùng camera.'
          );
        } else {
          setErrorMessage(`Lỗi camera: ${errStr || 'Không xác định'}`);
        }
        setHasPermission(false);
      } finally {
        if (mountedRef.current) {
          setIsInitializing(false);
        }
      }
    };

    // iOS Safari: startScanner được gọi TRỰC TIẾP từ useEffect, không qua setTimeout/rAF.
    // Camera permission đã được pre-request trong click handler của MobilePOS.tsx,
    // nên trình duyệt đã lưu trạng thái "granted" cho domain này.
    // Tuy nhiên nếu pre-request stream đã bị stop, iOS vẫn có thể từ chối.
    // Trong trường hợp đó, chúng ta fallback sang enumerate + deviceId.
    startScanner();

    return () => {
      mountedRef.current = false;
      // Cleanup video playsinline interval
      if ((window as any).__qrcodeVideoInterval) {
        clearInterval((window as any).__qrcodeVideoInterval);
        delete (window as any).__qrcodeVideoInterval;
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {});
        } catch {
          // Bỏ qua lỗi khi stop
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="barcode-scanner">
      {/* Header */}
      <div className="barcode-scanner__header">
        <div className="barcode-scanner__title">
          <Camera className="barcode-scanner__title-icon" />
          <span className="barcode-scanner__title-text">Quét mã sản phẩm</span>
        </div>
        <button
          onClick={onClose}
          className="barcode-scanner__close"
        >
          <X className="barcode-scanner__close-icon" />
        </button>
      </div>

      {/* Video Container */}
      <div className="barcode-scanner__video-container">
        {/* Container cho html5-qrcode */}
        <div
          id={SCANNER_ELEMENT_ID}
          className="barcode-scanner__region"
        />

        {/* Scanning Overlay */}
        <div className="barcode-scanner__overlay">
          <div className={`barcode-scanner__frame ${showFlash ? 'barcode-scanner__frame--flash' : ''}`}>
            {/* Corner Borders */}
            <div className={`barcode-scanner__corner barcode-scanner__corner--tl ${showFlash ? 'barcode-scanner__corner--flash' : ''}`}></div>
            <div className={`barcode-scanner__corner barcode-scanner__corner--tr ${showFlash ? 'barcode-scanner__corner--flash' : ''}`}></div>
            <div className={`barcode-scanner__corner barcode-scanner__corner--bl ${showFlash ? 'barcode-scanner__corner--flash' : ''}`}></div>
            <div className={`barcode-scanner__corner barcode-scanner__corner--br ${showFlash ? 'barcode-scanner__corner--flash' : ''}`}></div>

            {/* Scanning Line */}
            {!showFlash && (
              <div className="barcode-scanner__scan-line"></div>
            )}
          </div>

          <div className="barcode-scanner__hint">
            <p className="barcode-scanner__hint-text">
              {scanningRef.current ? 'Đã nhận diện mã!' : 'Di chuyển camera đến gần mã vạch / QR code'}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isInitializing && (
          <div className="barcode-scanner__loading">
            <Loader2 className="barcode-scanner__loading-icon" />
            <p className="barcode-scanner__loading-text">Đang khởi tạo camera...</p>
          </div>
        )}

        {/* Error State */}
        {hasPermission === false && (
          <div className="barcode-scanner__error">
            <div className="barcode-scanner__error-icon-wrap">
              <AlertCircle className="barcode-scanner__error-icon" />
            </div>
            <div className="barcode-scanner__error-body">
              <h3 className="barcode-scanner__error-title">Không thể truy cập Camera</h3>
              <p className="barcode-scanner__error-message">
                {errorMessage || 'Vui lòng cấp quyền truy cập camera để sử dụng tính năng quét mã.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="barcode-scanner__back-btn"
            >
              Quay lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerFix;