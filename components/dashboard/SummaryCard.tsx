import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../ui/Card';
import { colors, fontSize, spacing } from '../../constants/theme';

interface SummaryCardProps {
  label: string;
  value: number;
  accentColor?: string;
}

export default function SummaryCard({ label, value, accentColor = colors.primary }: SummaryCardProps) {
  return (
    <Card style={styles.card}>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    margin: spacing.xs / 2,
  },
  value: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'center',
    fontWeight: '500',
  },
});
