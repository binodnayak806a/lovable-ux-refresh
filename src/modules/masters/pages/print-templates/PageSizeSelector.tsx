import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Input } from '../../../../components/ui/input';
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
    <div className="flex items-center gap-3 flex-wrap">
      <label className="text-xs text-muted-foreground font-medium">Page Size</label>
      <div className="w-52">
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
          <Input
            type="number"
            value={pageWidthMm}
            onChange={(e) => onCustomDimensionsChange(Number(e.target.value), pageHeightMm)}
            className="w-16 h-8 text-xs text-center"
            min={20}
            max={500}
          />
          <span className="text-xs text-muted-foreground">×</span>
          <Input
            type="number"
            value={pageHeightMm}
            onChange={(e) => onCustomDimensionsChange(pageWidthMm, Number(e.target.value))}
            className="w-16 h-8 text-xs text-center"
            min={20}
            max={1000}
          />
          <span className="text-xs text-muted-foreground">mm</span>
        </div>
      )}
    </div>
  );
}
