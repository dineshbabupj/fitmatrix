import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../store/userStore';
import { premiumService, PremiumFeature } from '../services/premium/premiumService';

export const usePremiumStatus = () => {
  const isPremium = useUserStore((state) => state.isPremium);
  const setPremiumStatus = useUserStore((state) => state.setPremiumStatus);
  const [loading, setLoading] = useState(false);
  const [remainingScans, setRemainingScans] = useState<number>(3);

  const refreshEntitlements = useCallback(async () => {
    setLoading(true);
    try {
      const active = await premiumService.syncEntitlements();
      const scans = await premiumService.getRemainingScansToday();
      setRemainingScans(scans);
      return active;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEntitlements();
  }, [refreshEntitlements]);

  const checkAccess = async (feature: PremiumFeature) => {
    return premiumService.canAccessFeature(feature);
  };

  const registerBarcodeScan = async () => {
    const updated = await premiumService.registerBarcodeScan();
    const scans = await premiumService.getRemainingScansToday();
    setRemainingScans(scans);
    return updated;
  };

  return {
    isPremium,
    loading,
    remainingScans,
    refreshEntitlements,
    checkAccess,
    registerBarcodeScan,
    setPremiumStatus,
  };
};
