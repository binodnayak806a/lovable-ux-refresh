import { useState } from 'react';
import { ClipboardList, FileText, FlaskConical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { usePageTitle } from '../../hooks/usePageTitle';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import LabOrders from './components/LabOrders';
import ResultEntry from './components/ResultEntry';
import LabReports from './components/LabReports';
import type { LabOrder } from './types';

export default function LabPage() {
  usePageTitle('Laboratory');
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);

  const handleViewResults = (order: LabOrder) => {
    setSelectedOrder(order);
    setActiveTab('results');
  };

  const handleCloseResults = () => {
    setSelectedOrder(null);
    setActiveTab('orders');
  };

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Laboratory</h1>
        <p className="text-sm text-gray-500 mt-1">Manage lab orders, results, and reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100/80">
          <TabsTrigger value="orders" className="gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            Lab Orders
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5" disabled={!selectedOrder}>
            <FlaskConical className="w-3.5 h-3.5" />
            Result Entry
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4">
          <LabOrders onViewResults={handleViewResults} />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          {selectedOrder ? (
            <ResultEntry
              order={selectedOrder}
              onClose={handleCloseResults}
              onUpdated={() => {}}
            />
          ) : (
            <div className="text-center py-12 text-gray-400">
              Select an order from the Orders tab to enter results
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <LabReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
