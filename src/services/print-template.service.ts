import { mockMasterStore } from '../lib/mockMasterStore';
import type { PrintTemplate } from '../modules/masters/pages/print-templates/types';

const printTemplateService = {
  async getAll(hospitalId: string): Promise<PrintTemplate[]> {
    return mockMasterStore.getAll<PrintTemplate>('print_templates', hospitalId);
  },

  async getByType(hospitalId: string, documentType: string): Promise<PrintTemplate[]> {
    return mockMasterStore.getAll<PrintTemplate>('print_templates', hospitalId)
      .filter(t => t.document_type === documentType)
      .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
  },

  async getDefault(hospitalId: string, documentType: string): Promise<PrintTemplate | null> {
    return mockMasterStore.getAll<PrintTemplate>('print_templates', hospitalId)
      .find(t => t.document_type === documentType && t.is_default) || null;
  },

  async save(template: Partial<PrintTemplate>): Promise<PrintTemplate> {
    if (template.id) {
      return mockMasterStore.update<PrintTemplate>('print_templates', template.id, {
        template_name: template.template_name,
        canvas_json: template.canvas_json,
        page_size: template.page_size,
        page_width_mm: template.page_width_mm,
        page_height_mm: template.page_height_mm,
      });
    }
    return mockMasterStore.insert<PrintTemplate>('print_templates', {
      ...template,
      is_default: false,
    });
  },

  async setDefault(hospitalId: string, documentType: string, templateId: string): Promise<void> {
    // Clear existing defaults
    const templates = mockMasterStore.getAll<PrintTemplate>('print_templates', hospitalId)
      .filter(t => t.document_type === documentType && t.is_default);
    templates.forEach(t => mockMasterStore.update('print_templates', t.id, { is_default: false }));
    // Set new default
    mockMasterStore.update('print_templates', templateId, { is_default: true });
  },

  async remove(id: string): Promise<void> {
    mockMasterStore.remove('print_templates', id);
  },
};

export default printTemplateService;
