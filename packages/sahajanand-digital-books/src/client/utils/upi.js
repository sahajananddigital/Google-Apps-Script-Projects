/**
 * Build dynamic UPI Pay Link
 * Format: upi://pay?pa={vpa}&pn={name}&tn={note}&am={amount}&cu=INR
 */
export const buildUpiDeepLink = ({
  pa = '',
  pn = '',
  tn = 'Payment',
  am = 0,
}) => {
  const cleanAmount = parseFloat(am || 0).toFixed(2);
  const encodedName = encodeURIComponent(pn);
  const encodedNote = encodeURIComponent(tn);
  return `upi://pay?pa=${pa}&pn=${encodedName}&tn=${encodedNote}&cu=INR&am=${cleanAmount}`;
};

/**
 * Generate UPI QR code image URL
 */
export const getUpiQrCodeUrl = (params, size = 150) => {
  const upiUrl = buildUpiDeepLink(params);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUrl)}`;
};
