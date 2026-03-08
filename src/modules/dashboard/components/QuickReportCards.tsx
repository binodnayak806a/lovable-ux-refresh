import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, IndianRupee, BedDouble, Hotel, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { useHospitalId } from '../../../hooks/useHospitalId';
import enhancedReportsService from '../../../services/enhanced-reports.service';

interface QuickStats {
  todayOPD: number;
  todayRevenue: number;
  currentIPD: number;
  availableBeds: number;
}

const COLOR_MAP: Record<string, { bg: string; bgHover: string; text: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', bgHover: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', bgHover: 'group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', bgHover: 'group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50', text: 'text-amber-600 dark:text-amber-400' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/30', bgHover: 'group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50', text: 'text-teal-600 dark:text-teal-400' },
};

function formatCurrency(v: number): string {
  if (v >= 100000) return `Rs. ${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `Rs. ${(v / 1000).toFixed(1)}K`;
  return `Rs. ${v.toLocaleString('en-IN')}`;
}

const CARDS = [
  { key: 'todayOPD' as const, label: "Today's OPD", icon: CalendarCheck, color: 'blue', tab: 'daily-opd', format: (v: number) => String(v) },
  { key: 'todayRevenue' as const, label: "Today's Revenue", icon: IndianRupee, color: 'emerald', tab: 'revenue', format: formatCurrency },
  { key: 'currentIPD' as const, label: 'Current IPD', icon: BedDouble, color: 'amber', tab: 'ipd-census', format: (v: number) => String(v) },
  { key: 'availableBeds' as const, label: 'Available Beds', icon: Hotel, color: 'teal', tab: 'bed-occupancy', format: (v: number) => String(v) },
];

export default function QuickReportCards() {
  const navigate = useNavigate();
  const hospitalId = useHospitalId();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setStats(await enhancedReportsService.getDashboardQuickStats(hospitalId)); }
      catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CARDS.map(c => (
          <Card key={c.key} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center justify-center h-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map(c => (
        <Card
          key={c.key}
          className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          onClick={() => navigate(`/reports?tab=${c.tab}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{c.format(stats[c.key])}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`p-2 rounded-xl ${COLOR_MAP[c.color].bg} ${COLOR_MAP[c.color].bgHover} transition-colors`}>
                  <c.icon className={`w-5 h-5 ${COLOR_MAP[c.color].text}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
