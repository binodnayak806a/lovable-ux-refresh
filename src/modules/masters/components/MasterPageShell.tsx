import { useEffect, useRef, useCallback, useState } from 'react';
import { Plus, Search, Upload, Download, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../../../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import { parseCSV } from '../utils/csv';

interface Props {
  title: string;
  count: number;
  loading?: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onAdd: () => void;
  onExport: () => void;
  onImport?: (rows: Record<string, string>[]) => Promise<void>;
  children: React.ReactNode;
  deleteOpen: boolean;
  deleteName?: string;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  deleting?: boolean;
}

export default function MasterPageShell({
  title, count, loading, search, onSearchChange, onAdd, onExport, onImport,
  children, deleteOpen, deleteName, onDeleteConfirm, onDeleteCancel, deleting,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      onAdd();
    }
  }, [onAdd]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setImportData(rows);
      setImportOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportConfirm = async () => {
    if (!onImport || importData.length === 0) return;
    setImporting(true);
    try {
      await onImport(importData);
    } finally {
      setImporting(false);
      setImportOpen(false);
      setImportData([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{count} record{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {onImport && (
            <>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5 h-8 text-xs">
                <Upload className="w-3.5 h-3.5" /> Import CSV
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={onExport} className="gap-1.5 h-8 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" onClick={onAdd} className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> Add New
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : (
        children
      )}

      <AlertDialog open={deleteOpen} onOpenChange={(o) => !o && onDeleteCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteName || 'this record'}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>
              {importData.length} row(s) found. Confirm to import in batches of 50.
            </DialogDescription>
          </DialogHeader>
          {importData.length > 0 && (
            <div className="max-h-40 overflow-auto border rounded-lg p-2 text-xs text-gray-600">
              <div className="font-semibold text-gray-800 mb-1">Columns: {Object.keys(importData[0]).join(', ')}</div>
              <div>Preview of first 3 rows:</div>
              {importData.slice(0, 3).map((r, i) => (
                <div key={i} className="truncate">{JSON.stringify(r)}</div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Cancel</Button>
            <Button onClick={handleImportConfirm} disabled={importing} className="bg-blue-600 hover:bg-blue-700">
              {importing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Import {importData.length} rows
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
