import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { FileText } from 'lucide-react-native';
import Card from '../ui/Card';
import { Bill } from '../../types';
import { colors, fontSize, spacing } from '../../constants/theme';
import EmptyState from '../ui/EmptyState';

interface RecentBillsProps {
  bills: Bill[];
}

export default function RecentBills({ bills }: RecentBillsProps) {
  const router = useRouter();
  const recent = bills.slice(0, 5);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Bills</Text>
      {recent.length === 0 ? (
        <EmptyState
          title="No bills yet"
          description="Upload your first bill to get started."
        />
      ) : (
        recent.map((bill) => (
          <TouchableOpacity
            key={bill.id}
            onPress={() => router.push(`/bill/${bill.id}` as any)}
            activeOpacity={0.7}
          >
            <Card style={styles.billCard}>
              <View style={styles.iconWrapper}>
                <FileText size={18} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.vendor}>{bill.vendor_name || 'Unknown Vendor'}</Text>
                <Text style={styles.date}>
                  Added {formatDistanceToNow(new Date(bill.created_at), { addSuffix: true })}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  billCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  info: { flex: 1 },
  vendor: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
});
