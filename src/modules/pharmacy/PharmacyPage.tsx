import { useState } from 'react';
import { ShoppingCart, Package, Boxes } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import SaleBilling from './components/SaleBilling';
import PurchaseEntry from './components/PurchaseEntry';
import StockView from './components/StockView';

export default function PharmacyPage() {
  usePageTitle('Pharmacy');
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'billing');

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs />
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pharmacy</h1>
        <p className="text-sm text-gray-500 mt-1">Manage sales, purchases, and stock</p>
      </div>

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
