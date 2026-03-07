import { Trash2, ChevronDown } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import type { BillItem, ItemType } from './types';
import { ITEM_TYPES } from './types';

interface Props {
  item: BillItem;
  index: number;
  onChange: (id: string, field: keyof BillItem, value: string | number) => void;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getTypeColor(type: ItemType): string {
  switch (type) {
    case 'consultation':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'procedure':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'medication':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'lab':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'room':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export default function BillItemRow({ item, index, onChange, onRemove, readOnly }: Props) {
  const handleQuantityChange = (value: string) => {
    const qty = Math.max(1, parseInt(value) || 1);
    onChange(item.id, 'quantity', qty);
    onChange(item.id, 'totalPrice', qty * item.unitPrice);
  };

  const handleUnitPriceChange = (value: string) => {
    const price = Math.max(0, parseFloat(value) || 0);
    onChange(item.id, 'unitPrice', price);
    onChange(item.id, 'totalPrice', item.quantity * price);
  };

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="py-3 px-3 text-center text-xs text-gray-400 font-medium">{index + 1}</td>
      <td className="py-3 px-3">
        {readOnly ? (
          <span className="text-sm font-medium text-gray-800">{item.itemName}</span>
        ) : (
          <input
            type="text"
            value={item.itemName}
            onChange={(e) => onChange(item.id, 'itemName', e.target.value)}
            placeholder="Item name"
            className="w-full h-8 px-2 rounded border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        )}
      </td>
      <td className="py-3 px-3">
        {readOnly ? (
          <Badge className={`text-xs ${getTypeColor(item.itemType)}`}>
            {ITEM_TYPES.find((t) => t.value === item.itemType)?.label}
          </Badge>
        ) : (
          <div className="relative">
            <select
              value={item.itemType}
              onChange={(e) => onChange(item.id, 'itemType', e.target.value)}
              className="w-full h-8 px-2 pr-7 rounded border border-gray-200 text-xs outline-none appearance-none bg-white focus:border-blue-400"
            >
              {ITEM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        )}
      </td>
      <td className="py-3 px-3 text-center">
        {readOnly ? (
          <span className="text-sm">{item.quantity}</span>
        ) : (
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-16 h-8 px-2 rounded border border-gray-200 text-sm text-center outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        )}
      </td>
      <td className="py-3 px-3 text-right">
        {readOnly ? (
          <span className="text-sm font-mono">{formatCurrency(item.unitPrice)}</span>
        ) : (
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => handleUnitPriceChange(e.target.value)}
            className="w-24 h-8 px-2 rounded border border-gray-200 text-sm text-right font-mono outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        )}
      </td>
      <td className="py-3 px-3 text-right">
        <span className="text-sm font-semibold font-mono text-gray-800">
          {formatCurrency(item.totalPrice)}
        </span>
      </td>
      <td className="py-3 px-3 text-center">
        {!readOnly && (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
