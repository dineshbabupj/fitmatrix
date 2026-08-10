import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const AboutScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={80} color="#4CAF50" />
        <Text style={styles.appName}>FitMetrics</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.heartText}>Made with ❤️</Text>
      </View>

      <View style={styles.disclaimerCard}>
        <Ionicons name="information-circle-outline" size={28} color="#F44336" />
        <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          All calculations are estimates. Consult a doctor for medical advice.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { padding: 24, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 24 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginTop: 12 },
  version: { fontSize: 14, color: '#888', marginTop: 4 },
  heartText: { fontSize: 16, color: '#4CAF50', fontWeight: '600', marginTop: 12 },
  disclaimerCard: {
    backgroundColor: '#2A1818',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  disclaimerTitle: { fontSize: 16, fontWeight: 'bold', color: '#FF8A80', marginTop: 8, marginBottom: 4 },
  disclaimerText: { fontSize: 14, color: '#FF8A80', textAlign: 'center' },
});
