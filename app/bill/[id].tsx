import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Edit2, Trash2, Shield, Wrench, Calendar, Clock } from 'lucide-react-native';
import { useBillsStore } from '../../stores/billsStore';
import Card from '../../components/ui/Card';
import Badge, { getUrgency, getDaysLeft } from '../../components/ui/Badge';
import ExtractedDataView from '../../components/bills/ExtractedDataView';
import { colors, fontSize, spacing } from '../../constants/theme';
import { format } from 'date-fns';
import { Bill, ReminderType } from '../../types';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { bills, deleteBill, updateBill } = useBillsStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const bill = bills.find((b) => b.id === id);

  const [vendorName, setVendorName] = useState(bill?.vendor_name ?? '');
  const [purchaseDate, setPurchaseDate] = useState(bill?.purchase_date ?? '');
  const [warrantyExpiry, setWarrantyExpiry] = useState(bill?.warranty_expiry ?? '');
  const [amcRenewalDate, setAmcRenewalDate] = useState(bill?.amc_renewal_date ?? '');
  const [serviceDueDate, setServiceDueDate] = useState(bill?.service_due_date ?? '');
  const [notes, setNotes] = useState(bill?.notes ?? '');

  useEffect(() => {
    if (bill) {
      setVendorName(bill.vendor_name ?? '');
      setPurchaseDate(bill.purchase_date ?? '');
      setWarrantyExpiry(bill.warranty_expiry ?? '');
      setAmcRenewalDate(bill.amc_renewal_date ?? '');
      setServiceDueDate(bill.service_due_date ?? '');
      setNotes(bill.notes ?? '');
    }
  }, [bill]);

  if (!bill) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Bill',
      'This will also delete all associated reminders. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            await deleteBill(bill.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    await updateBill(bill.id, {
      vendor_name: vendorName || undefined,
      purchase_date: purchaseDate || undefined,
      warranty_expiry: warrantyExpiry || undefined,
      amc_renewal_date: amcRenewalDate || undefined,
      service_due_date: serviceDueDate || undefined,
      notes: notes || undefined,
    });
    setIsEditing(false);
  };

  const reminderDates: { type: ReminderType; date: string | undefined; icon: React.ReactNode; label: string }[] = [
    { type: 'warranty', date: bill.warranty_expiry, icon: <Shield size={16} color={colors.primary} />, label: 'Warranty Expiry' },
    { type: 'amc', date: bill.amc_renewal_date, icon: <Calendar size={16} color={colors.success} />, label: 'AMC Renewal' },
    { type: 'service', date: bill.service_due_date, icon: <Wrench size={16} color={colors.warning} />, label: 'Service Due' },
  ].filter((d) => d.date);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={22} color={colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{bill.vendor_name || 'Bill Detail'}</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.iconButton}>
            <Edit2 size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.iconButton} disabled={isDeleting}>
            <Trash2 size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {bill.file_url && bill.file_url.match(/\.(jpg|jpeg|png|webp)/i) && (
          <Image source={{ uri: bill.file_url }} style={styles.billImage} resizeMode="cover" />
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Information</Text>
          {isEditing ? (
            <ExtractedDataView
              editable
              fields={[
                { label: 'Vendor Name', value: vendorName, onChange: setVendorName },
                { label: 'Purchase Date', value: purchaseDate, onChange: setPurchaseDate, placeholder: 'YYYY-MM-DD' },
                { label: 'Notes', value: notes, onChange: setNotes },
              ]}
            />
          ) : (
            <ExtractedDataView
              fields={[
                { label: 'Vendor Name', value: bill.vendor_name },
                { label: 'Purchase Date', value: bill.purchase_date },
                { label: 'Notes', value: bill.notes },
              ]}
            />
          )}
          {isEditing && (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          )}
        </Card>

        {reminderDates.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Reminder Dates</Text>
            <View style={styles.reminderList}>
              {reminderDates.map(({ type, date, icon, label }) => (
                <View key={type} style={styles.reminderRow}>
                  <View style={styles.reminderLeft}>
                    {icon}
                    <View style={styles.reminderInfo}>
                      <Text style={styles.reminderLabel}>{label}</Text>
                      <Text style={styles.reminderDate}>{format(new Date(date!), 'dd MMM yyyy')}</Text>
                    </View>
                  </View>
                  <Badge urgency={getUrgency(date)} daysLeft={getDaysLeft(date) >= 0 ? getDaysLeft(date) : undefined} />
                </View>
              ))}
            </View>
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Schedule</Text>
          {reminderDates.map(({ type, date, label }) => {
            if (!date) return null;
            const expiry = new Date(date);
            const offsets = [30, 7, 1, 0];
            return (
              <View key={type} style={styles.notifGroup}>
                <Text style={styles.notifGroupLabel}>{label}</Text>
                {offsets.map((days) => {
                  const trigger = days === 0 ? expiry : new Date(expiry.getTime() - days * 86400000);
                  const isPast = trigger < new Date();
                  return (
                    <View key={days} style={styles.notifRow}>
                      <Clock size={12} color={isPast ? colors.gray[400] : colors.primary} />
                      <Text style={[styles.notifText, isPast && styles.notifPast]}>
                        {days === 0 ? 'On the day' : `${days} days before`} — {format(trigger, 'dd MMM yyyy')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: { padding: spacing.xs, marginRight: spacing.sm },
  topBarTitle: { flex: 1, fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900] },
  topBarActions: { flexDirection: 'row', gap: spacing.xs },
  iconButton: { padding: spacing.sm },
  content: { padding: spacing.lg, paddingBottom: 40 },
  billImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: spacing.md },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnText: { color: colors.white, fontWeight: '600', fontSize: fontSize.base },
  reminderList: { gap: spacing.sm },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  reminderInfo: {},
  reminderLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[900] },
  reminderDate: { fontSize: fontSize.xs, color: colors.gray[400] },
  notifGroup: { marginBottom: spacing.md },
  notifGroupLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gray[600], marginBottom: spacing.xs },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifText: { fontSize: fontSize.xs, color: colors.gray[600] },
  notifPast: { color: colors.gray[400], textDecorationLine: 'line-through' },
});
