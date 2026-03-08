import {
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Trash2, Type, Minus, Square, Image as ImageIcon,
  ZoomIn, ZoomOut, Copy, ArrowUp, ArrowDown, Palette,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Separator } from '../../../../components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { useRef } from 'react';

interface Props {
  selectedObj: Record<string, unknown> | null;
  zoom: number;
  onUpdateSelected: (props: Record<string, unknown>) => void;
  onAddText: () => void;
  onAddRect: () => void;
  onAddLine: () => void;
  onAddImage: (url: string) => void;
  onDelete: () => void;
  onZoom: (z: number) => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72];

function ToolBtn({ icon: Icon, label, onClick, active, disabled }: {
  icon: React.ElementType; label: string; onClick: () => void; active?: boolean; disabled?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={active ? 'default' : 'ghost'}
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <Icon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DesignerToolbar({
  selectedObj, zoom, onUpdateSelected, onAddText, onAddRect, onAddLine,
  onAddImage, onDelete, onZoom, onDuplicate, onBringForward, onSendBackward,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isText = selectedObj?.type === 'textbox' || selectedObj?.type === 'i-text';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onAddImage(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-card border-b border-border flex-wrap">
      {/* Shape tools */}
      <ToolBtn icon={Type} label="Add Text" onClick={onAddText} />
      <ToolBtn icon={Minus} label="Add Line" onClick={onAddLine} />
      <ToolBtn icon={Square} label="Add Rectangle" onClick={onAddRect} />
      <ToolBtn
        icon={ImageIcon}
        label="Add Image"
        onClick={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Text formatting */}
      {isText && (
        <>
          <div className="w-20">
            <Select
              value={String(selectedObj?.fontSize ?? 14)}
              onValueChange={(v) => onUpdateSelected({ fontSize: Number(v) })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}px</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ToolBtn
            icon={Bold}
            label="Bold"
            active={selectedObj?.fontWeight === 'bold'}
            onClick={() => onUpdateSelected({
              fontWeight: selectedObj?.fontWeight === 'bold' ? 'normal' : 'bold',
            })}
          />
          <ToolBtn
            icon={Italic}
            label="Italic"
            active={selectedObj?.fontStyle === 'italic'}
            onClick={() => onUpdateSelected({
              fontStyle: selectedObj?.fontStyle === 'italic' ? 'normal' : 'italic',
            })}
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolBtn
            icon={AlignLeft}
            label="Align Left"
            active={selectedObj?.textAlign === 'left'}
            onClick={() => onUpdateSelected({ textAlign: 'left' })}
          />
          <ToolBtn
            icon={AlignCenter}
            label="Align Center"
            active={selectedObj?.textAlign === 'center'}
            onClick={() => onUpdateSelected({ textAlign: 'center' })}
          />
          <ToolBtn
            icon={AlignRight}
            label="Align Right"
            active={selectedObj?.textAlign === 'right'}
            onClick={() => onUpdateSelected({ textAlign: 'right' })}
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Palette className="w-3.5 h-3.5" />
            <input
              type="color"
              value={(selectedObj?.fill as string) || '#000000'}
              onChange={(e) => onUpdateSelected({ fill: e.target.value })}
              className="w-7 h-7 rounded-md border border-border cursor-pointer bg-transparent"
            />
          </label>
        </>
      )}

      {/* Shape formatting */}
      {selectedObj && !isText && (
        <>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            Stroke
            <input
              type="color"
              value={(selectedObj?.stroke as string) || '#000000'}
              onChange={(e) => onUpdateSelected({ stroke: e.target.value })}
              className="w-7 h-7 rounded-md border border-border cursor-pointer bg-transparent"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            Fill
            <input
              type="color"
              value={(selectedObj?.fill as string) || '#ffffff'}
              onChange={(e) => onUpdateSelected({ fill: e.target.value })}
              className="w-7 h-7 rounded-md border border-border cursor-pointer bg-transparent"
            />
          </label>
        </>
      )}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Object actions */}
      <ToolBtn icon={Copy} label="Duplicate" onClick={onDuplicate} disabled={!selectedObj} />
      <ToolBtn icon={ArrowUp} label="Bring Forward" onClick={onBringForward} disabled={!selectedObj} />
      <ToolBtn icon={ArrowDown} label="Send Backward" onClick={onSendBackward} disabled={!selectedObj} />
      <ToolBtn icon={Trash2} label="Delete" onClick={onDelete} disabled={!selectedObj} />

      <div className="flex-1" />

      {/* Zoom */}
      <div className="flex items-center gap-1">
        <ToolBtn icon={ZoomOut} label="Zoom Out" onClick={() => onZoom(zoom - 0.1)} />
        <span className="text-xs text-muted-foreground w-12 text-center tabular-nums font-medium">
          {Math.round(zoom * 100)}%
        </span>
        <ToolBtn icon={ZoomIn} label="Zoom In" onClick={() => onZoom(zoom + 0.1)} />
      </div>
    </div>
  );
}
