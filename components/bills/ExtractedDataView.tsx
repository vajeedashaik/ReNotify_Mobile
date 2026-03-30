import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../constants/theme';

interface Field {
  label: string;
  value?: string;
  onChange?: (text: string) => void;
  placeholder?: string;
}

interface ExtractedDataViewProps {
  fields: Field[];
  editable?: boolean;
}

export default function ExtractedDataView({ fields, editable = false }: ExtractedDataViewProps) {
  return (
    <View style={styles.container}>
      {fields.map((field) => (
        <View key={field.label} style={styles.field}>
          <Text style={styles.label}>{field.label}</Text>
          {editable ? (
            <TextInput
              style={styles.input}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              placeholder={field.placeholder ?? `Enter ${field.label.toLowerCase()}`}
              placeholderTextColor={colors.gray[400]}
            />
          ) : (
            <Text style={[styles.value, !field.value && styles.empty]}>
              {field.value || 'Not detected'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  field: {},
  label: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: fontSize.base,
    color: colors.gray[900],
    fontWeight: '500',
  },
  empty: {
    color: colors.gray[400],
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    padding: 12,
    fontSize: fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
});
