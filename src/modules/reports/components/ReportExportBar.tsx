import { Download, Printer } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface Props {
  title: string;
  onPrint?: () => void;
  onExportCSV?: () => void;
}

export default function ReportExportBar({ title, onPrint, onExportCSV }: Props) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <div className="flex gap-1.5">
        {onExportCSV && (
          <Button size="sm" variant="outline" onClick={onExportCSV} className="gap-1.5 h-7 text-xs">
            <Download className="w-3 h-3" /> CSV
          </Button>
        )}
        {onPrint && (
          <Button size="sm" variant="outline" onClick={onPrint} className="gap-1.5 h-7 text-xs">
            <Printer className="w-3 h-3" /> Print
          </Button>
        )}
      </div>
    </div>
  );
}

export function exportTableCSV(headers: string[], rows: string[][], filename: string) {
  let csv = headers.map(h => `"${h}"`).join(',') + '\n';
  rows.forEach(row => { csv += row.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(',') + '\n'; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function printReport(title: string, contentHtml: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><title>${title}</title>
    <style>body{font-family:system-ui,sans-serif;padding:24px;color:#1a1a1a}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e5e5e5;font-size:13px}
    th{background:#f5f5f5;font-weight:600}h2{margin-bottom:4px}
    </style></head><body><h2>${title}</h2>${contentHtml}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}
