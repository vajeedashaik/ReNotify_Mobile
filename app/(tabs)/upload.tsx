import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, Image as ImageIcon, FileText, CloudUpload } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { extractBillData } from '../../lib/mindee';
import { useBillsStore } from '../../stores/billsStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ExtractedDataView from '../../components/bills/ExtractedDataView';
import { colors, fontSize, radius, spacing } from '../../constants/theme';
import { ExtractedBillData } from '../../types';

export default function UploadScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { addBill } = useBillsStore();

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [extracted, setExtracted] = useState<ExtractedBillData>({});
  const [vendorName, setVendorName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [amcRenewalDate, setAmcRenewalDate] = useState('');
  const [serviceDueDate, setServiceDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    const permissionResult = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant access in Settings.');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.8, base64: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setMimeType(asset.mimeType ?? 'image/jpeg');
      await runOCR(asset.uri, asset.mimeType ?? 'image/jpeg');
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFileUri(asset.uri);
      setMimeType('application/pdf');
      await runOCR(asset.uri, 'application/pdf');
    }
  };

  const runOCR = async (uri: string, type: string) => {
    setIsExtracting(true);
    try {
      const data = await extractBillData(uri, type);
      setExtracted(data);
      setVendorName(data.vendorName ?? '');
      setPurchaseDate(data.purchaseDate ?? '');
      setWarrantyExpiry(data.warrantyExpiry ?? '');
      setAmcRenewalDate(data.amcRenewalDate ?? '');
      setServiceDueDate(data.serviceDueDate ?? '');
    } catch (e) {
      Alert.alert('OCR Failed', 'Could not extract data. Please fill in manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      let fileUrl: string | undefined;

      if (fileUri) {
        const filename = `${user.id}/${Date.now()}.${mimeType.split('/')[1]}`;
        const response = await fetch(fileUri);
        const blob = await response.blob();
        const { data, error } = await supabase.storage
          .from('bills')
          .upload(filename, blob, { contentType: mimeType });

        if (!error && data) {
          const { data: urlData } = supabase.storage.from('bills').getPublicUrl(data.path);
          fileUrl = urlData.publicUrl;
        }
      }

      const bill = await addBill({
        user_id: user.id,
        file_url: fileUrl,
        vendor_name: vendorName || undefined,
        purchase_date: purchaseDate || undefined,
        warranty_expiry: warrantyExpiry || undefined,
        amc_renewal_date: amcRenewalDate || undefined,
        service_due_date: serviceDueDate || undefined,
        extracted_text: extracted.rawText,
        notes: notes || undefined,
        original_filename: undefined,
      });

      if (bill) {
        Alert.alert('Saved!', 'Bill saved and reminders scheduled.', [
          { text: 'View Bill', onPress: () => router.push(`/bill/${bill.id}` as any) },
          { text: 'Go Home', onPress: () => router.replace('/(tabs)') },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Save Failed', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Upload Bill</Text>
        <Text style={styles.subtitle}>Snap or upload a bill to extract renewal dates</Text>

        {!fileUri ? (
          <View style={styles.uploadZone}>
            <CloudUpload size={40} color={colors.gray[400]} />
            <Text style={styles.uploadText}>Choose how to upload</Text>
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadOption} onPress={() => handlePickImage('camera')}>
                <Camera size={20} color={colors.primary} />
                <Text style={styles.optionText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOption} onPress={() => handlePickImage('gallery')}>
                <ImageIcon size={20} color={colors.primary} />
                <Text style={styles.optionText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOption} onPress={handlePickDocument}>
                <FileText size={20} color={colors.primary} />
                <Text style={styles.optionText}>PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.preview}>
            {mimeType.startsWith('image') && (
              <Image source={{ uri: fileUri }} style={styles.previewImage} resizeMode="cover" />
            )}
            <TouchableOpacity onPress={() => setFileUri(null)} style={styles.changeFile}>
              <Text style={styles.changeFileText}>Change file</Text>
            </TouchableOpacity>
          </View>
        )}

        {isExtracting && (
          <Card style={styles.extractingCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.extractingText}>Extracting data from bill...</Text>
          </Card>
        )}

        {(fileUri || vendorName) && !isExtracting && (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Bill Details</Text>
            <Text style={styles.formSubtitle}>Review and edit the extracted information</Text>

            <View style={styles.fields}>
              {[
                { label: 'Vendor / Product Name', value: vendorName, onChange: setVendorName, placeholder: 'e.g. Samsung TV' },
                { label: 'Purchase Date', value: purchaseDate, onChange: setPurchaseDate, placeholder: 'YYYY-MM-DD' },
                { label: 'Warranty Expiry', value: warrantyExpiry, onChange: setWarrantyExpiry, placeholder: 'YYYY-MM-DD' },
                { label: 'AMC Renewal Date', value: amcRenewalDate, onChange: setAmcRenewalDate, placeholder: 'YYYY-MM-DD' },
                { label: 'Service Due Date', value: serviceDueDate, onChange: setServiceDueDate, placeholder: 'YYYY-MM-DD' },
              ].map((field) => (
                <View key={field.label} style={styles.field}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              ))}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes..."
                  placeholderTextColor={colors.gray[400]}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <Button
              title="Save Bill"
              onPress={handleSave}
              isLoading={isSaving}
              style={styles.saveButton}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  subtitle: { fontSize: fontSize.sm, color: colors.gray[400], marginBottom: spacing.lg },
  uploadZone: {
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  uploadText: { fontSize: fontSize.base, color: colors.gray[600], marginTop: spacing.sm, marginBottom: spacing.lg, fontWeight: '500' },
  uploadButtons: { flexDirection: 'row', gap: spacing.sm },
  uploadOption: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  optionText: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  preview: { marginBottom: spacing.lg },
  previewImage: { width: '100%', height: 200, borderRadius: radius.lg },
  changeFile: { alignItems: 'center', marginTop: spacing.sm },
  changeFileText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  extractingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  extractingText: { fontSize: fontSize.base, color: colors.gray[600] },
  formCard: { marginBottom: spacing.lg },
  formTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gray[900], marginBottom: 4 },
  formSubtitle: { fontSize: fontSize.xs, color: colors.gray[400], marginBottom: spacing.md },
  fields: { gap: spacing.md },
  field: {},
  fieldLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.gray[600], marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: radius.md,
    padding: 14,
    fontSize: fontSize.base,
    color: colors.gray[900],
    backgroundColor: colors.white,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  saveButton: { marginTop: spacing.md },
});
