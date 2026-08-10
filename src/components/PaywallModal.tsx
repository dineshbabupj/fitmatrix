import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { revenueCatService } from '../services/iap/revenueCatService';
import { IAPProduct, IAP_PRODUCT_IDS } from '../services/iap/iapConfig';
import { theme } from '../theme/theme';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, onSuccess }) => {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(IAP_PRODUCT_IDS.premiumYearly);
  const [loading, setLoading] = useState<boolean>(false);
  const [purchasing, setPurchasing] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      loadProducts();
    }
  }, [visible]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const items = await revenueCatService.getProducts();
      setProducts(items);
    } catch (e) {
      console.warn('Failed to load IAP products:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProductId) return;

    setPurchasing(true);
    try {
      const res = await revenueCatService.purchaseProduct(selectedProductId);
      if (res.success) {
        Alert.alert('Purchase Successful! 🎉', 'Thank you for supporting FitMetrics Pro!');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      Alert.alert('Purchase Error', err?.message || 'Transaction could not be completed.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const info = await revenueCatService.restorePurchases();
      if (info.activeEntitlements.length > 0) {
        Alert.alert('Purchases Restored!', `Restored active entitlements: ${info.activeEntitlements.join(', ')}`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        Alert.alert('Restore Purchases', 'No previous active purchases were found for this account.');
      }
    } catch (e) {
      Alert.alert('Restore Error', 'Failed to restore purchases.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={28} color={theme.colors.dark.onSurfaceVariant} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header Title */}
            <View style={styles.header}>
              <Ionicons name="sparkles" size={40} color={theme.colors.dark.primary} />
              <Text style={styles.title}>Unlock FitMetrics Pro</Text>
              <Text style={styles.subtitle}>
                Get unlimited access to advanced trends, PDF exports, and remove all ads.
              </Text>
            </View>

            {/* Feature Bullet Points */}
            <View style={styles.featuresBox}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.dark.primary} />
                <Text style={styles.featureText}>Remove All Banner, Interstitial & Native Ads</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.dark.primary} />
                <Text style={styles.featureText}>Advanced Progress & Health Trend Charts</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={18} color={theme.colors.dark.primary} />
                <Text style={styles.featureText}>Unlimited Cloud Sync across all Devices</Text>
              </View>
            </View>

            {/* Products Selector */}
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.dark.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.productsList}>
                {products.map((p) => {
                  const isSelected = p.id === selectedProductId;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.productCard, isSelected && styles.productCardActive]}
                      onPress={() => setSelectedProductId(p.id)}
                      activeOpacity={0.8}
                    >
                      {p.savingsBadge && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>{p.savingsBadge}</Text>
                        </View>
                      )}
                      <View style={styles.productLeft}>
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={isSelected ? theme.colors.dark.primary : theme.colors.dark.outline}
                        />
                        <View>
                          <Text style={styles.productTitle}>{p.title}</Text>
                          <Text style={styles.productDesc}>{p.description}</Text>
                        </View>
                      </View>
                      <View style={styles.productRight}>
                        <Text style={styles.productPrice}>{p.price}</Text>
                        {p.period && <Text style={styles.productPeriod}>{p.period}</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* CTA Purchase Button */}
            <TouchableOpacity
              style={styles.purchaseBtn}
              onPress={handlePurchase}
              disabled={purchasing}
              activeOpacity={0.8}
            >
              {purchasing ? (
                <ActivityIndicator color={theme.colors.dark.onPrimary} />
              ) : (
                <Text style={styles.purchaseBtnText}>Continue to Purchase</Text>
              )}
            </TouchableOpacity>

            {/* Restore Purchases & Legal Terms */}
            <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={purchasing}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              Subscriptions auto-renew unless cancelled at least 24 hours before expiration in your App Store / Google Play account settings.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.dark.surface,
    borderTopLeftRadius: theme.shapes.large * 1.5,
    borderTopRightRadius: theme.shapes.large * 1.5,
    maxHeight: '90%',
    padding: theme.spacing.lg,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.dark.onSurface,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.dark.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  featuresBox: {
    backgroundColor: theme.colors.dark.surfaceVariant,
    padding: theme.spacing.md,
    borderRadius: theme.shapes.large,
    gap: 8,
    marginBottom: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.dark.onSurface,
  },
  productsList: {
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.surfaceVariant,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: theme.shapes.large,
    padding: theme.spacing.md,
    position: 'relative',
  },
  productCardActive: {
    borderColor: theme.colors.dark.primary,
    backgroundColor: theme.colors.dark.primaryContainer + '33',
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: theme.colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  savingsBadgeText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.dark.onSurface,
  },
  productDesc: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
    marginTop: 2,
  },
  productRight: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.dark.primary,
  },
  productPeriod: {
    fontSize: 11,
    color: theme.colors.dark.onSurfaceVariant,
  },
  purchaseBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingVertical: 14,
    borderRadius: theme.shapes.large,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  purchaseBtnText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreText: {
    color: theme.colors.dark.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  legalText: {
    fontSize: 10,
    color: theme.colors.dark.outline,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 14,
  },
});
