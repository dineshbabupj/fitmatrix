import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BodyFatScreen } from '../../src/screens/BodyFatScreen';
import { theme } from '../../src/theme/theme';

export default function BodyFatStackScreen() {
  return (
    <View style={styles.container}>
      <BodyFatScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
});
