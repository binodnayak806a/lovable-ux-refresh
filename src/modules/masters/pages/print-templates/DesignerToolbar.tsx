import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  Trash2, Type, Minus, Square, Image as ImageIcon, Circle as CircleIcon, Triangle as TriangleIcon,
  ZoomIn, ZoomOut, Copy, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  Undo2, Redo2, Grid3X3, Magnet, Lock, Unlock,
  AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter,
  AlignStartHorizontal, AlignEndHorizontal, AlignStartVertical, AlignEndVertical,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Separator } from '../../../../components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover';
import { useRef } from 'react';

interface Props {
  selectedObj: Record<string, unknown> | null;
  zoom: number;
  onUpdateSelected: (props: Record<string, unknown>) => void;
  onAddText: () => void;
  onAddRect: () => void;
  onAddLine: () => void;
  onAddCircle: () => void;
  onAddTriangle: () => void;
  onAddImage: (url: string) => void;
  onDelete: () => void;
  onZoom: (z: number) => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onAlign: (a: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onToggleLock: () => void;
}

const FONT_SIZES = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];
const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia',
  'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
  'Lucida Console', 'Palatino Linotype',
];

function ToolBtn({ icon: Icon, label, onClick, active, disabled, destructive }: {
  icon: React.ElementType; label: string; onClick: () => void; active?: boolean; disabled?: boolean; destructive?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={active ? 'default' : 'ghost'}
            onClick={onClick}
            disabled={disabled}
            className={`h-7 w-7 p-0 ${destructive ? 'hover:bg-destructive/10 hover:text-destructive' : ''}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DesignerToolbar({
  selectedObj, zoom, onUpdateSelected, onAddText, onAddRect, onAddLine,
  onAddCircle, onAddTriangle, onAddImage, onDelete, onZoom, onDuplicate,
  onBringForward, onSendBackward, onBringToFront, onSendToBack,
  onUndo, onRedo, canUndo, canRedo,
  showGrid, onToggleGrid, snapToGrid, onToggleSnap,
  onAlign, onToggleLock,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isText = selectedObj?.type === 'textbox' || selectedObj?.type === 'Textbox' || selectedObj?.type === 'i-text';
  const isLocked = selectedObj?.locked === true;

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
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-card border-b border-border flex-wrap min-h-[40px]">
      {/* Undo / Redo */}
      <ToolBtn icon={Undo2} label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
      <ToolBtn icon={Redo2} label="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Add shapes */}
      <ToolBtn icon={Type} label="Add Text" onClick={onAddText} />
      <ToolBtn icon={Minus} label="Add Line" onClick={onAddLine} />
      <ToolBtn icon={Square} label="Add Rectangle" onClick={onAddRect} />
      <ToolBtn icon={CircleIcon} label="Add Circle" onClick={onAddCircle} />
      <ToolBtn icon={TriangleIcon} label="Add Triangle" onClick={onAddTriangle} />
      <ToolBtn icon={ImageIcon} label="Upload Image" onClick={() => fileRef.current?.click()} />
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Text formatting */}
      {isText && (
        <>
          {/* Font family */}
          <div className="w-[120px]">
            <Select
              value={String(selectedObj?.fontFamily ?? 'Arial')}
              onValueChange={(v) => onUpdateSelected({ fontFamily: v })}
            >
              <SelectTrigger className="h-7 text-[11px] px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {FONT_FAMILIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    <span style={{ fontFamily: f }}>{f}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font size */}
          <div className="w-[60px]">
            <Select
              value={String(selectedObj?.fontSize ?? 14)}
              onValueChange={(v) => onUpdateSelected({ fontSize: Number(v) })}
            >
              <SelectTrigger className="h-7 text-[11px] px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {FONT_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ToolBtn icon={Bold} label="Bold" active={selectedObj?.fontWeight === 'bold'} onClick={() => onUpdateSelected({ fontWeight: selectedObj?.fontWeight === 'bold' ? 'normal' : 'bold' })} />
          <ToolBtn icon={Italic} label="Italic" active={selectedObj?.fontStyle === 'italic'} onClick={() => onUpdateSelected({ fontStyle: selectedObj?.fontStyle === 'italic' ? 'normal' : 'italic' })} />
          <ToolBtn icon={Underline} label="Underline" active={!!selectedObj?.underline} onClick={() => onUpdateSelected({ underline: !selectedObj?.underline })} />
          <ToolBtn icon={Strikethrough} label="Strikethrough" active={!!selectedObj?.linethrough} onClick={() => onUpdateSelected({ linethrough: !selectedObj?.linethrough })} />

          <Separator orientation="vertical" className="h-5 mx-1" />

          <ToolBtn icon={AlignLeft} label="Align Left" active={selectedObj?.textAlign === 'left'} onClick={() => onUpdateSelected({ textAlign: 'left' })} />
          <ToolBtn icon={AlignCenter} label="Align Center" active={selectedObj?.textAlign === 'center'} onClick={() => onUpdateSelected({ textAlign: 'center' })} />
          <ToolBtn icon={AlignRight} label="Align Right" active={selectedObj?.textAlign === 'right'} onClick={() => onUpdateSelected({ textAlign: 'right' })} />

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Text color */}
          <label className="flex items-center gap-1 cursor-pointer" title="Text Color">
            <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: (selectedObj?.fill as string) || '#000000' }} />
            <input type="color" value={(selectedObj?.fill as string) || '#000000'} onChange={(e) => onUpdateSelected({ fill: e.target.value })} className="w-0 h-0 opacity-0 absolute" />
          </label>
        </>
      )}

      {/* Shape formatting */}
      {selectedObj && !isText && (
        <>
          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-muted-foreground" title="Stroke">
            <span>Stroke</span>
            <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: (selectedObj?.stroke as string) || '#000000' }} />
            <input type="color" value={(selectedObj?.stroke as string) || '#000000'} onChange={(e) => onUpdateSelected({ stroke: e.target.value })} className="w-0 h-0 opacity-0 absolute" />
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-[10px] text-muted-foreground ml-1" title="Fill">
            <span>Fill</span>
            <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: (selectedObj?.fill as string) || 'transparent' }} />
            <input type="color" value={(selectedObj?.fill as string) || '#ffffff'} onChange={(e) => onUpdateSelected({ fill: e.target.value })} className="w-0 h-0 opacity-0 absolute" />
          </label>
        </>
      )}

      {selectedObj && <Separator orientation="vertical" className="h-5 mx-1" />}

      {/* Object actions */}
      {selectedObj && (
        <>
          <ToolBtn icon={Copy} label="Duplicate (Ctrl+D)" onClick={onDuplicate} />
          
          {/* Layer ordering */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-1.5 text-[10px] gap-0.5">
                <ArrowUp className="w-3 h-3" /> Layers
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1" align="start">
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={onBringToFront}>
                <ChevronsUp className="w-3 h-3 mr-1.5" /> Bring to Front
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={onBringForward}>
                <ArrowUp className="w-3 h-3 mr-1.5" /> Bring Forward
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={onSendBackward}>
                <ArrowDown className="w-3 h-3 mr-1.5" /> Send Backward
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={onSendToBack}>
                <ChevronsDown className="w-3 h-3 mr-1.5" /> Send to Back
              </Button>
            </PopoverContent>
          </Popover>

          {/* Alignment */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 px-1.5 text-[10px] gap-0.5">
                <AlignHorizontalJustifyCenter className="w-3 h-3" /> Align
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={() => onAlign('left')}>
                <AlignStartHorizontal className="w-3 h-3 mr-1.5" /> Align Left
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={() => onAlign('center')}>
                <AlignHorizontalJustifyCenter className="w-3 h-3 mr-1.5" /> Center H
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={() => onAlign('right')}>
                <AlignEndHorizontal className="w-3 h-3 mr-1.5" /> Align Right
              </Button>
              <Separator className="my-0.5" />
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={() => onAlign('top')}>
                <AlignStartVertical className="w-3 h-3 mr-1.5" /> Align Top
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={() => onAlign('middle')}>
                <AlignVerticalJustifyCenter className="w-3 h-3 mr-1.5" /> Center V
              </Button>
              <Button size="sm" variant="ghost" className="w-full justify-start h-7 text-xs" onClick={() => onAlign('bottom')}>
                <AlignEndVertical className="w-3 h-3 mr-1.5" /> Align Bottom
              </Button>
            </PopoverContent>
          </Popover>

          <ToolBtn icon={isLocked ? Lock : Unlock} label={isLocked ? 'Unlock' : 'Lock'} onClick={onToggleLock} active={isLocked} />
          <ToolBtn icon={Trash2} label="Delete (Del)" onClick={onDelete} destructive />
        </>
      )}

      <div className="flex-1" />

      {/* Canvas tools */}
      <ToolBtn icon={Grid3X3} label="Toggle Grid" onClick={onToggleGrid} active={showGrid} />
      <ToolBtn icon={Magnet} label="Snap to Grid" onClick={onToggleSnap} active={snapToGrid} />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Zoom */}
      <ToolBtn icon={ZoomOut} label="Zoom Out" onClick={() => onZoom(zoom - 0.1)} />
      <button
        onClick={() => onZoom(0.75)}
        className="text-[10px] text-muted-foreground w-10 text-center tabular-nums font-medium hover:text-foreground transition-colors"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolBtn icon={ZoomIn} label="Zoom In" onClick={() => onZoom(zoom + 0.1)} />
    </div>
  );
}
