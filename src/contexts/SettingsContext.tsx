import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface HospitalSettings {
  hospital_name: string;
  hospital_logo: string | null;
  hospital_address: string;
  hospital_phone: string;
  hospital_email: string;
  hospital_gst_number: string | null;
  currency_symbol: string;
  date_format: string;
  gst_mode: 'CGST_SGST' | 'IGST';
  default_gst_rate: number;
  auto_print_opd_bill: boolean;
  auto_print_prescription: boolean;
  auto_print_receipt: boolean;
  followup_default_days: number;
  low_stock_threshold: number;
}

interface SettingsContextType {
  settings: HospitalSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  getSetting: (key: keyof HospitalSettings) => string | number | boolean | null;
}

const defaultSettings: HospitalSettings = {
  hospital_name: 'Hospital',
  hospital_logo: null,
  hospital_address: '',
  hospital_phone: '',
  hospital_email: '',
  hospital_gst_number: null,
  currency_symbol: '₹',
  date_format: 'DD/MM/YYYY',
  gst_mode: 'CGST_SGST',
  default_gst_rate: 18,
  auto_print_opd_bill: false,
  auto_print_prescription: false,
  auto_print_receipt: false,
  followup_default_days: 7,
  low_stock_threshold: 10,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  refreshSettings: async () => {},
  getSetting: () => null,
});

export function SettingsProvider({
  children,
  hospitalId
}: {
  children: React.ReactNode;
  hospitalId: string | null;
}) {
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!hospitalId) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      const { data: hospital } = await supabase
        .from('hospitals')
        .select('name, logo_url, address, city, state, pincode, phone, email')
        .eq('id', hospitalId)
        .maybeSingle();

      const { data: settingsData } = await supabase
        .from('settings')
        .select('key, value')
        .eq('hospital_id', hospitalId);

      const settingsMap: Record<string, string> = {};
      if (settingsData) {
        for (const row of settingsData as Array<{ key: string; value: string }>) {
          settingsMap[row.key] = row.value;
        }
      }

      const loadedSettings: HospitalSettings = {
        hospital_name: (hospital as { name: string } | null)?.name || defaultSettings.hospital_name,
        hospital_logo: (hospital as { logo_url: string | null } | null)?.logo_url || null,
        hospital_address: hospital
          ? `${(hospital as { address: string | null }).address || ''}, ${(hospital as { city: string | null }).city || ''}, ${(hospital as { state: string | null }).state || ''} - ${(hospital as { pincode: string | null }).pincode || ''}`.trim()
          : '',
        hospital_phone: (hospital as { phone: string | null } | null)?.phone || '',
        hospital_email: (hospital as { email: string | null } | null)?.email || '',
        hospital_gst_number: settingsMap['gst_number'] || null,
        currency_symbol: settingsMap['currency_symbol'] || defaultSettings.currency_symbol,
        date_format: settingsMap['date_format'] || defaultSettings.date_format,
        gst_mode: (settingsMap['gst_mode'] as 'CGST_SGST' | 'IGST') || defaultSettings.gst_mode,
        default_gst_rate: Number(settingsMap['default_gst_rate']) || defaultSettings.default_gst_rate,
        auto_print_opd_bill: settingsMap['auto_print_opd_bill'] === 'true',
        auto_print_prescription: settingsMap['auto_print_prescription'] === 'true',
        auto_print_receipt: settingsMap['auto_print_receipt'] === 'true',
        followup_default_days: Number(settingsMap['followup_default_days']) || defaultSettings.followup_default_days,
        low_stock_threshold: Number(settingsMap['low_stock_threshold']) || defaultSettings.low_stock_threshold,
      };

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const getSetting = useCallback(
    (key: keyof HospitalSettings) => {
      return settings?.[key] ?? null;
    },
    [settings]
  );

  const value: SettingsContextType = {
    settings,
    loading,
    refreshSettings: loadSettings,
    getSetting,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
