import { useState, useRef, useEffect } from 'react';
import { Printer, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  htmlContent: string;
  onPrint: () => void;
}

export default function PrintPreviewDialog({ open, onClose, title, htmlContent, onPrint }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.75);

  useEffect(() => {
    if (open && iframeRef.current && htmlContent) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  }, [open, htmlContent]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl h-[85vh] bg-card rounded-2xl shadow-modal border border-border flex flex-col overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setScale(s => Math.max(0.25, s - 0.25))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setScale(s => Math.min(1.5, s + 0.25))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={onPrint}>
              <Printer className="w-3.5 h-3.5" /> Print
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-muted/30 p-6 flex items-start justify-center">
          <div
            className="bg-white shadow-elevated rounded-lg overflow-hidden"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          >
            <iframe
              ref={iframeRef}
              title="Print Preview"
              className="w-[210mm] min-h-[297mm] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
