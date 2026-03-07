import { useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check, QrCode, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { useAppSelector } from '../../../store';
import { useToast } from '../../../hooks/useToast';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function QRCodePage() {
  const { user } = useAppSelector((s) => s.auth);
  const hospitalId = user?.hospital_id ?? SAMPLE_HOSPITAL_ID;
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const bookingUrl = `${window.location.origin}/qr-booking/${hospitalId}`;

  const handleDownloadPng = useCallback(() => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const padding = 40;
      ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);

      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to Book Appointment', size / 2, size - 10);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `qr-booking-${hospitalId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [hospitalId]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast('URL Copied', { type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Copy Failed', { description: 'Please copy the URL manually', type: 'error' });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">QR Appointment Booking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Print or display this QR code so patients can book appointments from their phone
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <div
              ref={qrRef}
              className="p-6 bg-white rounded-2xl border-2 border-gray-100 shadow-sm"
            >
              <QRCodeSVG
                value={bookingUrl}
                size={280}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1e293b"
              />
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              Scan this QR code with any smartphone camera
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <h3 className="text-sm font-medium text-gray-700">Booking URL</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border text-sm font-mono text-gray-600 overflow-hidden">
              <span className="truncate block">{bookingUrl}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(bookingUrl, '_blank')}
              className="gap-1.5 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleDownloadPng}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Download QR as PNG
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const win = window.open('', '_blank');
            if (!win) return;
            const svgElement = qrRef.current?.querySelector('svg');
            if (!svgElement) return;
            const svgHtml = new XMLSerializer().serializeToString(svgElement);
            win.document.write(`
              <html><head><title>QR Code - Appointment Booking</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif; }
                h2 { margin-bottom: 10px; color: #1e293b; }
                p { color: #64748b; font-size: 14px; }
                .qr { padding: 20px; }
              </style></head><body>
              <h2>Scan to Book Appointment</h2>
              <div class="qr">${svgHtml}</div>
              <p>${bookingUrl}</p>
              </body></html>
            `);
            win.document.close();
            win.print();
          }}
          className="gap-2"
        >
          <QrCode className="w-4 h-4" />
          Print QR Code
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-blue-50/50">
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">How it works</h4>
          <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
            <li>Print or display this QR code at your reception desk, waiting area, or pamphlets</li>
            <li>Patients scan the QR code with their smartphone camera</li>
            <li>They fill in their details and select a doctor and date</li>
            <li>A token number is auto-assigned and shown to the patient</li>
            <li>The appointment appears on your Appointments page with a "QR" badge</li>
            <li>Your receptionist can confirm or reschedule as needed</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
