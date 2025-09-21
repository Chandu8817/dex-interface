import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dex-transaction-settings';

interface TransactionSettings {
  slippage: number;
  deadline: number;
  multiCall: boolean;
}

const DEFAULT_SETTINGS: TransactionSettings = {
  slippage: 0.5, // 0.5% default slippage
  deadline: 15, // 15 minutes default deadline
  multiCall: false, // Use multicall by default
};

export const useTransactionSettings = () => {
  const [settings, setSettings] = useState<TransactionSettings>(DEFAULT_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load transaction settings:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save transaction settings:', error);
    }
  }, [settings, isInitialized]);

  const updateSettings = (updates: Partial<TransactionSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    resetToDefaults,
    isInitialized,
  };
};

export default useTransactionSettings;
