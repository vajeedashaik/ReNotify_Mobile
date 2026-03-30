import { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Plus } from 'lucide-react-native';
import { useBillsStore } from '../../stores/billsStore';
import SummaryCard from '../../components/dashboard/SummaryCard';
import UpcomingReminders from '../../components/dashboard/UpcomingReminders';
import RecentBills from '../../components/dashboard/RecentBills';
import { colors, fontSize, spacing } from '../../constants/theme';

export default function DashboardScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { bills, isLoading, fetchBills, getDashboardStats } = useBillsStore();

  useEffect(() => {
    if (user?.id) {
      fetchBills(user.id);
    }
  }, [user?.id]);

  const stats = getDashboardStats();
  const firstName = user?.firstName ?? 'there';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{greeting}, {firstName}</Text>
          <Text style={styles.subtitle}>Here's your warranty overview</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <SummaryCard label="Total Bills" value={stats.totalBills} accentColor={colors.primary} />
              <SummaryCard label="Active" value={stats.activeReminders} accentColor={colors.success} />
              <SummaryCard label="Expiring Soon" value={stats.expiringSoon} accentColor={colors.warning} />
              <SummaryCard label="Expired" value={stats.expired} accentColor={colors.danger} />
            </View>

            <UpcomingReminders bills={bills} />
            <RecentBills bills={bills} />
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/upload')}
        activeOpacity={0.85}
      >
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 100 },
  header: { marginBottom: spacing.lg },
  greeting: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs / 2,
    marginBottom: spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
