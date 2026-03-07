import { Canvas, Textbox } from 'fabric';
import { DOCUMENT_TYPES, PAGE_SIZES, MM_TO_PX } from './types';

export function getSampleData(documentType: string): Record<string, string> {
  const docConfig = DOCUMENT_TYPES.find((d) => d.key === documentType);
  if (!docConfig) return {};
  const map: Record<string, string> = {};
  docConfig.fields.forEach((f) => {
    map[f.variable] = f.sampleValue;
  });
  return map;
}

export function substituteVariables(
  canvasJson: Record<string, unknown>,
  data: Record<string, string>,
): Record<string, unknown> {
  const json = JSON.parse(JSON.stringify(canvasJson));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects = (json as any).objects;
  if (Array.isArray(objects)) {
    for (const obj of objects) {
      if (obj.type === 'textbox' || obj.type === 'i-text') {
        let text: string = obj.text || '';
        for (const [variable, value] of Object.entries(data)) {
          text = text.split(variable).join(value);
        }
        obj.text = text;
      }
    }
  }
  return json;
}

export async function renderPreviewToDataURL(
  canvasJson: Record<string, unknown>,
  documentType: string,
  pageSize: string,
  pageWidthMm: number,
  pageHeightMm: number,
  data?: Record<string, string>,
): Promise<string> {
  const sampleData = data || getSampleData(documentType);
  const substituted = substituteVariables(canvasJson, sampleData);

  const dims = pageSize === 'custom'
    ? { width: pageWidthMm, height: pageHeightMm }
    : PAGE_SIZES[pageSize] || PAGE_SIZES.A4;

  const widthPx = Math.round(dims.width * MM_TO_PX);
  const heightPx = Math.round(dims.height * MM_TO_PX);

  const canvasEl = document.createElement('canvas');
  canvasEl.width = widthPx;
  canvasEl.height = heightPx;

  const tempCanvas = new Canvas(canvasEl, {
    width: widthPx,
    height: heightPx,
    backgroundColor: '#ffffff',
    renderOnAddRemove: false,
  });

  try {
    await tempCanvas.loadFromJSON(substituted);
    tempCanvas.requestRenderAll();
    const url = tempCanvas.toDataURL({ multiplier: 2 });
    return url;
  } finally {
    tempCanvas.dispose();
  }
}

export function printTemplate(
  dataUrl: string,
  pageSize: string,
  pageWidthMm: number,
  pageHeightMm: number,
) {
  const dims = pageSize === 'custom'
    ? { width: pageWidthMm, height: pageHeightMm }
    : PAGE_SIZES[pageSize] || PAGE_SIZES.A4;

  const w = window.open('', '_blank');
  if (!w) return;

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Print Template</title>
<style>
  @page { size: ${dims.width}mm ${dims.height}mm; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${dims.width}mm; height: ${dims.height}mm; }
  img { width: 100%; height: auto; display: block; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <img src="${dataUrl}" />
</body>
</html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

export async function renderCanvasWithRealData(
  canvasJson: Record<string, unknown>,
  realData: Record<string, string>,
  pageSize: string,
  pageWidthMm: number,
  pageHeightMm: number,
): Promise<string> {
  return renderPreviewToDataURL(canvasJson, '', pageSize, pageWidthMm, pageHeightMm, realData);
}

export function printWithRealData(
  dataUrl: string,
  pageSize: string,
  pageWidthMm: number,
  pageHeightMm: number,
) {
  printTemplate(dataUrl, pageSize, pageWidthMm, pageHeightMm);
}

export function replaceTextboxVariables(
  canvas: Canvas,
  data: Record<string, string>,
) {
  const objects = canvas.getObjects();
  for (const obj of objects) {
    if (obj instanceof Textbox) {
      let text: string = obj.text || '';
      for (const [variable, value] of Object.entries(data)) {
        text = text.split(variable).join(value);
      }
      obj.set('text', text);
    }
  }
  canvas.requestRenderAll();
}
