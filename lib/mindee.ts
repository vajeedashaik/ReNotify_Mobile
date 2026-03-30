import { ExtractedBillData } from '../types';

const MINDEE_API_KEY = process.env.MINDEE_API_KEY!;

export async function extractBillData(fileUri: string, mimeType: string): Promise<ExtractedBillData> {
  const formData = new FormData();
  formData.append('document', {
    uri: fileUri,
    type: mimeType,
    name: 'bill',
  } as any);

  const response = await fetch(
    'https://api.mindee.net/v1/products/mindee/invoices/v4/predict',
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${MINDEE_API_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Mindee API error: ${response.status}`);
  }

  const data = await response.json();
  const prediction = data?.document?.inference?.prediction;

  const extracted: ExtractedBillData = {
    vendorName: prediction?.supplier_name?.value,
    purchaseDate: prediction?.date?.value,
    rawText: JSON.stringify(prediction),
  };

  const lineItems = prediction?.line_items || [];
  for (const item of lineItems) {
    const desc = (item.description || '').toLowerCase();
    if (desc.includes('warranty') && !extracted.warrantyExpiry) {
      extracted.warrantyExpiry = extractDateFromText(item.description);
    }
    if ((desc.includes('amc') || desc.includes('annual maintenance')) && !extracted.amcRenewalDate) {
      extracted.amcRenewalDate = extractDateFromText(item.description);
    }
    if ((desc.includes('service') || desc.includes('next service')) && !extracted.serviceDueDate) {
      extracted.serviceDueDate = extractDateFromText(item.description);
    }
  }

  return extracted;
}

function extractDateFromText(text: string): string | undefined {
  const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/;
  const match = text?.match(dateRegex);
  return match?.[0];
}
