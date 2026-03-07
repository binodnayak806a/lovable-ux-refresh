import { supabase } from '../lib/supabase';
import type { PrintTemplate } from '../modules/masters/pages/print-templates/types';

const printTemplateService = {
  async getAll(hospitalId: string): Promise<PrintTemplate[]> {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('document_type')
      .order('template_name');
    if (error) throw error;
    return (data ?? []) as unknown as PrintTemplate[];
  },

  async getByType(hospitalId: string, documentType: string): Promise<PrintTemplate[]> {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('document_type', documentType)
      .order('is_default', { ascending: false })
      .order('template_name');
    if (error) throw error;
    return (data ?? []) as unknown as PrintTemplate[];
  },

  async getDefault(hospitalId: string, documentType: string): Promise<PrintTemplate | null> {
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('document_type', documentType)
      .eq('is_default', true)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as PrintTemplate | null;
  },

  async save(template: Partial<PrintTemplate>): Promise<PrintTemplate> {
    if (template.id) {
      const { data, error } = await supabase
        .from('print_templates')
        .update({
          template_name: template.template_name,
          canvas_json: template.canvas_json,
          page_size: template.page_size,
          page_width_mm: template.page_width_mm,
          page_height_mm: template.page_height_mm,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', template.id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PrintTemplate;
    }
    const { data, error } = await supabase
      .from('print_templates')
      .insert(template as never)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as unknown as PrintTemplate;
  },

  async setDefault(hospitalId: string, documentType: string, templateId: string): Promise<void> {
    const { error: clearError } = await supabase
      .from('print_templates')
      .update({ is_default: false, updated_at: new Date().toISOString() } as never)
      .eq('hospital_id', hospitalId)
      .eq('document_type', documentType)
      .eq('is_default', true);
    if (clearError) throw clearError;

    const { error } = await supabase
      .from('print_templates')
      .update({ is_default: true, updated_at: new Date().toISOString() } as never)
      .eq('id', templateId);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('print_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export default printTemplateService;
