import { useState, useCallback, useRef } from 'react';
import { Loader2, Database, Columns3, Filter, Eye, Save, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import enhancedReportsService from '../../../services/enhanced-reports.service';
import { DATA_SOURCES } from '../types/report-types';
import ReportExportBar, { exportTableCSV, printReport } from './ReportExportBar';

const STEPS = [
  { num: 1, label: 'Data Source', icon: Database },
  { num: 2, label: 'Columns', icon: Columns3 },
  { num: 3, label: 'Filters', icon: Filter },
  { num: 4, label: 'Preview', icon: Eye },
];

const STATUS_OPTIONS = ['all', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'];
const PAYMENT_OPTIONS = ['all', 'Cash', 'Card', 'UPI', 'Insurance', 'Cheque'];

export default function CustomReportBuilder() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [source, setSource] = useState('');
  const [selectedCols, setSelectedCols] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [previewPage, setPreviewPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [saving, setSaving] = useState(false);

  const sourceConfig = source ? DATA_SOURCES[source] : null;

  const toggleCol = (key: string) => {
    setSelectedCols(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  };

  const runPreview = useCallback(async (page = 0) => {
    if (!source || selectedCols.length === 0) return;
    setLoading(true);
    try {
      const res = await enhancedReportsService.runCustomQuery(
        hospitalId, DATA_SOURCES[source].table, selectedCols, filters, page,
      );
      setPreviewData(res.data);
      setPreviewCount(res.count);
      setPreviewPage(page);
    } catch {
      toast('Failed to run query', { type: 'error' });
      setPreviewData([]);
    } finally { setLoading(false); }
  }, [hospitalId, source, selectedCols, filters, toast]);

  const handleNext = () => {
    if (step === 1 && !source) { toast('Select a data source', { type: 'error' }); return; }
    if (step === 2 && selectedCols.length === 0) { toast('Select at least one column', { type: 'error' }); return; }
    if (step === 3) { runPreview(0); }
    setStep(s => Math.min(s + 1, 4));
  };

  const handleSave = async () => {
    if (!reportName.trim()) { toast('Enter a report name', { type: 'error' }); return; }
    setSaving(true);
    try {
      await enhancedReportsService.saveReport({
        hospital_id: hospitalId,
        name: reportName.trim(),
        data_source: source,
        columns: selectedCols,
        filters,
      });
      toast('Report saved', { type: 'success' });
      setSaveOpen(false);
      setReportName('');
    } catch { toast('Failed to save', { type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleExport = () => {
    if (!sourceConfig) return;
    const colLabels = selectedCols.map(k => sourceConfig.columns.find(c => c.key === k)?.label || k);
    exportTableCSV(
      colLabels,
      previewData.map(row => selectedCols.map(k => String(row[k] ?? ''))),
      `custom-report-${source}`,
    );
  };

  const handlePrint = () => {
    if (tableRef.current) printReport(`Custom Report - ${sourceConfig?.label || source}`, tableRef.current.innerHTML);
  };

  const totalPages = Math.ceil(previewCount / 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 mb-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <button
              onClick={() => { if (s.num < step) setStep(s.num); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                step === s.num ? 'bg-blue-600 text-white font-medium'
                  : step > s.num ? 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-400 cursor-default'
              }`}
            >
              {step > s.num ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(DATA_SOURCES).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setSource(key); setSelectedCols([]); setFilters({}); }}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                source === key ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${source === key ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Database className={`w-5 h-5 ${source === key ? 'text-blue-600' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className={`font-medium ${source === key ? 'text-blue-900' : 'text-gray-900'}`}>{cfg.label}</p>
                  <p className="text-xs text-gray-500">{cfg.columns.length} columns available</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && sourceConfig && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Select columns from {sourceConfig.label}</h4>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedCols(sourceConfig.columns.map(c => c.key))} className="h-7 text-xs">Select All</Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedCols([])} className="h-7 text-xs">Clear</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sourceConfig.columns.map(col => (
                <label
                  key={col.key}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedCols.includes(col.key) ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox checked={selectedCols.includes(col.key)} onCheckedChange={() => toggleCol(col.key)} />
                  <span className="text-sm">{col.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">{selectedCols.length} columns selected</p>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Add Filters (optional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Date From</label>
                <input type="date" value={filters.date_from || ''} onChange={e => setFilters({ ...filters, date_from: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Date To</label>
                <input type="date" value={filters.date_to || ''} onChange={e => setFilters({ ...filters, date_to: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
              </div>
              {(source === 'appointments' || source === 'admissions') && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Status</label>
                  <Select value={filters.status || 'all'} onValueChange={v => setFilters({ ...filters, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {source === 'bills' && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Payment Mode</label>
                  <Select value={filters.payment_mode || 'all'} onValueChange={v => setFilters({ ...filters, payment_mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_OPTIONS.map(m => <SelectItem key={m} value={m}>{m === 'all' ? 'All Modes' : m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <ReportExportBar title={`${sourceConfig?.label || source} Report`} onPrint={handlePrint} onExportCSV={handleExport} />
            <Button size="sm" onClick={() => setSaveOpen(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-8 text-xs">
              <Save className="w-3.5 h-3.5" /> Save Report
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <div ref={tableRef}>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        {selectedCols.map(col => (
                          <TableHead key={col}>{sourceConfig?.columns.find(c => c.key === col)?.label || col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.length === 0 ? (
                        <TableRow><TableCell colSpan={selectedCols.length} className="text-center py-8 text-gray-400">No results found</TableCell></TableRow>
                      ) : previewData.map((row, i) => (
                        <TableRow key={i} className="hover:bg-gray-50/50">
                          {selectedCols.map(col => (
                            <TableCell key={col} className="text-sm">{String(row[col] ?? '-')}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                  <span>Showing {previewPage * 50 + 1}-{Math.min((previewPage + 1) * 50, previewCount)} of {previewCount}</span>
                  <div className="flex gap-1">
                    <button disabled={previewPage === 0} onClick={() => runPreview(previewPage - 1)}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Prev</button>
                    <button disabled={previewPage >= totalPages - 1} onClick={() => runPreview(previewPage + 1)}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {step < 4 ? (
          <Button onClick={handleNext} className="gap-1.5 bg-blue-600 hover:bg-blue-700">Next <ArrowRight className="w-4 h-4" /></Button>
        ) : (
          <Button onClick={() => runPreview(0)} className="gap-1.5 bg-blue-600 hover:bg-blue-700"><Eye className="w-4 h-4" /> Refresh</Button>
        )}
      </div>

      <Dialog open={saveOpen} onOpenChange={o => !o && setSaveOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Save Report</DialogTitle></DialogHeader>
          <div className="py-4">
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Report Name</label>
            <input type="text" value={reportName} onChange={e => setReportName(e.target.value)}
              placeholder="e.g. Monthly Patient Report"
              className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400" />
            <p className="text-xs text-gray-400 mt-2">
              Source: {sourceConfig?.label} | {selectedCols.length} columns | {Object.keys(filters).filter(k => filters[k] && filters[k] !== 'all').length} filters
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
