import { useState } from 'react';
import { ClipboardList, FileText, FlaskConical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
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
    <div className="space-y-6">
      <PageHeader
        title="Laboratory"
        subtitle="Manage lab orders, results, and reports"
        icon={FlaskConical}
        helpItems={[
          'View and manage all pending lab orders',
          'Enter test results directly from the Results tab',
          'Generate and print lab reports for patients',
          'Click any order row to view details or enter results',
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
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

        {!selectedOrder && activeTab === 'orders' && (
          <p className="text-xs text-muted-foreground mt-2 ml-1">
            💡 Tip: Click on any lab order to enter results
          </p>
        )}

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
            <div className="text-center py-12">
              <FlaskConical className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Select an order from the Orders tab to enter results</p>
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
