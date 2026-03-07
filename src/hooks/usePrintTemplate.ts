import { useCallback, useRef, useEffect } from 'react';
import { useHospitalId } from './useHospitalId';
import printTemplateService from '../services/print-template.service';
import { renderCanvasWithRealData, printWithRealData } from '../modules/masters/pages/print-templates/previewUtils';

export function usePrintTemplate(documentType: string) {
  const hospitalId = useHospitalId();
  const cacheRef = useRef<{ checked: boolean; hasTemplate: boolean }>({
    checked: false,
    hasTemplate: false,
  });

  useEffect(() => {
    cacheRef.current = { checked: false, hasTemplate: false };
  }, [hospitalId, documentType]);

  const printWithTemplate = useCallback(
    async (data: Record<string, string>): Promise<boolean> => {
      try {
        const template = await printTemplateService.getDefault(hospitalId, documentType);
        if (!template || !template.canvas_json || Object.keys(template.canvas_json).length === 0) {
          return false;
        }

        const dataUrl = await renderCanvasWithRealData(
          template.canvas_json,
          data,
          template.page_size,
          template.page_width_mm,
          template.page_height_mm,
        );

        printWithRealData(dataUrl, template.page_size, template.page_width_mm, template.page_height_mm);
        return true;
      } catch {
        return false;
      }
    },
    [hospitalId, documentType],
  );

  const hasDefaultTemplate = useCallback(async (): Promise<boolean> => {
    if (cacheRef.current.checked) return cacheRef.current.hasTemplate;
    try {
      const template = await printTemplateService.getDefault(hospitalId, documentType);
      const has = !!template;
      cacheRef.current = { checked: true, hasTemplate: has };
      return has;
    } catch {
      return false;
    }
  }, [hospitalId, documentType]);

  return { printWithTemplate, hasDefaultTemplate };
}
