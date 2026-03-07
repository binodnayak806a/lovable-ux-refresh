import { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, Play, BookmarkCheck } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { useHospitalId } from '../../../hooks/useHospitalId';
import { useToast } from '../../../hooks/useToast';
import enhancedReportsService from '../../../services/enhanced-reports.service';
import { DATA_SOURCES } from '../types/report-types';
import type { SavedReport } from '../types/report-types';
import { format } from 'date-fns';

interface Props {
  onRunReport: (report: SavedReport) => void;
}

export default function SavedReportsPanel({ onRunReport }: Props) {
  const hospitalId = useHospitalId();
  const { toast } = useToast();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setReports(await enhancedReportsService.getSavedReports(hospitalId)); }
    catch { setReports([]); }
    finally { setLoading(false); }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await enhancedReportsService.deleteSavedReport(id);
      toast('Report deleted', { type: 'success' });
      load();
    } catch { toast('Failed to delete', { type: 'error' }); }
    finally { setDeletingId(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <BookmarkCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No saved reports yet</p>
        <p className="text-xs text-gray-400 mt-1">Use the Report Builder to create and save custom reports</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {reports.map(report => (
        <Card key={report.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 truncate pr-2">{report.name}</h4>
              <button
                onClick={() => handleDelete(report.id)}
                disabled={deletingId === report.id}
                className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
              >
                {deletingId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant="outline" className="text-[10px]">{DATA_SOURCES[report.data_source]?.label || report.data_source}</Badge>
              <Badge variant="outline" className="text-[10px]">{report.columns.length} cols</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">{format(new Date(report.created_at), 'dd MMM yyyy')}</span>
              <Button size="sm" variant="outline" onClick={() => onRunReport(report)} className="gap-1 h-7 text-xs">
                <Play className="w-3 h-3" /> Run
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
