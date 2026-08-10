import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BmrScreen } from '../../src/screens/BmrScreen';
import { theme } from '../../src/theme/theme';

export default function BmrStackScreen() {
  return (
    <View style={styles.container}>
      <BmrScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
});
