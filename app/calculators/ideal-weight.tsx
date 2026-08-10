import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IdealWeightScreen } from '../../src/screens/IdealWeightScreen';
import { theme } from '../../src/theme/theme';

export default function IdealWeightStackScreen() {
  return (
    <View style={styles.container}>
      <IdealWeightScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
});
