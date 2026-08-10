import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface InputCardProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suffix?: string;
  placeholder?: string;
  error?: string;
}

export const InputCard: React.FC<InputCardProps> = ({
  label,
  value,
  onChangeText,
  suffix,
  placeholder,
  error,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label} allowFontScaling={true}>
        {label}
      </Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            if (text === '' || /^\d*\.?\d*$/.test(text)) {
              onChangeText(text);
            }
          }}
          keyboardType="decimal-pad"
          placeholder={placeholder || 'Enter value'}
          placeholderTextColor="#888888"
          accessibilityLabel={`${label}${suffix ? ` in ${suffix}` : ''}`}
          accessibilityHint={`Type numeric value for ${label}`}
          allowFontScaling={true}
        />
        {suffix && (
          <Text style={styles.suffix} allowFontScaling={true}>
            {suffix}
          </Text>
        )}
      </View>
      {error && (
        <Text
          style={styles.errorText}
          allowFontScaling={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E3DC',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2C28',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#424940',
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  suffix: {
    color: '#81C784',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  errorText: {
    color: '#EF5350',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
