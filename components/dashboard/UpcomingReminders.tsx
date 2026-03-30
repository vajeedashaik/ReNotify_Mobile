import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Wrench, Calendar } from 'lucide-react-native';
import Card from '../ui/Card';
import Badge, { getUrgency, getDaysLeft } from '../ui/Badge';
import { Bill, ReminderType } from '../../types';
import { colors, fontSize, spacing } from '../../constants/theme';
import EmptyState from '../ui/EmptyState';

interface UpcomingRemindersProps {
  bills: Bill[];
}

interface ReminderItem {
  billId: string;
  vendorName: string;
  type: ReminderType;
  date: string;
  daysLeft: number;
}

const typeConfig: Record<ReminderType, { icon: React.ReactNode; label: string }> = {
  warranty: { icon: <Shield size={18} color={colors.primary} />, label: 'Warranty' },
  service: { icon: <Wrench size={18} color={colors.warning} />, label: 'Service' },
  amc: { icon: <Calendar size={18} color={colors.success} />, label: 'AMC' },
};

export default function UpcomingReminders({ bills }: UpcomingRemindersProps) {
  const router = useRouter();

  const reminders: ReminderItem[] = [];
  for (const bill of bills) {
    const entries: { type: ReminderType; date: string | undefined }[] = [
      { type: 'warranty', date: bill.warranty_expiry },
      { type: 'amc', date: bill.amc_renewal_date },
      { type: 'service', date: bill.service_due_date },
    ];
    for (const e of entries) {
      if (!e.date) continue;
      const days = getDaysLeft(e.date);
      if (days >= 0 && days <= 30) {
        reminders.push({
          billId: bill.id,
          vendorName: bill.vendor_name || 'Unknown',
          type: e.type,
          date: e.date,
          daysLeft: days,
        });
      }
    }
  }

  reminders.sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Expiring This Month</Text>
      {reminders.length === 0 ? (
        <EmptyState
          title="No upcoming expirations"
          description="You're all caught up for the next 30 days."
        />
      ) : (
        reminders.slice(0, 5).map((item, index) => {
          const config = typeConfig[item.type];
          return (
            <TouchableOpacity
              key={`${item.billId}-${item.type}-${index}`}
              onPress={() => router.push(`/bill/${item.billId}` as any)}
              activeOpacity={0.7}
            >
              <Card style={styles.reminderCard}>
                <View style={styles.iconWrapper}>{config.icon}</View>
                <View style={styles.info}>
                  <Text style={styles.vendor}>{item.vendorName}</Text>
                  <Text style={styles.type}>{config.label}</Text>
                </View>
                <Badge urgency={getUrgency(item.date)} daysLeft={item.daysLeft} />
              </Card>
            </TouchableOpacity>
          );
        })
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
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.gray[100],
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
  type: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
});
