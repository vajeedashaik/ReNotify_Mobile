import * as FileSystem from 'expo-file-system/legacy';
import { ExtractedBillData } from '../types';

const MINDEE_API_KEY = process.env.EXPO_PUBLIC_MINDEE_API_KEY!;
const MINDEE_MODEL_ID = process.env.EXPO_PUBLIC_MINDEE_MODEL_ID!;
const BASE_URL = 'https://api-v2.mindee.net/v2';
const ENQUEUE_URL = `${BASE_URL}/inferences/enqueue`;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function extractBillData(fileUri: string, mimeType: string): Promise<ExtractedBillData> {
  if (!MINDEE_API_KEY) throw new Error('EXPO_PUBLIC_MINDEE_API_KEY not set in .env');
  if (!MINDEE_MODEL_ID) throw new Error('EXPO_PUBLIC_MINDEE_MODEL_ID not set in .env');

  const ext = mimeType === 'application/pdf' ? 'pdf' : (mimeType.split('/')[1] || 'jpg');

  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (!fileInfo.exists) throw new Error(`File not found: ${fileUri}`);

  console.log('[Mindee v2] Enqueueing. Key prefix:', MINDEE_API_KEY?.slice(0, 8));

  // Step 1: Enqueue
  let enqueueResult: FileSystem.FileSystemUploadResult;
  try {
    enqueueResult = await FileSystem.uploadAsync(
      ENQUEUE_URL,
      fileUri,
      {
        fieldName: 'document',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        headers: { Authorization: `Token ${MINDEE_API_KEY}` },
        mimeType,
        name: `bill.${ext}`,
        parameters: { model_id: MINDEE_MODEL_ID },
      }
    );
  } catch (err: any) {
    throw new Error(`Network error: ${err?.message || String(err)}`);
  }

  console.log('[Mindee v2] Enqueue status:', enqueueResult.status);
  console.log('[Mindee v2] Enqueue body:', enqueueResult.body.slice(0, 400));

  if (enqueueResult.status < 200 || enqueueResult.status >= 300) {
    throw new Error(`Mindee enqueue error ${enqueueResult.status}: ${enqueueResult.body}`);
  }

  const enqueueData = JSON.parse(enqueueResult.body);

  // If result is already inline (some responses return synchronously)
  if (enqueueData?.inference?.result?.fields) {
    return parseFields(enqueueData.inference);
  }

  // Extract inference/job ID — try common field names
  const inferenceId =
    enqueueData?.id ||
    enqueueData?.inference?.id ||
    enqueueData?.job?.id ||
    enqueueData?.job_id;

  if (!inferenceId) {
    console.error('[Mindee v2] Full response:', JSON.stringify(enqueueData));
    throw new Error('No inference ID in Mindee response. Check logs for full response.');
  }

  console.log('[Mindee v2] Inference ID:', inferenceId);

  // Step 2: Poll until complete (max 30 attempts × 2s = 60s)
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    console.log('[Mindee v2] Polling attempt', i + 1);

    let pollResponse: Response;
    try {
      pollResponse = await fetch(`${BASE_URL}/inferences/${inferenceId}/result`, {
        headers: { Authorization: `Token ${MINDEE_API_KEY}` },
      });
    } catch (err: any) {
      throw new Error(`Poll network error: ${err?.message || String(err)}`);
    }

    if (!pollResponse.ok) {
      const body = await pollResponse.text().catch(() => '');
      throw new Error(`Mindee poll error ${pollResponse.status}: ${body}`);
    }

    const pollData = await pollResponse.json();
    const status = pollData?.status || pollData?.inference?.status || pollData?.job?.status;
    console.log('[Mindee v2] Job status:', status);

    if (pollData?.inference?.result?.fields || status === 'completed' || status === 'success') {
      return parseFields(pollData?.inference ?? pollData);
    }

    if (status === 'failed' || status === 'error') {
      throw new Error(`Mindee processing failed: ${JSON.stringify(pollData).slice(0, 300)}`);
    }
  }

  throw new Error('Mindee OCR timed out after 60 seconds');
}

function parseFields(inference: any): ExtractedBillData {
  const fields: Record<string, any> = inference?.result?.fields ?? {};
  console.log('[Mindee v2] Fields:', JSON.stringify(fields).slice(0, 600));

  const rawText = Object.entries(fields)
    .map(([k, v]: [string, any]) => `${k}: ${v?.value ?? (typeof v === 'string' ? v : JSON.stringify(v))}`)
    .join(' ');

  const get = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const val = fields[key]?.value ?? fields[key];
      if (val && typeof val === 'string' && val !== 'null') return val;
    }
    return undefined;
  };

  return {
    vendorName: get('supplier_name', 'vendor_name', 'merchant_name', 'company_name'),
    purchaseDate: formatDate(get('date', 'invoice_date', 'purchase_date', 'transaction_date')),
    warrantyExpiry:
      formatDate(get('warranty_expiry', 'warranty_end', 'valid_until')) ||
      extractDateNearKeyword(rawText, ['warranty', 'guarantee', 'valid till', 'valid upto']),
    amcRenewalDate:
      formatDate(get('amc_renewal', 'renewal_date', 'amc_date')) ||
      extractDateNearKeyword(rawText, ['amc', 'annual maintenance', 'renewal']),
    serviceDueDate:
      formatDate(get('service_due', 'next_service', 'service_date')) ||
      extractDateNearKeyword(rawText, ['next service', 'service due', 'service date']),
    rawText,
  };
}

function extractDateNearKeyword(text: string, keywords: string[]): string | undefined {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx === -1) continue;
    const window = text.substring(Math.max(0, idx - 20), idx + 100);
    const d = extractDate(window);
    if (d) return d;
  }
  return undefined;
}

function extractDate(text: string): string | undefined {
  const patterns = [
    /\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/,
    /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return undefined;
}

function formatDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return extractDate(value) ?? value;
}
