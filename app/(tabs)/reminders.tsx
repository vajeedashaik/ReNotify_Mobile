import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Shield, Wrench, Calendar } from 'lucide-react-native';
import { useBillsStore } from '../../stores/billsStore';
import Badge, { getUrgency, getDaysLeft } from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { Bill, ReminderType } from '../../types';
import { colors, fontSize, spacing } from '../../constants/theme';
import { format } from 'date-fns';

type FilterTab = 'all' | 'upcoming' | 'expired';

interface ReminderItem {
  id: string;
  billId: string;
  vendorName: string;
  type: ReminderType;
  date: string;
  daysLeft: number;
}

const typeConfig: Record<ReminderType, { icon: (c: string) => React.ReactNode; label: string }> = {
  warranty: { icon: (c) => <Shield size={18} color={c} />, label: 'Warranty' },
  service: { icon: (c) => <Wrench size={18} color={c} />, label: 'Service' },
  amc: { icon: (c) => <Calendar size={18} color={c} />, label: 'AMC' },
};

const typeColor: Record<ReminderType, string> = {
  warranty: colors.primary,
  service: colors.warning,
  amc: colors.success,
};

function buildReminders(bills: Bill[]): ReminderItem[] {
  const items: ReminderItem[] = [];
  for (const bill of bills) {
    const entries: { type: ReminderType; date: string | undefined }[] = [
      { type: 'warranty', date: bill.warranty_expiry },
      { type: 'amc', date: bill.amc_renewal_date },
      { type: 'service', date: bill.service_due_date },
    ];
    for (const e of entries) {
      if (!e.date) continue;
      items.push({
        id: `${bill.id}-${e.type}`,
        billId: bill.id,
        vendorName: bill.vendor_name || 'Unknown',
        type: e.type,
        date: e.date,
        daysLeft: getDaysLeft(e.date),
      });
    }
  }
  return items.sort((a, b) => a.daysLeft - b.daysLeft);
}

export default function RemindersScreen() {
  const { user } = useUser();
  const { bills, isLoading, fetchBills } = useBillsStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    if (user?.id) fetchBills(user.id);
  }, [user?.id]);

  const allReminders = buildReminders(bills);

  const filtered = allReminders.filter((r) => {
    if (activeTab === 'upcoming') return r.daysLeft >= 0;
    if (activeTab === 'expired') return r.daysLeft < 0;
    return true;
  });

  const renderItem = ({ item }: { item: ReminderItem }) => {
    const config = typeConfig[item.type];
    const color = typeColor[item.type];
    return (
      <Card style={styles.reminderCard}>
        <View style={[styles.iconWrapper, { backgroundColor: `${color}20` }]}>
          {config.icon(color)}
        </View>
        <View style={styles.info}>
          <Text style={styles.vendor}>{item.vendorName}</Text>
          <Text style={styles.typeLabel}>{config.label}</Text>
          <Text style={styles.date}>{format(new Date(item.date), 'dd MMM yyyy')}</Text>
        </View>
        <Badge urgency={getUrgency(item.date)} daysLeft={item.daysLeft >= 0 ? item.daysLeft : undefined} />
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Reminders</Text>
        <View style={styles.tabs}>
          {(['all', 'upcoming', 'expired'] as FilterTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No reminders found"
              description={activeTab === 'expired' ? 'Nothing expired yet.' : 'Upload a bill to create reminders.'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: 0 },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.gray[900], marginBottom: spacing.md },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  activeTab: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[400] },
  activeTabText: { color: colors.white },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  info: { flex: 1 },
  vendor: { fontSize: fontSize.base, fontWeight: '600', color: colors.gray[900] },
  typeLabel: { fontSize: fontSize.xs, color: colors.gray[400], marginTop: 2 },
  date: { fontSize: fontSize.xs, color: colors.gray[600], marginTop: 2 },
});
