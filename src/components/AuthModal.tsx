import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserAuthStore } from '../store/userAuthStore';
import { supabaseAuthService } from '../services/auth/supabaseAuthService';
import { cloudSyncService } from '../services/sync/cloudSyncService';

type AuthMethod = 'google' | 'email';

export const AuthModal: React.FC = () => {
  const { isAuthModalVisible, closeAuthModal, setGuestMode } = useUserAuthStore();

  const [activeTab, setActiveTab] = useState<AuthMethod>('google');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isAuthModalVisible) return null;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const res = await supabaseAuthService.signInWithGoogle();
    setLoading(false);

    if (res.success) {
      Alert.alert('Signed In 🌐', res.message);
      closeAuthModal();
      cloudSyncService.syncAllData();
    } else {
      Alert.alert('Google Auth Error', res.message);
    }
  };

  // Handle Email Login
  const handleEmailLogin = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await supabaseAuthService.signInWithEmail(email);
    setLoading(false);

    if (res.success) {
      Alert.alert('Success ✉️', res.message);
      closeAuthModal();
      cloudSyncService.syncAllData();
    } else {
      Alert.alert('Login Error', res.message);
    }
  };

  const handleSkipGuest = () => {
    setGuestMode();
  };

  return (
    <Modal
      visible={isAuthModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeAuthModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="shield-checkmark" size={26} color="#4CAF50" />
              <Text style={styles.headerTitle}>FitMetrics Account</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={closeAuthModal}>
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Sign in to auto-backup your workouts, meals & progress to Cloud ☁️
          </Text>

          {/* Auth Method Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'google' && styles.tabActive]}
              onPress={() => setActiveTab('google')}
            >
              <Ionicons
                name="logo-google"
                size={16}
                color={activeTab === 'google' ? '#4CAF50' : '#888'}
              />
              <Text
                style={[styles.tabText, activeTab === 'google' && styles.tabTextActive]}
              >
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'email' && styles.tabActive]}
              onPress={() => setActiveTab('email')}
            >
              <Ionicons
                name="mail"
                size={16}
                color={activeTab === 'email' ? '#4CAF50' : '#888'}
              />
              <Text
                style={[styles.tabText, activeTab === 'email' && styles.tabTextActive]}
              >
                Email
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.bodyContent}>
            {/* 2. Google Sign-In View */}
            {activeTab === 'google' && (
              <View style={styles.methodSection}>
                <Text style={styles.inputLabel}>Sign in with your Google Account</Text>
                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 3. Email View */}
            {activeTab === 'email' && (
              <View style={styles.methodSection}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleEmailLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionBtnText}>Sign In with Email</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Guest / Skip Option */}
            <View style={styles.footerDivider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.guestBtn} onPress={handleSkipGuest}>
              <Text style={styles.guestBtnText}>Continue as Guest (Offline Mode) ⏭️</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    color: '#AAA',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#121212',
  },
  tabText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#4CAF50',
  },
  bodyContent: {
    paddingBottom: 20,
  },
  methodSection: {
    gap: 12,
  },
  inputLabel: {
    color: '#EEE',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryCodeBadge: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  countryCodeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  textInput: {
    backgroundColor: '#2A2A2A',
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  otpInput: {
    backgroundColor: '#2A2A2A',
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  hintText: {
    color: '#888',
    fontSize: 12,
    marginTop: -4,
  },
  actionBtn: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    color: '#4CAF50',
    fontSize: 13,
  },
  googleBtn: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 10,
  },
  googleBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  orText: {
    color: '#666',
    paddingHorizontal: 10,
    fontSize: 12,
  },
  guestBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  guestBtnText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
