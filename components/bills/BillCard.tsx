import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Wrench, Calendar, ChevronRight } from 'lucide-react-native';
import Card from '../ui/Card';
import Badge, { getUrgency, getDaysLeft } from '../ui/Badge';
import { Bill } from '../../types';
import { colors, fontSize, spacing } from '../../constants/theme';
import { format } from 'date-fns';

interface BillCardProps {
  bill: Bill;
}

export default function BillCard({ bill }: BillCardProps) {
  const router = useRouter();

  const dates = [
    { type: 'warranty' as const, date: bill.warranty_expiry, icon: <Shield size={14} color={colors.primary} /> },
    { type: 'amc' as const, date: bill.amc_renewal_date, icon: <Calendar size={14} color={colors.success} /> },
    { type: 'service' as const, date: bill.service_due_date, icon: <Wrench size={14} color={colors.warning} /> },
  ].filter((d) => d.date);

  const nearestDate = dates.reduce<string | undefined>((nearest, d) => {
    if (!nearest) return d.date;
    return new Date(d.date!) < new Date(nearest) ? d.date : nearest;
  }, undefined);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/bill/${bill.id}` as any)}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.vendor}>{bill.vendor_name || 'Unknown Vendor'}</Text>
            <ChevronRight size={16} color={colors.gray[400]} />
          </View>
          {nearestDate && <Badge urgency={getUrgency(nearestDate)} daysLeft={getDaysLeft(nearestDate)} />}
        </View>

        {dates.length > 0 && (
          <View style={styles.dates}>
            {dates.map(({ type, date, icon }) => (
              <View key={type} style={styles.dateRow}>
                {icon}
                <Text style={styles.dateLabel}>{typeLabel[type]}</Text>
                <Text style={styles.dateValue}>{format(new Date(date!), 'dd MMM yyyy')}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const typeLabel = {
  warranty: 'Warranty',
  amc: 'AMC',
  service: 'Service',
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  header: { marginBottom: 8 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  vendor: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
    flex: 1,
  },
  dates: { marginTop: 8, gap: 4 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    flex: 1,
  },
  dateValue: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    fontWeight: '500',
  },
});
