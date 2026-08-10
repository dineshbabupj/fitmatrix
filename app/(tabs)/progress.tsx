import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressScreen } from '../../src/screens/ProgressScreen';
import { theme } from '../../src/theme/theme';

export default function ProgressTab() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
});
