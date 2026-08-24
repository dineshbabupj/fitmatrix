import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme/theme';
import { usePremiumStatus } from '../../src/hooks/usePremiumStatus';
import { PaywallModal } from '../../src/components/PaywallModal';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const { isPremium, remainingScans, checkAccess, registerBarcodeScan, refreshEntitlements } = usePremiumStatus();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    // Check barcode access limits on entry
    checkAccess('barcode_scanner').then((res) => {
      if (!res.allowed) {
        setPaywallVisible(true);
      }
    });
  }, [isPremium]);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;

    const access = await checkAccess('barcode_scanner');
    if (!access.allowed) {
      setPaywallVisible(true);
      return;
    }

    setScanned(true);
    await registerBarcodeScan();

    // Navigate to food dashboard with scanned barcode
    router.replace({ pathname: '/food', params: { barcode: data } });
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={theme.colors.dark.outline} />
        <Text style={styles.permissionText}>Camera permission is needed to scan food barcodes.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
        }}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Scan Barcode</Text>
              {!isPremium && (
                <View style={styles.scansBadge}>
                  <Text style={styles.scansBadgeText}>
                    {remainingScans > 0 ? `${remainingScans} Free Scans Left` : 'Limit Reached'}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setPaywallVisible(true)} style={styles.proBtn}>
              <Ionicons name={isPremium ? 'checkmark-circle' : 'star'} size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanTarget} />
            <Text style={styles.scanHint}>Align barcode within the frame</Text>
          </View>
        </SafeAreaView>
      </CameraView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => {
          setPaywallVisible(false);
          if (!isPremium && remainingScans <= 0) {
            router.back();
          }
        }}
        onSuccess={() => {
          refreshEntitlements();
          setPaywallVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    color: theme.colors.dark.onSurface,
    textAlign: 'center',
    marginVertical: 24,
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: theme.colors.dark.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 16,
  },
  permissionBtnText: {
    color: theme.colors.dark.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backBtn: {
    padding: 12,
  },
  backBtnText: {
    color: theme.colors.dark.onSurfaceVariant,
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  closeBtn: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scansBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  scansBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  proBtn: {
    padding: 8,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: theme.colors.dark.primary,
    backgroundColor: 'transparent',
    borderRadius: 16,
    marginBottom: 24,
  },
  scanHint: {
    color: '#FFF',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
