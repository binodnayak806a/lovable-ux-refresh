import { useRef, useCallback, useEffect, useState } from 'react';
import { Canvas, Textbox, Rect, Line, FabricImage } from 'fabric';
import { toast } from 'sonner';
import { PAGE_SIZES, MM_TO_PX } from './types';

export function useCanvasDesigner(pageSize: string, pageWidthMm: number, pageHeightMm: number) {
  const canvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.75);
  const [selectedObj, setSelectedObj] = useState<Record<string, unknown> | null>(null);
  const [objectCount, setObjectCount] = useState(0);

  const dims = pageSize === 'custom'
    ? { width: pageWidthMm, height: pageHeightMm }
    : PAGE_SIZES[pageSize] || PAGE_SIZES.A4;

  const canvasWidthPx = Math.round(dims.width * MM_TO_PX);
  const canvasHeightPx = Math.round(dims.height * MM_TO_PX);

  const updateObjectCount = useCallback(() => {
    const c = canvasRef.current;
    if (c) setObjectCount(c.getObjects().length);
  }, []);

  const initCanvas = useCallback((el: HTMLCanvasElement) => {
    if (canvasRef.current) {
      try { canvasRef.current.dispose(); } catch { /* ignore */ }
      canvasRef.current = null;
    }

    const c = new Canvas(el, {
      width: canvasWidthPx,
      height: canvasHeightPx,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    });

    c.on('selection:created', (e) => {
      const obj = e.selected?.[0];
      if (obj) setSelectedObj(extractProps(obj));
    });
    c.on('selection:updated', (e) => {
      const obj = e.selected?.[0];
      if (obj) setSelectedObj(extractProps(obj));
    });
    c.on('selection:cleared', () => setSelectedObj(null));
    c.on('object:modified', () => {
      const obj = c.getActiveObject();
      if (obj) setSelectedObj(extractProps(obj));
    });
    c.on('object:added', () => updateObjectCount());
    c.on('object:removed', () => updateObjectCount());

    // Apply zoom
    c.setZoom(zoom);
    c.setDimensions({
      width: canvasWidthPx * zoom,
      height: canvasHeightPx * zoom,
    });

    canvasRef.current = c;
    c.requestRenderAll();
    return c;
  }, [canvasWidthPx, canvasHeightPx, zoom, updateObjectCount]);

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        try { canvasRef.current.dispose(); } catch { /* ignore */ }
        canvasRef.current = null;
      }
    };
  }, []);

  // Auto-position new objects so they don't stack on top of each other
  const getNextPosition = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return { left: 40, top: 40 };
    const objects = c.getObjects();
    if (objects.length === 0) return { left: 40, top: 40 };
    const last = objects[objects.length - 1];
    const nextTop = (last.top || 0) + (last.height || 30) * (last.scaleY || 1) + 15;
    return { left: last.left || 40, top: Math.min(nextTop, canvasHeightPx - 50) };
  }, [canvasHeightPx]);

  const addTextField = useCallback((text: string, opts?: Partial<{ fontSize: number; fontWeight: string; fill: string; left: number; top: number; width: number }>) => {
    const c = canvasRef.current;
    if (!c) return;
    const pos = getNextPosition();
    const tb = new Textbox(text, {
      left: opts?.left ?? pos.left,
      top: opts?.top ?? pos.top,
      fontSize: opts?.fontSize ?? 14,
      fontWeight: opts?.fontWeight ?? 'normal',
      fill: opts?.fill ?? '#000000',
      fontFamily: 'Arial',
      width: opts?.width ?? 250,
      editable: true,
      splitByGrapheme: false,
    });
    c.add(tb);
    c.setActiveObject(tb);
    c.requestRenderAll();
  }, [getNextPosition]);

  const addRect = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const pos = getNextPosition();
    const rect = new Rect({
      left: pos.left,
      top: pos.top,
      width: 200,
      height: 100,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 1,
    });
    c.add(rect);
    c.setActiveObject(rect);
    c.requestRenderAll();
  }, [getNextPosition]);

  const addLine = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const pos = getNextPosition();
    const line = new Line([0, 0, 400, 0], {
      left: pos.left,
      top: pos.top,
      stroke: '#000000',
      strokeWidth: 1,
    });
    c.add(line);
    c.setActiveObject(line);
    c.requestRenderAll();
  }, [getNextPosition]);

  const addImage = useCallback((url: string) => {
    const c = canvasRef.current;
    if (!c) return;
    const imgEl = new Image();
    imgEl.crossOrigin = 'anonymous';
    imgEl.onload = () => {
      const fImg = new FabricImage(imgEl, {
        left: 40,
        top: 40,
      });
      const scale = Math.min(200 / (fImg.width || 200), 200 / (fImg.height || 200));
      fImg.scale(scale);
      c.add(fImg);
      c.setActiveObject(fImg);
      c.requestRenderAll();
    };
    imgEl.onerror = () => {
      toast.error('Failed to load image');
    };
    imgEl.src = url;
  }, []);

  const deleteSelected = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (active) {
      c.remove(active);
      c.discardActiveObject();
      c.requestRenderAll();
      setSelectedObj(null);
    }
  }, []);

  const updateSelected = useCallback((props: Record<string, unknown>) => {
    const c = canvasRef.current;
    if (!c) return;
    const active = c.getActiveObject();
    if (!active) return;
    active.set(props);
    c.requestRenderAll();
    setSelectedObj(extractProps(active));
  }, []);

  const setCanvasZoom = useCallback((newZoom: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const clamped = Math.max(0.3, Math.min(2.5, newZoom));
    c.setZoom(clamped);
    c.setDimensions({
      width: canvasWidthPx * clamped,
      height: canvasHeightPx * clamped,
    });
    c.requestRenderAll();
    setZoom(clamped);
  }, [canvasWidthPx, canvasHeightPx]);

  const toJSON = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return {};
    return c.toJSON();
  }, []);

  const loadJSON = useCallback(async (json: Record<string, unknown>) => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      await c.loadFromJSON(json);
      c.requestRenderAll();
      updateObjectCount();
    } catch (err) {
      console.error('Failed to load template JSON:', err);
      toast.error('Failed to load template');
    }
  }, [updateObjectCount]);

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.clear();
    c.backgroundColor = '#ffffff';
    c.requestRenderAll();
    setSelectedObj(null);
    updateObjectCount();
  }, [updateObjectCount]);

  const toDataURL = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return '';
    // Reset zoom to 1 for export, then restore
    const currentZoom = c.getZoom();
    c.setZoom(1);
    c.setDimensions({ width: canvasWidthPx, height: canvasHeightPx });
    c.discardActiveObject();
    c.requestRenderAll();
    const url = c.toDataURL({ multiplier: 2 });
    // Restore zoom
    c.setZoom(currentZoom);
    c.setDimensions({ width: canvasWidthPx * currentZoom, height: canvasHeightPx * currentZoom });
    c.requestRenderAll();
    return url;
  }, [canvasWidthPx, canvasHeightPx]);

  const bringForward = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (obj) {
      c.bringObjectForward(obj);
      c.requestRenderAll();
    }
  }, []);

  const sendBackward = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (obj) {
      c.sendObjectBackwards(obj);
      c.requestRenderAll();
    }
  }, []);

  const duplicateSelected = useCallback(async () => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (!obj) return;
    const cloned = await obj.clone();
    cloned.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
    c.add(cloned);
    c.setActiveObject(cloned);
    c.requestRenderAll();
  }, []);

  return {
    canvasRef,
    containerRef,
    initCanvas,
    addTextField,
    addRect,
    addLine,
    addImage,
    deleteSelected,
    updateSelected,
    selectedObj,
    zoom,
    setCanvasZoom,
    toJSON,
    loadJSON,
    toDataURL,
    canvasWidthPx,
    canvasHeightPx,
    bringForward,
    sendBackward,
    duplicateSelected,
    clearCanvas,
    objectCount,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractProps(obj: any): Record<string, unknown> {
  return {
    type: obj.type,
    fontSize: obj.fontSize,
    fontWeight: obj.fontWeight,
    fontStyle: obj.fontStyle,
    fontFamily: obj.fontFamily,
    fill: obj.fill,
    textAlign: obj.textAlign,
    text: obj.text,
    stroke: obj.stroke,
    strokeWidth: obj.strokeWidth,
    left: Math.round(obj.left || 0),
    top: Math.round(obj.top || 0),
    width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
    height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
    opacity: obj.opacity,
    underline: obj.underline,
  };
}
