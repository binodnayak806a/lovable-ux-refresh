import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save, Eye, Printer, Loader2, FileText, LayoutTemplate, Sparkles, RotateCcw,
  Download,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { useHospitalId } from '../../../../hooks/useHospitalId';
import { useToast } from '../../../../hooks/useToast';
import printTemplateService from '../../../../services/print-template.service';
import { useCanvasDesigner } from './useCanvasDesigner';
import FieldPalette from './FieldPalette';
import DesignerToolbar from './DesignerToolbar';
import PropertiesPanel from './PropertiesPanel';
import PageSizeSelector from './PageSizeSelector';
import TemplateListPanel from './TemplateListPanel';
import { getSampleData, substituteVariables, printTemplate as doPrint } from './previewUtils';
import { DOCUMENT_TYPES, PAGE_SIZES } from './types';
import { STARTER_TEMPLATES } from './starterTemplates';
import type { PrintTemplate } from './types';

export default function PrintTemplatesPage() {
  const hospitalId = useHospitalId();
  const { toast } = useToast();

  const [docType, setDocType] = useState(DOCUMENT_TYPES[0].key);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<PrintTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [pageSize, setPageSize] = useState('A4');
  const [pageWidthMm, setPageWidthMm] = useState(210);
  const [pageHeightMm, setPageHeightMm] = useState(297);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const canvasInitialized = useRef(false);

  const docConfig = DOCUMENT_TYPES.find((d) => d.key === docType)!;

  const designer = useCanvasDesigner(pageSize, pageWidthMm, pageHeightMm);
  const {
    canvasRef, containerRef, initCanvas, addTextField, addRect, addLine,
    addCircle, addTriangle, addImage, deleteSelected, updateSelected,
    selectedObj, zoom, setCanvasZoom, toJSON, loadJSON,
    canvasWidthPx, canvasHeightPx, bringForward, sendBackward,
    bringToFront, sendToBack, duplicateSelected, clearCanvas, objectCount,
    undo, redo, canUndo, canRedo,
    showGrid, setShowGrid, snapToGrid, setSnapToGrid,
    alignSelected, toggleLock,
  } = designer;

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't intercept if typing in input
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 'd') { e.preventDefault(); duplicateSelected(); }
        if (e.key === 's') { e.preventDefault(); handleSave(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteSelected, undo, redo, duplicateSelected]);

  // ─── Initialize canvas ───
  const doInitCanvas = useCallback(() => {
    if (canvasElRef.current) {
      initCanvas(canvasElRef.current);
      canvasInitialized.current = true;
    }
  }, [initCanvas]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvasInitialized.current) doInitCanvas();
    }, 50);
    return () => clearTimeout(timer);
  }, [doInitCanvas]);

  useEffect(() => {
    if (canvasInitialized.current) {
      if (canvasRef.current) {
        try { canvasRef.current.dispose(); } catch { /* */ }
        canvasRef.current = null;
      }
      canvasInitialized.current = false;
      const timer = setTimeout(() => doInitCanvas(), 50);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, pageWidthMm, pageHeightMm]);

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        try { canvasRef.current.dispose(); } catch { /* */ }
        canvasRef.current = null;
        canvasInitialized.current = false;
      }
    };
  }, [canvasRef]);

  // ─── Load templates ───
  const loadTemplates = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await printTemplateService.getByType(hospitalId, docType);
      setTemplates(data);
    } catch {
      toast('Failed to load templates', { type: 'error' });
    } finally {
      setListLoading(false);
    }
  }, [hospitalId, docType, toast]);

  useEffect(() => {
    loadTemplates();
    setActiveTemplate(null);
    setTemplateName('');
  }, [docType, loadTemplates]);

  // ─── Handlers ───
  const handleSelectTemplate = async (t: PrintTemplate) => {
    setActiveTemplate(t);
    setTemplateName(t.template_name);
    setPageSize(t.page_size);
    setPageWidthMm(t.page_width_mm);
    setPageHeightMm(t.page_height_mm);
    setTimeout(async () => {
      if (t.canvas_json && Object.keys(t.canvas_json).length > 0) {
        await loadJSON(t.canvas_json);
      }
    }, 200);
  };

  const handleNew = () => {
    setActiveTemplate(null);
    setTemplateName('');
    clearCanvas();
  };

  const handleLoadStarter = async () => {
    const starterFn = STARTER_TEMPLATES[docType];
    if (!starterFn) {
      toast('No starter template available for this type', { type: 'error' });
      return;
    }
    await loadJSON(starterFn() as Record<string, unknown>);
    setTemplateName(`${docConfig.label} - Standard`);
    toast('Starter template loaded!', { type: 'success' });
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast('Enter a template name', { type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const json = toJSON();
      const saved = await printTemplateService.save({
        id: activeTemplate?.id,
        hospital_id: hospitalId,
        document_type: docType,
        template_name: templateName.trim(),
        canvas_json: json as Record<string, unknown>,
        page_size: pageSize,
        page_width_mm: pageWidthMm,
        page_height_mm: pageHeightMm,
      });
      setActiveTemplate(saved);
      toast('Template saved!', { type: 'success' });
      loadTemplates();
    } catch {
      toast('Failed to save template', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await printTemplateService.setDefault(hospitalId, docType, id);
      toast('Default template updated', { type: 'success' });
      loadTemplates();
    } catch {
      toast('Failed to set default', { type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await printTemplateService.remove(id);
      if (activeTemplate?.id === id) handleNew();
      toast('Template deleted', { type: 'success' });
      loadTemplates();
    } catch {
      toast('Failed to delete', { type: 'error' });
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const json = toJSON();
      if (!json || !Object.keys(json).length) {
        toast('Canvas is empty', { type: 'error' });
        setPreviewOpen(false);
        return;
      }
      const sampleData = getSampleData(docType);
      const substituted = substituteVariables(json as Record<string, unknown>, sampleData);

      const { Canvas: FabricCanvas } = await import('fabric');
      const offEl = document.createElement('canvas');
      offEl.width = canvasWidthPx;
      offEl.height = canvasHeightPx;
      const offCanvas = new FabricCanvas(offEl, {
        width: canvasWidthPx, height: canvasHeightPx,
        backgroundColor: '#ffffff', renderOnAddRemove: true,
      });
      await offCanvas.loadFromJSON(substituted);
      offCanvas.requestRenderAll();
      await new Promise(r => setTimeout(r, 150));
      offCanvas.requestRenderAll();
      setPreviewUrl(offCanvas.toDataURL({ multiplier: 2 }));
      offCanvas.dispose();
    } catch (err) {
      console.error('Preview failed:', err);
      toast('Preview failed', { type: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrint = () => {
    if (previewUrl) doPrint(previewUrl, pageSize, pageWidthMm, pageHeightMm);
  };

  const handleExportPNG = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${templateName || 'template'}.png`;
    a.click();
  };

  const handleAddField = (variable: string) => {
    addTextField(variable, { fontSize: 14 });
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(size);
    if (size !== 'custom') {
      const dims = PAGE_SIZES[size];
      setPageWidthMm(dims.width);
      setPageHeightMm(dims.height);
    }
  };

  const hasStarter = !!STARTER_TEMPLATES[docType];

  return (
    <div className="h-full flex flex-col -m-4 lg:-m-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10">
            <LayoutTemplate className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">Print Template Designer</h1>
            <p className="text-[10px] text-muted-foreground">Drag, drop, resize — design like a pro</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={handlePreview} className="gap-1 h-7 text-[11px]">
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 h-7 text-[11px]">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left Sidebar: Config + Fields ─── */}
        <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          {/* Config */}
          <div className="p-3 space-y-2.5 border-b border-border">
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Document Type
              </label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        {d.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Template Name
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Standard A4"
                className="h-7 text-[11px]"
              />
            </div>
            <div className="flex gap-1.5">
              {hasStarter && (
                <Button size="sm" variant="outline" onClick={handleLoadStarter} className="flex-1 gap-1 h-7 text-[10px] border-primary/30 text-primary hover:bg-primary/5">
                  <Sparkles className="w-3 h-3" /> Starter
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleNew} className="gap-1 h-7 text-[10px]">
                <RotateCcw className="w-3 h-3" /> Clear
              </Button>
            </div>
          </div>

          {/* Templates */}
          <div className="px-3 py-2 border-b border-border">
            <TemplateListPanel
              templates={templates}
              activeId={activeTemplate?.id || null}
              loading={listLoading}
              onSelect={handleSelectTemplate}
              onNew={handleNew}
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
            />
          </div>

          {/* Fields */}
          <div className="flex-1 overflow-hidden">
            <FieldPalette fields={docConfig.fields} onAddField={handleAddField} />
          </div>
        </aside>

        {/* ─── Main Canvas ─── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          {/* Toolbar */}
          <DesignerToolbar
            selectedObj={selectedObj}
            zoom={zoom}
            onUpdateSelected={updateSelected}
            onAddText={() => addTextField('Static Text', { fontSize: 14 })}
            onAddRect={addRect}
            onAddLine={addLine}
            onAddCircle={addCircle}
            onAddTriangle={addTriangle}
            onAddImage={addImage}
            onDelete={deleteSelected}
            onZoom={setCanvasZoom}
            onDuplicate={duplicateSelected}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            snapToGrid={snapToGrid}
            onToggleSnap={() => setSnapToGrid(!snapToGrid)}
            onAlign={alignSelected}
            onToggleLock={toggleLock}
          />

          {/* Page Size */}
          <div className="px-3 py-1.5 bg-card border-b border-border flex items-center justify-between">
            <PageSizeSelector
              pageSize={pageSize}
              pageWidthMm={pageWidthMm}
              pageHeightMm={pageHeightMm}
              onPageSizeChange={handlePageSizeChange}
              onCustomDimensionsChange={(w, h) => { setPageWidthMm(w); setPageHeightMm(h); }}
            />
            <span className="text-[9px] text-muted-foreground tabular-nums">
              {objectCount} element{objectCount !== 1 ? 's' : ''} • {canvasWidthPx}×{canvasHeightPx}px
            </span>
          </div>

          {/* Canvas Area */}
          <div ref={containerRef} className="flex-1 overflow-auto p-4 flex justify-center items-start" style={{ background: 'repeating-conic-gradient(hsl(var(--muted)) 0% 25%, hsl(var(--background)) 0% 50%) 50% / 20px 20px' }}>
            <div
              className="shadow-xl border border-border/50 bg-white relative"
              style={{
                width: canvasWidthPx * zoom,
                height: canvasHeightPx * zoom,
                flexShrink: 0,
              }}
            >
              <canvas ref={canvasElRef} />
              {objectCount === 0 && canvasInitialized.current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <FileText className="w-10 h-10 text-muted-foreground/15 mb-2" />
                  <p className="text-xs text-muted-foreground/30 font-medium">Empty canvas</p>
                  <p className="text-[10px] text-muted-foreground/20 mt-1">Add fields from the left panel or shapes from the toolbar</p>
                  {hasStarter && (
                    <p className="text-[10px] text-primary/30 mt-1.5">Click "Starter" for a pre-built layout</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="px-3 py-1.5 bg-card border-t border-border text-[10px] text-muted-foreground flex items-center gap-3">
            {selectedObj ? (
              <>
                <span>{String(selectedObj.type)}</span>
                <span className="tabular-nums">X:{String(selectedObj.left)} Y:{String(selectedObj.top)}</span>
                <span className="tabular-nums">W:{String(selectedObj.width)} H:{String(selectedObj.height)}</span>
                {selectedObj.angle ? <span className="tabular-nums">{String(selectedObj.angle)}°</span> : null}
              </>
            ) : (
              <span>Select an element to edit • Ctrl+Z Undo • Ctrl+D Duplicate • Del Delete</span>
            )}
          </div>
        </div>

        {/* ─── Right Sidebar: Properties ─── */}
        <aside className="w-56 shrink-0 border-l border-border bg-card overflow-hidden">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Properties</p>
          </div>
          <div className="h-[calc(100%-32px)]">
            <PropertiesPanel selectedObj={selectedObj} onUpdateSelected={updateSelected} />
          </div>
        </aside>
      </div>

      {/* ─── Preview Dialog ─── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview — {docConfig.label}
            </DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : previewUrl ? (
            <div className="flex justify-center bg-muted/50 rounded-xl p-6">
              <img src={previewUrl} alt="Template preview" className="max-w-full shadow-lg border border-border rounded" style={{ maxHeight: '70vh' }} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              No preview — add elements first
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button variant="outline" onClick={handleExportPNG} disabled={!previewUrl} className="gap-1.5">
              <Download className="w-4 h-4" /> Export PNG
            </Button>
            <Button onClick={handlePrint} disabled={!previewUrl} className="gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
