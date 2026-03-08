import { useState, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon, Save, Building2, Receipt, Stethoscope, Bell, ShieldCheck, RefreshCw,
  Printer, MessageSquare, Palette, Download, Loader2, Moon, Sun, Upload,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from 'sonner';

const SAMPLE_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

interface SettingsState {
  hospital_name: string;
  hospital_address: string;
  hospital_phone: string;
  hospital_email: string;
  hospital_website: string;
  hospital_reg_number: string;
  hospital_gst_number: string;
  hospital_logo_url: string;
  timezone: string;
  currency: string;
  date_format: string;
  time_format: string;
  bed_count: string;
  billing_tax_percentage: string;
  billing_currency_symbol: string;
  enable_online_payments: string;
  invoice_prefix: string;
  payment_terms: string;
  default_appointment_duration: string;
  enable_vitals_alerts: string;
  default_consultation_fee: string;
  lab_report_footer: string;
  enable_sms_notifications: string;
  enable_email_notifications: string;
  appointment_reminder_hours: string;
  discharge_summary_email: string;
  session_timeout_minutes: string;
  enable_2fa: string;
  max_login_attempts: string;
  password_expiry_days: string;
  auto_print_opd_receipt: string;
  auto_print_prescription: string;
  auto_print_lab_report: string;
  auto_print_discharge_summary: string;
  auto_print_ipd_label: string;
  whatsapp_appointment_template: string;
  whatsapp_prescription_template: string;
  whatsapp_discharge_template: string;
  whatsapp_lab_report_template: string;
  theme_mode: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  hospital_name: '',
  hospital_address: '',
  hospital_phone: '',
  hospital_email: '',
  hospital_website: '',
  hospital_reg_number: '',
  hospital_gst_number: '',
  hospital_logo_url: '',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  date_format: 'dd/MM/yyyy',
  time_format: '24h',
  bed_count: '0',
  billing_tax_percentage: '18',
  billing_currency_symbol: '₹',
  enable_online_payments: 'false',
  invoice_prefix: 'INV',
  payment_terms: '30',
  default_appointment_duration: '15',
  enable_vitals_alerts: 'true',
  default_consultation_fee: '500',
  lab_report_footer: '',
  enable_sms_notifications: 'false',
  enable_email_notifications: 'true',
  appointment_reminder_hours: '24',
  discharge_summary_email: 'true',
  session_timeout_minutes: '60',
  enable_2fa: 'false',
  max_login_attempts: '5',
  password_expiry_days: '90',
  auto_print_opd_receipt: 'false',
  auto_print_prescription: 'true',
  auto_print_lab_report: 'false',
  auto_print_discharge_summary: 'true',
  auto_print_ipd_label: 'false',
  whatsapp_appointment_template: 'Dear {{patient_name}}, your appointment with Dr. {{doctor_name}} is confirmed for {{date}} at {{time}}. Token: {{token_number}}. -- {{hospital_name}}',
  whatsapp_prescription_template: 'Dear {{patient_name}}, your prescription from Dr. {{doctor_name}} is ready. Please visit the pharmacy counter. -- {{hospital_name}}',
  whatsapp_discharge_template: 'Dear {{patient_name}}, you have been discharged from {{hospital_name}}. Please follow your discharge instructions and attend the follow-up on {{followup_date}}.',
  whatsapp_lab_report_template: 'Dear {{patient_name}}, your lab report for {{test_name}} is ready. Please collect it from the lab counter. -- {{hospital_name}}',
  theme_mode: 'light',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-6 first:mt-0">{children}</h3>;
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 pr-8">
        <Label className="text-sm font-medium text-slate-800">{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { hospitalId } = useAuth();
  const { can } = usePermissions();
  const effectiveHospitalId = hospitalId ?? SAMPLE_HOSPITAL_ID;
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [exporting, setExporting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .eq('hospital_id', effectiveHospitalId);

      if (error) {
        toast.error('Failed to load settings');
        return;
      }

      if (data && data.length > 0) {
        const rows = data as { setting_key: string; setting_value: string | null }[];
        const obj = rows.reduce((acc, row) => {
          acc[row.setting_key as keyof SettingsState] = row.setting_value ?? '';
          return acc;
        }, {} as Partial<SettingsState>);
        setSettings({ ...DEFAULT_SETTINGS, ...obj });
      } else {
        setSettings({ ...DEFAULT_SETTINGS });
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [effectiveHospitalId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const set = (key: keyof SettingsState, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'theme_mode') {
      document.documentElement.classList.toggle('dark', value === 'dark');
    }
  };

  const setBool = (key: keyof SettingsState, value: boolean) =>
    setSettings(prev => ({ ...prev, [key]: String(value) }));

  const bool = (key: keyof SettingsState) => settings[key] === 'true';

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingType = (key: string): string => {
        if (['billing_tax_percentage', 'billing_currency_symbol', 'enable_online_payments', 'invoice_prefix', 'payment_terms'].includes(key)) return 'billing';
        if (['default_appointment_duration', 'enable_vitals_alerts', 'default_consultation_fee', 'lab_report_footer'].includes(key)) return 'clinical';
        if (['enable_sms_notifications', 'enable_email_notifications', 'appointment_reminder_hours', 'discharge_summary_email'].includes(key)) return 'notifications';
        if (['session_timeout_minutes', 'enable_2fa', 'max_login_attempts', 'password_expiry_days'].includes(key)) return 'security';
        if (key.startsWith('auto_print_')) return 'printing';
        if (key.startsWith('whatsapp_')) return 'whatsapp';
        if (key === 'theme_mode') return 'appearance';
        return 'general';
      };

      const upsertData = Object.entries(settings).map(([key, value]) => ({
        hospital_id: effectiveHospitalId,
        setting_key: key,
        setting_value: value,
        setting_type: settingType(key),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from('system_settings').upsert(upsertData as never[], { onConflict: 'hospital_id,setting_key' });
      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${effectiveHospitalId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('hospital-assets')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('hospital-assets')
        .getPublicUrl(path);

      set('hospital_logo_url', urlData.publicUrl);
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleExportDatabase = async () => {
    if (!can('backup_database')) {
      toast.error('You do not have permission to export data');
      return;
    }
    setExporting(true);
    try {
      const tables = [
        'patients', 'appointments', 'bills', 'bill_items', 'consultations',
        'prescriptions', 'lab_orders', 'lab_order_items', 'pharmacy_inventory',
        'pharmacy_sales', 'pharmacy_purchases', 'admissions', 'wards',
        'departments', 'profiles', 'system_settings',
      ];

      const exportData: Record<string, unknown[]> = {};

      let failedTables = 0;
      for (const table of tables) {
        try {
          const { data } = await supabase
            .from(table)
            .select('*')
            .eq('hospital_id', effectiveHospitalId)
            .limit(10000);
          exportData[table] = data ?? [];
        } catch {
          exportData[table] = [];
          failedTables++;
        }
      }

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hospital_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (failedTables > 0) {
        toast.error(`Export completed with ${failedTables} table(s) missing data`);
      } else {
        toast.success('Database exported successfully');
      }
    } catch {
      toast.error('Failed to export database');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const TABS = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'clinical', label: 'Clinical', icon: Stethoscope },
    { id: 'printing', label: 'Printing', icon: Printer },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'backup', label: 'Backup', icon: Download },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure hospital preferences and system behaviour"
        icon={Building2}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchSettings} disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-slate-200">
            <TabsList className="bg-transparent p-0 h-auto w-full justify-start rounded-none overflow-x-auto">
              {TABS.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 data-[state=active]:bg-blue-50/50 text-slate-600 font-medium text-sm"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="p-6 max-w-3xl">
            <TabsContent value="general" className="mt-0 space-y-1">
              <SectionHeading>Hospital Information</SectionHeading>
              <SettingRow label="Hospital Name" description="Official name used in reports and invoices">
                <Input value={settings.hospital_name} onChange={e => set('hospital_name', e.target.value)} className="w-72" placeholder="City General Hospital" />
              </SettingRow>
              <SettingRow label="Hospital Logo" description="Upload your hospital logo for reports and invoices">
                <div className="flex items-center gap-3">
                  {settings.hospital_logo_url && (
                    <img src={settings.hospital_logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover border" />
                  )}
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <Button variant="outline" size="sm" className="gap-1.5 pointer-events-none" asChild>
                      <span>
                        {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploadingLogo ? 'Uploading...' : 'Upload'}
                      </span>
                    </Button>
                  </label>
                </div>
              </SettingRow>
              <SettingRow label="Registration Number" description="Hospital registration / license number">
                <Input value={settings.hospital_reg_number} onChange={e => set('hospital_reg_number', e.target.value)} className="w-72" placeholder="HOSP/2024/0001" />
              </SettingRow>
              <SettingRow label="GST Number" description="Goods and Services Tax identification number">
                <Input value={settings.hospital_gst_number} onChange={e => set('hospital_gst_number', e.target.value)} className="w-72" placeholder="22AAAAA0000A1Z5" />
              </SettingRow>
              <SettingRow label="Phone" description="Primary contact number">
                <Input value={settings.hospital_phone} onChange={e => set('hospital_phone', e.target.value)} className="w-72" placeholder="+91 98765 43210" />
              </SettingRow>
              <SettingRow label="Email" description="Official email address">
                <Input type="email" value={settings.hospital_email} onChange={e => set('hospital_email', e.target.value)} className="w-72" placeholder="admin@hospital.com" />
              </SettingRow>
              <SettingRow label="Website" description="Hospital website URL">
                <Input value={settings.hospital_website} onChange={e => set('hospital_website', e.target.value)} className="w-72" placeholder="https://hospital.com" />
              </SettingRow>
              <SettingRow label="Address" description="Full address for reports and correspondence">
                <Input value={settings.hospital_address} onChange={e => set('hospital_address', e.target.value)} className="w-72" placeholder="123 Hospital Road, City" />
              </SettingRow>
              <SettingRow label="Total Beds" description="Total bed capacity of the hospital">
                <Input type="number" value={settings.bed_count} onChange={e => set('bed_count', e.target.value)} className="w-32" min={0} />
              </SettingRow>

              <SectionHeading>Regional Preferences</SectionHeading>
              <SettingRow label="Timezone" description="All timestamps will use this timezone">
                <Select value={settings.timezone} onValueChange={v => set('timezone', v)}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST +4:00)</SelectItem>
                    <SelectItem value="Asia/Singapore">Asia/Singapore (SGT +8:00)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Currency" description="Currency used for billing">
                <Select value={settings.currency} onValueChange={v => set('currency', v)}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR -- Indian Rupee</SelectItem>
                    <SelectItem value="USD">USD -- US Dollar</SelectItem>
                    <SelectItem value="AED">AED -- UAE Dirham</SelectItem>
                    <SelectItem value="GBP">GBP -- British Pound</SelectItem>
                    <SelectItem value="EUR">EUR -- Euro</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Date Format">
                <Select value={settings.date_format} onValueChange={v => set('date_format', v)}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Time Format">
                <Select value={settings.time_format} onValueChange={v => set('time_format', v)}>
                  <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24-hour (14:30)</SelectItem>
                    <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </TabsContent>

            <TabsContent value="billing" className="mt-0 space-y-1">
              <SectionHeading>Invoice Configuration</SectionHeading>
              <SettingRow label="Invoice Prefix">
                <Input value={settings.invoice_prefix} onChange={e => set('invoice_prefix', e.target.value)} className="w-32" placeholder="INV" />
              </SettingRow>
              <SettingRow label="Tax / GST Percentage">
                <div className="flex items-center gap-2">
                  <Input type="number" value={settings.billing_tax_percentage} onChange={e => set('billing_tax_percentage', e.target.value)} className="w-24" min={0} max={100} />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </SettingRow>
              <SettingRow label="Currency Symbol" description="Symbol shown on invoices">
                <Input value={settings.billing_currency_symbol} onChange={e => set('billing_currency_symbol', e.target.value)} className="w-20" placeholder="Rs." />
              </SettingRow>
              <SettingRow label="Payment Terms (days)">
                <Input type="number" value={settings.payment_terms} onChange={e => set('payment_terms', e.target.value)} className="w-24" min={0} />
              </SettingRow>
              <SettingRow label="Enable Online Payments">
                <Switch checked={bool('enable_online_payments')} onCheckedChange={v => setBool('enable_online_payments', v)} />
              </SettingRow>
            </TabsContent>

            <TabsContent value="clinical" className="mt-0 space-y-1">
              <SectionHeading>Appointments</SectionHeading>
              <SettingRow label="Default Appointment Duration">
                <div className="flex items-center gap-2">
                  <Input type="number" value={settings.default_appointment_duration} onChange={e => set('default_appointment_duration', e.target.value)} className="w-24" min={5} max={120} step={5} />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </SettingRow>
              <SettingRow label="Default Consultation Fee">
                <Input type="number" value={settings.default_consultation_fee} onChange={e => set('default_consultation_fee', e.target.value)} className="w-28" min={0} />
              </SettingRow>
              <SectionHeading>Clinical Alerts</SectionHeading>
              <SettingRow label="Enable Vitals Alerts" description="Alert when vitals fall outside normal ranges">
                <Switch checked={bool('enable_vitals_alerts')} onCheckedChange={v => setBool('enable_vitals_alerts', v)} />
              </SettingRow>
              <SectionHeading>Reports</SectionHeading>
              <SettingRow label="Lab Report Footer">
                <Input value={settings.lab_report_footer} onChange={e => set('lab_report_footer', e.target.value)} className="w-72" placeholder="Results should be correlated clinically." />
              </SettingRow>
            </TabsContent>

            <TabsContent value="printing" className="mt-0 space-y-1">
              <SectionHeading>Auto-Print Toggles</SectionHeading>
              <p className="text-sm text-gray-500 mb-4">Enable automatic printing when documents are generated.</p>
              <SettingRow label="OPD Receipt" description="Auto-print receipt after OPD billing">
                <Switch checked={bool('auto_print_opd_receipt')} onCheckedChange={v => setBool('auto_print_opd_receipt', v)} />
              </SettingRow>
              <SettingRow label="Prescription" description="Auto-print prescription after consultation">
                <Switch checked={bool('auto_print_prescription')} onCheckedChange={v => setBool('auto_print_prescription', v)} />
              </SettingRow>
              <SettingRow label="Lab Report" description="Auto-print lab report when completed">
                <Switch checked={bool('auto_print_lab_report')} onCheckedChange={v => setBool('auto_print_lab_report', v)} />
              </SettingRow>
              <SettingRow label="Discharge Summary" description="Auto-print discharge summary on patient discharge">
                <Switch checked={bool('auto_print_discharge_summary')} onCheckedChange={v => setBool('auto_print_discharge_summary', v)} />
              </SettingRow>
              <SettingRow label="IPD Label" description="Auto-print bed label on admission">
                <Switch checked={bool('auto_print_ipd_label')} onCheckedChange={v => setBool('auto_print_ipd_label', v)} />
              </SettingRow>
            </TabsContent>

            <TabsContent value="whatsapp" className="mt-0 space-y-1">
              <SectionHeading>WhatsApp Message Templates</SectionHeading>
              <p className="text-sm text-gray-500 mb-4">
                Customize messages sent via WhatsApp. Available variables:
                <span className="font-mono text-xs ml-1">
                  {'{{patient_name}}, {{doctor_name}}, {{date}}, {{time}}, {{token_number}}, {{hospital_name}}, {{test_name}}, {{followup_date}}'}
                </span>
              </p>
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-slate-800 mb-1.5 block">Appointment Confirmation</Label>
                  <Textarea
                    value={settings.whatsapp_appointment_template}
                    onChange={e => set('whatsapp_appointment_template', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-800 mb-1.5 block">Prescription Ready</Label>
                  <Textarea
                    value={settings.whatsapp_prescription_template}
                    onChange={e => set('whatsapp_prescription_template', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-800 mb-1.5 block">Discharge Notification</Label>
                  <Textarea
                    value={settings.whatsapp_discharge_template}
                    onChange={e => set('whatsapp_discharge_template', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-800 mb-1.5 block">Lab Report Ready</Label>
                  <Textarea
                    value={settings.whatsapp_lab_report_template}
                    onChange={e => set('whatsapp_lab_report_template', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-1">
              <SectionHeading>Communication Channels</SectionHeading>
              <SettingRow label="SMS Notifications" description="Send reminders via SMS">
                <Switch checked={bool('enable_sms_notifications')} onCheckedChange={v => setBool('enable_sms_notifications', v)} />
              </SettingRow>
              <SettingRow label="Email Notifications" description="Send notifications via email">
                <Switch checked={bool('enable_email_notifications')} onCheckedChange={v => setBool('enable_email_notifications', v)} />
              </SettingRow>
              <SectionHeading>Appointment Reminders</SectionHeading>
              <SettingRow label="Reminder Lead Time">
                <div className="flex items-center gap-2">
                  <Input type="number" value={settings.appointment_reminder_hours} onChange={e => set('appointment_reminder_hours', e.target.value)} className="w-24" min={1} max={72} />
                  <span className="text-sm text-muted-foreground">hours before</span>
                </div>
              </SettingRow>
              <SectionHeading>Discharge</SectionHeading>
              <SettingRow label="Discharge Summary Email" description="Auto-email discharge summary">
                <Switch checked={bool('discharge_summary_email')} onCheckedChange={v => setBool('discharge_summary_email', v)} />
              </SettingRow>
            </TabsContent>

            <TabsContent value="appearance" className="mt-0 space-y-1">
              <SectionHeading>Theme</SectionHeading>
              <SettingRow label="Color Mode" description="Switch between light and dark mode">
                <div className="flex items-center gap-3">
                  <Button
                    variant={settings.theme_mode !== 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set('theme_mode', 'light')}
                    className="gap-2"
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </Button>
                  <Button
                    variant={settings.theme_mode === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => set('theme_mode', 'dark')}
                    className="gap-2"
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </Button>
                </div>
              </SettingRow>
              <SettingRow label="Default Currency Symbol" description="Currency symbol displayed across the application">
                <Input value={settings.billing_currency_symbol} onChange={e => set('billing_currency_symbol', e.target.value)} className="w-20" />
              </SettingRow>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-1">
              <SectionHeading>Session Management</SectionHeading>
              <SettingRow label="Session Timeout" description="Auto logout after inactivity">
                <div className="flex items-center gap-2">
                  <Input type="number" value={settings.session_timeout_minutes} onChange={e => set('session_timeout_minutes', e.target.value)} className="w-24" min={5} max={480} />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </SettingRow>
              <SectionHeading>Authentication</SectionHeading>
              <SettingRow label="Two-Factor Authentication" description="Require 2FA for admin roles">
                <Switch checked={bool('enable_2fa')} onCheckedChange={v => setBool('enable_2fa', v)} />
              </SettingRow>
              <SettingRow label="Max Login Attempts">
                <Input type="number" value={settings.max_login_attempts} onChange={e => set('max_login_attempts', e.target.value)} className="w-24" min={3} max={20} />
              </SettingRow>
              <SettingRow label="Password Expiry" description="Force password reset after N days (0 = never)">
                <div className="flex items-center gap-2">
                  <Input type="number" value={settings.password_expiry_days} onChange={e => set('password_expiry_days', e.target.value)} className="w-24" min={0} max={365} />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </SettingRow>
            </TabsContent>

            <TabsContent value="backup" className="mt-0 space-y-1">
              <SectionHeading>Database Backup</SectionHeading>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Export Full Database</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Download a complete JSON export of all hospital data including patients, appointments, bills, prescriptions, lab orders, pharmacy inventory, and system settings.
                  </p>
                </div>
                <Button
                  onClick={handleExportDatabase}
                  disabled={exporting || !can('backup_database')}
                  className="gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export as JSON
                    </>
                  )}
                </Button>
                {!can('backup_database') && (
                  <p className="text-xs text-red-500">You do not have permission to export data. Contact your administrator.</p>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
