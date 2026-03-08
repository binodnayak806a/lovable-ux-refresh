import { useRef, useCallback, useEffect, useState } from 'react';
import { Canvas, Textbox, Rect, Line, FabricImage, Circle, Triangle } from 'fabric';
import { toast } from 'sonner';
import { PAGE_SIZES, MM_TO_PX } from './types';

const MAX_HISTORY = 50;

export function useCanvasDesigner(pageSize: string, pageWidthMm: number, pageHeightMm: number) {
  const canvasRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.75);
  const [selectedObj, setSelectedObj] = useState<Record<string, unknown> | null>(null);
  const [objectCount, setObjectCount] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const gridSize = 20; // px

  // Undo/Redo
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isLoadingRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const dims = pageSize === 'custom'
    ? { width: pageWidthMm, height: pageHeightMm }
    : PAGE_SIZES[pageSize] || PAGE_SIZES.A4;

  const canvasWidthPx = Math.round(dims.width * MM_TO_PX);
  const canvasHeightPx = Math.round(dims.height * MM_TO_PX);

  const saveHistory = useCallback(() => {
    const c = canvasRef.current;
    if (!c || isLoadingRef.current) return;
    const json = JSON.stringify(c.toJSON());
    const idx = historyIndexRef.current;
    // Trim future states
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(json);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const updateObjectCount = useCallback(() => {
    const c = canvasRef.current;
    if (c) setObjectCount(c.getObjects().length);
  }, []);

  const drawGrid = useCallback((c: Canvas) => {
    // Remove existing grid lines
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gridObjs = c.getObjects().filter((o) => (o as any)._isGrid);
    gridObjs.forEach((o) => c.remove(o));
    
    if (!showGrid) return;
    
    for (let x = gridSize; x < canvasWidthPx; x += gridSize) {
      const line = new Line([x, 0, x, canvasHeightPx], {
        stroke: '#e0e0e0',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (line as any)._isGrid = true;
      c.add(line);
      c.sendObjectToBack(line);
    }
    for (let y = gridSize; y < canvasHeightPx; y += gridSize) {
      const line = new Line([0, y, canvasWidthPx, y], {
        stroke: '#e0e0e0',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        excludeFromExport: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (line as any)._isGrid = true;
      c.add(line);
      c.sendObjectToBack(line);
    }
    c.requestRenderAll();
  }, [showGrid, canvasWidthPx, canvasHeightPx, gridSize]);

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
      saveHistory();
    });
    c.on('object:added', () => {
      updateObjectCount();
      saveHistory();
    });
    c.on('object:removed', () => {
      updateObjectCount();
      saveHistory();
    });

    // Snap to grid
    if (snapToGrid) {
      c.on('object:moving', (e) => {
        const obj = e.target;
        if (obj) {
          obj.set({
            left: Math.round((obj.left || 0) / gridSize) * gridSize,
            top: Math.round((obj.top || 0) / gridSize) * gridSize,
          });
        }
      });
    }

    // Apply zoom
    c.setZoom(zoom);
    c.setDimensions({
      width: canvasWidthPx * zoom,
      height: canvasHeightPx * zoom,
    });

    canvasRef.current = c;
    drawGrid(c);
    c.requestRenderAll();

    // Init history
    historyRef.current = [JSON.stringify(c.toJSON())];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);

    return c;
  }, [canvasWidthPx, canvasHeightPx, zoom, updateObjectCount, saveHistory, snapToGrid, gridSize, drawGrid]);

  // Update grid when toggled
  useEffect(() => {
    const c = canvasRef.current;
    if (c) drawGrid(c);
  }, [showGrid, drawGrid]);

  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        try { canvasRef.current.dispose(); } catch { /* ignore */ }
        canvasRef.current = null;
      }
    };
  }, []);

  const getNextPosition = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return { left: 40, top: 40 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = c.getObjects().filter((o) => !(o as any)._isGrid);
    if (objects.length === 0) return { left: 40, top: 40 };
    const last = objects[objects.length - 1];
    const nextTop = (last.top || 0) + (last.height || 30) * (last.scaleY || 1) + 15;
    return { left: last.left || 40, top: Math.min(nextTop, canvasHeightPx - 50) };
  }, [canvasHeightPx]);

  const addTextField = useCallback((text: string, opts?: Partial<{ fontSize: number; fontWeight: string; fill: string; left: number; top: number; width: number; fontFamily: string }>) => {
    const c = canvasRef.current;
    if (!c) return;
    const pos = getNextPosition();
    const tb = new Textbox(text, {
      left: opts?.left ?? pos.left,
      top: opts?.top ?? pos.top,
      fontSize: opts?.fontSize ?? 14,
      fontWeight: opts?.fontWeight ?? 'normal',
      fill: opts?.fill ?? '#000000',
      fontFamily: opts?.fontFamily ?? 'Arial',
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
      rx: 0,
      ry: 0,
    });
    c.add(rect);
    c.setActiveObject(rect);
    c.requestRenderAll();
  }, [getNextPosition]);

  const addCircle = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const pos = getNextPosition();
    const circle = new Circle({
      left: pos.left,
      top: pos.top,
      radius: 50,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 1,
    });
    c.add(circle);
    c.setActiveObject(circle);
    c.requestRenderAll();
  }, [getNextPosition]);

  const addTriangle = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const pos = getNextPosition();
    const tri = new Triangle({
      left: pos.left,
      top: pos.top,
      width: 100,
      height: 100,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 1,
    });
    c.add(tri);
    c.setActiveObject(tri);
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
      const fImg = new FabricImage(imgEl, { left: 40, top: 40 });
      const scale = Math.min(200 / (fImg.width || 200), 200 / (fImg.height || 200));
      fImg.scale(scale);
      c.add(fImg);
      c.setActiveObject(fImg);
      c.requestRenderAll();
    };
    imgEl.onerror = () => toast.error('Failed to load image');
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
    saveHistory();
  }, [saveHistory]);

  const setCanvasZoom = useCallback((newZoom: number) => {
    const c = canvasRef.current;
    if (!c) return;
    const clamped = Math.max(0.25, Math.min(3, newZoom));
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
    isLoadingRef.current = true;
    try {
      await c.loadFromJSON(json);
      drawGrid(c);
      c.requestRenderAll();
      updateObjectCount();
      // Reset history for loaded template
      historyRef.current = [JSON.stringify(c.toJSON())];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    } catch (err) {
      console.error('Failed to load template JSON:', err);
      toast.error('Failed to load template');
    } finally {
      isLoadingRef.current = false;
    }
  }, [updateObjectCount, drawGrid]);

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.clear();
    c.backgroundColor = '#ffffff';
    drawGrid(c);
    c.requestRenderAll();
    setSelectedObj(null);
    updateObjectCount();
    saveHistory();
  }, [updateObjectCount, saveHistory, drawGrid]);

  // ─── Undo / Redo ───
  const undo = useCallback(async () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];
    const c = canvasRef.current;
    if (!c || !json) return;
    isLoadingRef.current = true;
    try {
      await c.loadFromJSON(JSON.parse(json));
      drawGrid(c);
      c.requestRenderAll();
      updateObjectCount();
      setSelectedObj(null);
    } finally {
      isLoadingRef.current = false;
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, [updateObjectCount, drawGrid]);

  const redo = useCallback(async () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];
    const c = canvasRef.current;
    if (!c || !json) return;
    isLoadingRef.current = true;
    try {
      await c.loadFromJSON(JSON.parse(json));
      drawGrid(c);
      c.requestRenderAll();
      updateObjectCount();
      setSelectedObj(null);
    } finally {
      isLoadingRef.current = false;
    }
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, [updateObjectCount, drawGrid]);

  const bringForward = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (obj) { c.bringObjectForward(obj); c.requestRenderAll(); }
  }, []);

  const sendBackward = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (obj) { c.sendObjectBackwards(obj); c.requestRenderAll(); }
  }, []);

  const bringToFront = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (obj) { c.bringObjectToFront(obj); c.requestRenderAll(); }
  }, []);

  const sendToBack = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (obj) { c.sendObjectToBack(obj); c.requestRenderAll(); }
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

  // Align helpers
  const alignSelected = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (!obj) return;
    const w = obj.width! * (obj.scaleX || 1);
    const h = obj.height! * (obj.scaleY || 1);
    switch (alignment) {
      case 'left': obj.set('left', 0); break;
      case 'center': obj.set('left', (canvasWidthPx - w) / 2); break;
      case 'right': obj.set('left', canvasWidthPx - w); break;
      case 'top': obj.set('top', 0); break;
      case 'middle': obj.set('top', (canvasHeightPx - h) / 2); break;
      case 'bottom': obj.set('top', canvasHeightPx - h); break;
    }
    obj.setCoords();
    c.requestRenderAll();
    setSelectedObj(extractProps(obj));
    saveHistory();
  }, [canvasWidthPx, canvasHeightPx, saveHistory]);

  // Lock/unlock
  const toggleLock = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (!obj) return;
    const locked = !obj.lockMovementX;
    obj.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockRotation: locked,
      hasControls: !locked,
    });
    c.requestRenderAll();
    setSelectedObj(extractProps(obj));
  }, []);

  return {
    canvasRef, containerRef, initCanvas,
    addTextField, addRect, addLine, addCircle, addTriangle, addImage,
    deleteSelected, updateSelected, selectedObj,
    zoom, setCanvasZoom,
    toJSON, loadJSON, clearCanvas,
    canvasWidthPx, canvasHeightPx,
    bringForward, sendBackward, bringToFront, sendToBack,
    duplicateSelected, objectCount,
    undo, redo, canUndo, canRedo,
    showGrid, setShowGrid, snapToGrid, setSnapToGrid,
    alignSelected, toggleLock,
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
    opacity: obj.opacity ?? 1,
    underline: obj.underline ?? false,
    linethrough: obj.linethrough ?? false,
    charSpacing: obj.charSpacing ?? 0,
    lineHeight: obj.lineHeight ?? 1.16,
    rx: obj.rx ?? 0,
    ry: obj.ry ?? 0,
    angle: Math.round(obj.angle || 0),
    locked: obj.lockMovementX ?? false,
    radius: obj.radius,
  };
}
