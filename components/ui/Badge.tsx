import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontSize } from '../../constants/theme';
import { UrgencyLevel } from '../../types';

interface BadgeProps {
  urgency: UrgencyLevel;
  label?: string;
  daysLeft?: number;
}

const urgencyConfig: Record<UrgencyLevel, { bg: string; text: string; label: string }> = {
  safe: { bg: '#D1FAE5', text: colors.success, label: 'Active' },
  warning: { bg: '#FEF3C7', text: colors.warning, label: 'Due Soon' },
  danger: { bg: '#FEE2E2', text: colors.danger, label: 'Urgent' },
  expired: { bg: colors.gray[100], text: colors.gray[400], label: 'Expired' },
};

export default function Badge({ urgency, label, daysLeft }: BadgeProps) {
  const config = urgencyConfig[urgency];
  const displayLabel = label ?? (daysLeft !== undefined
    ? daysLeft === 0 ? 'Today' : `${daysLeft}d left`
    : config.label);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{displayLabel}</Text>
    </View>
  );
}

export function getUrgency(expiryDateStr?: string): UrgencyLevel {
  if (!expiryDateStr) return 'expired';
  const now = new Date();
  const expiry = new Date(expiryDateStr);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays < 7) return 'danger';
  if (diffDays <= 30) return 'warning';
  return 'safe';
}

export function getDaysLeft(expiryDateStr?: string): number {
  if (!expiryDateStr) return -1;
  const now = new Date();
  const expiry = new Date(expiryDateStr);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
