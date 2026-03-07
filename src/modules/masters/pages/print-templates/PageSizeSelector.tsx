import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { PAGE_SIZES } from './types';

interface Props {
  pageSize: string;
  pageWidthMm: number;
  pageHeightMm: number;
  onPageSizeChange: (size: string) => void;
  onCustomDimensionsChange: (w: number, h: number) => void;
}

export default function PageSizeSelector({
  pageSize, pageWidthMm, pageHeightMm,
  onPageSizeChange, onCustomDimensionsChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="text-xs text-gray-500 font-medium">Page Size</label>
      <div className="w-48">
        <Select value={pageSize} onValueChange={onPageSizeChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAGE_SIZES).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {pageSize === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={pageWidthMm}
            onChange={(e) => onCustomDimensionsChange(Number(e.target.value), pageHeightMm)}
            className="w-16 h-8 px-2 rounded-md border border-gray-200 text-xs text-center"
            min={20}
            max={500}
          />
          <span className="text-xs text-gray-400">x</span>
          <input
            type="number"
            value={pageHeightMm}
            onChange={(e) => onCustomDimensionsChange(pageWidthMm, Number(e.target.value))}
            className="w-16 h-8 px-2 rounded-md border border-gray-200 text-xs text-center"
            min={20}
            max={1000}
          />
          <span className="text-xs text-gray-400">mm</span>
        </div>
      )}
    </div>
  );
}
