import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save, Eye, Printer, Loader2, FileText, LayoutTemplate, Sparkles, RotateCcw,
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

  const {
    canvasRef, containerRef, initCanvas, addTextField, addRect, addLine,
    addImage, deleteSelected, updateSelected, selectedObj, zoom,
    setCanvasZoom, toJSON, loadJSON, canvasWidthPx, canvasHeightPx,
    bringForward, sendBackward, duplicateSelected, clearCanvas, objectCount,
  } = useCanvasDesigner(pageSize, pageWidthMm, pageHeightMm);

  // ─── Initialize canvas ───
  const doInitCanvas = useCallback(() => {
    if (canvasElRef.current) {
      initCanvas(canvasElRef.current);
      canvasInitialized.current = true;
    }
  }, [initCanvas]);

  // Initial mount
  useEffect(() => {
    // Small delay to ensure the DOM element is fully rendered
    const timer = setTimeout(() => {
      if (!canvasInitialized.current) {
        doInitCanvas();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [doInitCanvas]);

  // Re-init on page size change
  useEffect(() => {
    if (canvasInitialized.current) {
      // Dispose old and re-create
      if (canvasRef.current) {
        try { canvasRef.current.dispose(); } catch { /* */ }
        canvasRef.current = null;
      }
      canvasInitialized.current = false;
      const timer = setTimeout(() => {
        doInitCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, pageWidthMm, pageHeightMm]);

  // Cleanup on unmount
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
    // Wait for canvas re-init if page size changed
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
    const starterJson = starterFn();
    await loadJSON(starterJson as Record<string, unknown>);
    setTemplateName(`${docConfig.label} - Standard`);
    toast('Starter template loaded! Customize it as needed.', { type: 'success' });
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
      toast('Template saved successfully', { type: 'success' });
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
        toast('Canvas is empty — add some elements first', { type: 'error' });
        setPreviewOpen(false);
        return;
      }
      const sampleData = getSampleData(docType);
      const substituted = substituteVariables(json as Record<string, unknown>, sampleData);

      // Render on offscreen canvas for clean preview
      const { Canvas: FabricCanvas } = await import('fabric');
      const offEl = document.createElement('canvas');
      offEl.width = canvasWidthPx;
      offEl.height = canvasHeightPx;
      const offCanvas = new FabricCanvas(offEl, {
        width: canvasWidthPx,
        height: canvasHeightPx,
        backgroundColor: '#ffffff',
        renderOnAddRemove: true,
      });
      await offCanvas.loadFromJSON(substituted);
      offCanvas.requestRenderAll();
      await new Promise(r => setTimeout(r, 150));
      offCanvas.requestRenderAll();
      const url = offCanvas.toDataURL({ multiplier: 2 });
      setPreviewUrl(url);
      offCanvas.dispose();
    } catch (err) {
      console.error('Preview failed:', err);
      toast('Preview failed', { type: 'error' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePrint = () => {
    if (previewUrl) {
      doPrint(previewUrl, pageSize, pageWidthMm, pageHeightMm);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <LayoutTemplate className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Print Template Designer</h1>
            <p className="text-xs text-muted-foreground">
              Design custom print layouts — click data fields to add, drag to arrange
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePreview} className="gap-1.5 h-8 text-xs">
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 h-8 text-xs"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Template
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          {/* Config Section */}
          <div className="p-4 space-y-3 border-b border-border">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Document Type
              </label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        {d.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Template Name
              </label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Standard A4"
                className="h-8 text-xs"
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {hasStarter && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLoadStarter}
                  className="flex-1 gap-1.5 h-8 text-xs border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Load Starter
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNew}
                className="gap-1.5 h-8 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </Button>
            </div>
          </div>

          {/* Templates List */}
          <div className="px-4 py-3 border-b border-border">
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

          {/* Field Palette */}
          <div className="flex-1 overflow-hidden">
            <FieldPalette
              fields={docConfig.fields}
              onAddField={handleAddField}
            />
          </div>
        </aside>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          {/* Toolbar */}
          <DesignerToolbar
            selectedObj={selectedObj}
            zoom={zoom}
            onUpdateSelected={updateSelected}
            onAddText={() => addTextField('Static Text', { fontSize: 14 })}
            onAddRect={addRect}
            onAddLine={addLine}
            onAddImage={addImage}
            onDelete={deleteSelected}
            onZoom={setCanvasZoom}
            onDuplicate={duplicateSelected}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
          />

          {/* Page Size Bar */}
          <div className="px-4 py-2.5 bg-card border-b border-border flex items-center justify-between">
            <PageSizeSelector
              pageSize={pageSize}
              pageWidthMm={pageWidthMm}
              pageHeightMm={pageHeightMm}
              onPageSizeChange={handlePageSizeChange}
              onCustomDimensionsChange={(w, h) => { setPageWidthMm(w); setPageHeightMm(h); }}
            />
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {objectCount} element{objectCount !== 1 ? 's' : ''} on canvas
            </span>
          </div>

          {/* Canvas Container */}
          <div ref={containerRef} className="flex-1 overflow-auto p-6 flex justify-center items-start">
            <div
              className="shadow-lg border border-border rounded-sm bg-white relative"
              style={{
                width: canvasWidthPx * zoom,
                height: canvasHeightPx * zoom,
                flexShrink: 0,
              }}
            >
              <canvas ref={canvasElRef} />
              {/* Empty state overlay */}
              {objectCount === 0 && canvasInitialized.current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                  <FileText className="w-12 h-12 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground/40 font-medium">Empty canvas</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">
                    Click data fields on the left or use the toolbar to add elements
                  </p>
                  {hasStarter && (
                    <p className="text-xs text-primary/40 mt-2">
                      Or click "Load Starter" for a pre-built layout
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-card border-t border-border text-xs text-muted-foreground flex items-center gap-4">
            {selectedObj ? (
              <>
                <span>Type: <strong className="text-foreground">{String(selectedObj.type)}</strong></span>
                <span>X: <strong className="text-foreground">{String(selectedObj.left)}</strong></span>
                <span>Y: <strong className="text-foreground">{String(selectedObj.top)}</strong></span>
                <span>W: <strong className="text-foreground">{String(selectedObj.width)}</strong></span>
                <span>H: <strong className="text-foreground">{String(selectedObj.height)}</strong></span>
              </>
            ) : (
              <span>No selection — click an element to edit its properties</span>
            )}
            <div className="flex-1" />
            <span className="tabular-nums">{canvasWidthPx} × {canvasHeightPx} px</span>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Preview — {docConfig.label}</DialogTitle>
          </DialogHeader>
          {previewLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : previewUrl ? (
            <div className="flex justify-center bg-muted/50 rounded-xl p-6">
              <img
                src={previewUrl}
                alt="Template preview"
                className="max-w-full shadow-lg border border-border rounded"
                style={{ maxHeight: '70vh' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              No preview available — add elements to the canvas first
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button onClick={handlePrint} disabled={!previewUrl} className="gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
