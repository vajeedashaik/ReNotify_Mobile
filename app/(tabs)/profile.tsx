import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { LogOut, Bell, FileText, Clock, AlertCircle } from 'lucide-react-native';
import { useBillsStore } from '../../stores/billsStore';
import { useUserStore } from '../../stores/userStore';
import Card from '../../components/ui/Card';
import { colors, fontSize, radius, spacing } from '../../constants/theme';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const { bills, fetchBills, getDashboardStats } = useBillsStore();
  const { notificationsEnabled, setNotificationsEnabled } = useUserStore();

  useEffect(() => {
    if (user?.id) fetchBills(user.id);
  }, [user?.id]);

  const stats = getDashboardStats();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const avatarInitials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <Card style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName || 'User'}</Text>
          <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
        </Card>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <FileText size={20} color={colors.primary} />
            <Text style={styles.statValue}>{stats.totalBills}</Text>
            <Text style={styles.statLabel}>Total Bills</Text>
          </View>
          <View style={styles.statBox}>
            <Bell size={20} color={colors.success} />
            <Text style={styles.statValue}>{stats.activeReminders}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statBox}>
            <Clock size={20} color={colors.warning} />
            <Text style={styles.statValue}>{stats.expiringSoon}</Text>
            <Text style={styles.statLabel}>Expiring Soon</Text>
          </View>
          <View style={styles.statBox}>
            <AlertCircle size={20} color={colors.danger} />
            <Text style={styles.statValue}>{stats.expired}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        <Card style={styles.settingsCard}>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Bell size={18} color={colors.gray[600]} />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.gray[200], true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <LogOut size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.gray[900], marginBottom: spacing.lg },
  avatarCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: '700', color: colors.white },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  email: { fontSize: fontSize.sm, color: colors.gray[400], marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  statLabel: { fontSize: 10, color: colors.gray[400], textAlign: 'center' },
  settingsCard: { marginBottom: spacing.lg },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.gray[400], textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  settingText: { fontSize: fontSize.base, color: colors.gray[900], fontWeight: '500' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: `${colors.danger}40`,
    borderRadius: radius.md,
    padding: 14,
    backgroundColor: `${colors.danger}08`,
  },
  signOutText: { fontSize: fontSize.base, fontWeight: '600', color: colors.danger },
});
