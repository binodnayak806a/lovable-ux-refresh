import { useState } from 'react';
import { ShoppingCart, Package, Boxes } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import PageHeader from '../../components/shared/PageHeader';
import SaleBilling from './components/SaleBilling';
import PurchaseEntry from './components/PurchaseEntry';
import StockView from './components/StockView';

export default function PharmacyPage() {
  usePageTitle('Pharmacy');
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'billing');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy"
        subtitle="Manage sales, purchases, and stock"
        icon={ShoppingCart}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100/80">
          <TabsTrigger value="billing" className="gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            Sale Billing
          </TabsTrigger>
          <TabsTrigger value="purchase" className="gap-1.5">
            <Package className="w-3.5 h-3.5" />
            Purchase Entry
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-1.5">
            <Boxes className="w-3.5 h-3.5" />
            Stock View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="mt-4">
          <SaleBilling />
        </TabsContent>

        <TabsContent value="purchase" className="mt-4">
          <PurchaseEntry />
        </TabsContent>

        <TabsContent value="stock" className="mt-4">
          <StockView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
