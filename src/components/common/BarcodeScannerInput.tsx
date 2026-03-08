import { useEffect, useRef, useState, useCallback } from 'react';
import { ScanLine } from 'lucide-react';

interface Props {
  onScan: (value: string) => void;
  enabled?: boolean;
}

/**
 * Detects barcode/QR scanner input (rapid keystrokes < 50ms apart).
 * Shows a visual indicator when a scan is detected.
 */
export default function BarcodeScannerInput({ onScan, enabled = true }: Props) {
  const bufferRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTimeRef = useRef(0);
  const [scanning, setScanning] = useState(false);

  const resetBuffer = useCallback(() => {
    bufferRef.current = '';
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      // Only intercept if NOT in an input field
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Barcode scanners type very fast (< 50ms per char)
      if (timeSinceLastKey > 100 && bufferRef.current.length > 0) {
        resetBuffer();
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 4) {
          // Valid scan detected
          setScanning(true);
          onScan(bufferRef.current.trim());
          setTimeout(() => setScanning(false), 1500);
        }
        resetBuffer();
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        bufferRef.current += e.key;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(resetBuffer, 200);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onScan, resetBuffer]);

  if (!scanning) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-success text-success-foreground px-4 py-2 rounded-xl shadow-elevated flex items-center gap-2 animate-scale-in">
      <ScanLine className="w-4 h-4" />
      <span className="text-sm font-medium">Barcode scanned!</span>
    </div>
  );
}
