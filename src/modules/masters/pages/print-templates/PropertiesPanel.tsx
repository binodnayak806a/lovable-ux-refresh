import { Slider } from '../../../../components/ui/slider';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Separator } from '../../../../components/ui/separator';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Badge } from '../../../../components/ui/badge';
import { Move, RotateCw, Maximize2, Eye } from 'lucide-react';

interface Props {
  selectedObj: Record<string, unknown> | null;
  onUpdateSelected: (props: Record<string, unknown>) => void;
}

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia',
  'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
];

export default function PropertiesPanel({ selectedObj, onUpdateSelected }: Props) {
  if (!selectedObj) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
          <Eye className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">No Selection</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Click an element on the canvas to view and edit its properties</p>
      </div>
    );
  }

  const isText = selectedObj.type === 'textbox' || selectedObj.type === 'Textbox' || selectedObj.type === 'i-text';

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Element type */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] uppercase font-semibold tracking-wider">
            {String(selectedObj.type)}
          </Badge>
          {selectedObj.locked === true && (
            <Badge variant="secondary" className="text-[9px]">Locked</Badge>
          )}
        </div>

        {/* Position */}
        <div>
          <SectionLabel icon={Move} label="Position" />
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <NumberField label="X" value={Number(selectedObj.left)} onChange={(v) => onUpdateSelected({ left: v })} />
            <NumberField label="Y" value={Number(selectedObj.top)} onChange={(v) => onUpdateSelected({ top: v })} />
          </div>
        </div>

        {/* Size */}
        <div>
          <SectionLabel icon={Maximize2} label="Size" />
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <NumberField label="W" value={Number(selectedObj.width)} onChange={(v) => onUpdateSelected({ width: v, scaleX: 1 })} />
            <NumberField label="H" value={Number(selectedObj.height)} onChange={(v) => onUpdateSelected({ height: v, scaleY: 1 })} />
          </div>
        </div>

        {/* Rotation */}
        <div>
          <SectionLabel icon={RotateCw} label="Rotation" />
          <div className="mt-1.5">
            <NumberField label="°" value={Number(selectedObj.angle)} onChange={(v) => onUpdateSelected({ angle: v })} step={5} min={-360} max={360} />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Opacity</Label>
            <span className="text-[10px] tabular-nums text-muted-foreground">{Math.round((Number(selectedObj.opacity) || 1) * 100)}%</span>
          </div>
          <Slider
            value={[Math.round((Number(selectedObj.opacity) || 1) * 100)]}
            onValueChange={([v]) => onUpdateSelected({ opacity: v / 100 })}
            min={0} max={100} step={5}
            className="mt-1.5"
          />
        </div>

        <Separator />

        {/* Text-specific */}
        {isText && (
          <>
            {/* Font */}
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Font Family</Label>
              <Select
                value={String(selectedObj.fontFamily ?? 'Arial')}
                onValueChange={(v) => onUpdateSelected({ fontFamily: v })}
              >
                <SelectTrigger className="h-7 text-[11px] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-48">
                  {FONT_FAMILIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      <span style={{ fontFamily: f }}>{f}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Spacing */}
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Letter Spacing</Label>
              <Slider
                value={[Number(selectedObj.charSpacing) || 0]}
                onValueChange={([v]) => onUpdateSelected({ charSpacing: v })}
                min={-200} max={800} step={10}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Line Height</Label>
              <Slider
                value={[Math.round((Number(selectedObj.lineHeight) || 1.16) * 100)]}
                onValueChange={([v]) => onUpdateSelected({ lineHeight: v / 100 })}
                min={50} max={300} step={5}
                className="mt-1.5"
              />
              <span className="text-[10px] tabular-nums text-muted-foreground">{(Number(selectedObj.lineHeight) || 1.16).toFixed(2)}</span>
            </div>

            {/* Colors */}
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Text Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={(selectedObj.fill as string) || '#000000'}
                  onChange={(e) => onUpdateSelected({ fill: e.target.value })}
                  className="w-8 h-7 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={(selectedObj.fill as string) || '#000000'}
                  onChange={(e) => onUpdateSelected({ fill: e.target.value })}
                  className="h-7 text-[10px] font-mono flex-1"
                />
              </div>
            </div>
          </>
        )}

        {/* Shape-specific */}
        {!isText && selectedObj && (
          <>
            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stroke Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={(selectedObj.stroke as string) || '#000000'}
                  onChange={(e) => onUpdateSelected({ stroke: e.target.value })}
                  className="w-8 h-7 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={(selectedObj.stroke as string) || '#000000'}
                  onChange={(e) => onUpdateSelected({ stroke: e.target.value })}
                  className="h-7 text-[10px] font-mono flex-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stroke Width</Label>
              <Slider
                value={[Number(selectedObj.strokeWidth) || 1]}
                onValueChange={([v]) => onUpdateSelected({ strokeWidth: v })}
                min={0} max={20} step={0.5}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Fill Color</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={(selectedObj.fill as string) || '#ffffff'}
                  onChange={(e) => onUpdateSelected({ fill: e.target.value })}
                  className="w-8 h-7 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={String(selectedObj.fill ?? 'transparent')}
                  onChange={(e) => onUpdateSelected({ fill: e.target.value })}
                  className="h-7 text-[10px] font-mono flex-1"
                />
              </div>
            </div>

            {/* Border radius for rect */}
            {(selectedObj.type === 'rect' || selectedObj.type === 'Rect') && (
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Corner Radius</Label>
                <Slider
                  value={[Number(selectedObj.rx) || 0]}
                  onValueChange={([v]) => onUpdateSelected({ rx: v, ry: v })}
                  min={0} max={100} step={1}
                  className="mt-1.5"
                />
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
    </div>
  );
}

function NumberField({ label, value, onChange, step = 1, min, max }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-muted-foreground w-3 shrink-0">{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
        className="h-6 text-[10px] tabular-nums px-1.5"
      />
    </div>
  );
}
