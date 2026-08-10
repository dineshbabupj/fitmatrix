import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MacroScreen } from '../../src/screens/MacroScreen';
import { theme } from '../../src/theme/theme';

export default function MacroStackScreen() {
  return (
    <View style={styles.container}>
      <MacroScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
});
