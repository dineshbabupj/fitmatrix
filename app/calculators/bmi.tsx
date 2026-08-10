import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BmiScreen } from '../../src/screens/BmiScreen';
import { theme } from '../../src/theme/theme';

export default function BmiStackScreen() {
  return (
    <View style={styles.container}>
      <BmiScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
});
