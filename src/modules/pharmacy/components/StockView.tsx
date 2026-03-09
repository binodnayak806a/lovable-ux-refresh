import { useState, useMemo } from 'react';
import {
  Search, Download, AlertTriangle, Package,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../components/ui/table';
import { useAppSelector } from '../../../store';
import { mockMasterStore } from '../../../lib/mockMasterStore';

interface StockItem {
  id: string;
  medication_name: string;
  batch_number: string;
  expiry_date: string;
  quantity_in_stock: number;
  reorder_level: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  gst_percent: number;
  supplier_name: string | null;
}

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export default function StockView() {
  const { hospitalId: rawHospitalId } = useAppSelector((s) => s.auth);
  const hospitalId = rawHospitalId ?? SAMPLE_HOSPITAL_ID;

  const [search, setSearch] = useState('');

  const stock = useMemo(() => {
    return mockMasterStore.getAll<StockItem>('pharmacy_inventory', hospitalId)
      .sort((a, b) => (a.medication_name || '').localeCompare(b.medication_name || ''));
  }, [hospitalId]);

  const filtered = useMemo(() => {
    if (!search) return stock;
    const lower = search.toLowerCase();
    return stock.filter(s =>
      s.medication_name?.toLowerCase().includes(lower) ||
      s.batch_number?.toLowerCase().includes(lower)
    );
  }, [stock, search]);

  const lowStockCount = useMemo(() =>
    stock.filter(s => s.quantity_in_stock > 0 && s.quantity_in_stock <= s.reorder_level).length
  , [stock]);

  const totalItems = stock.length;
  const totalValue = useMemo(() =>
    stock.reduce((sum, s) => sum + s.quantity_in_stock * (Number(s.mrp) || Number(s.selling_price) || 0), 0)
  , [stock]);

  const exportCsv = () => {
    const headers = ['Medicine', 'Batch', 'Expiry', 'Stock Qty', 'Reorder Level', 'Purchase Rate', 'MRP', 'GST%', 'Supplier'];
    const rows = filtered.map(s => [
      s.medication_name, s.batch_number, s.expiry_date,
      String(s.quantity_in_stock), String(s.reorder_level), String(s.purchase_price),
      String(s.mrp || s.selling_price), String(s.gst_percent), s.supplier_name || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pharmacy_stock_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100"><Package className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Items</p>
              <p className="text-xl font-bold text-gray-800">{totalItems}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Low Stock</p>
              <p className="text-xl font-bold text-orange-600">{lowStockCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100"><Package className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Value</p>
              <p className="text-xl font-bold text-gray-800">Rs. {totalValue.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by medicine name or batch..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Stock Qty</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
                <TableHead className="text-right">MRP</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Package}
                      title="No stock items found"
                      description={search ? "Try adjusting your search query" : "Add medicines to your inventory to see them here"}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const isLow = item.quantity_in_stock > 0 && item.quantity_in_stock <= item.reorder_level;
                  const isOut = item.quantity_in_stock === 0;
                  return (
                    <TableRow key={item.id} className={isLow || isOut ? 'bg-red-50/50' : ''}>
                      <TableCell><span className="font-medium text-gray-800">{item.medication_name}</span></TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">{item.batch_number}</TableCell>
                      <TableCell className="text-sm text-gray-600">{item.expiry_date}</TableCell>
                      <TableCell className={`text-right font-semibold ${isLow || isOut ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.quantity_in_stock}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">{item.reorder_level}</TableCell>
                      <TableCell className="text-right text-gray-800">
                        Rs. {(Number(item.mrp) || Number(item.selling_price)).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {isOut ? (
                          <Badge className="bg-red-100 text-red-700">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge className="bg-orange-100 text-orange-700">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
