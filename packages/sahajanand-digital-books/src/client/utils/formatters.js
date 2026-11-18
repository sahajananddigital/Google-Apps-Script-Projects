/**
 * Format number as Indian Rupee currency (₹)
 */
export const formatINR = (amount) => {
  const num = parseFloat(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

/**
 * Format date to standard Indian localized format (e.g. 15 Apr 2026)
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Convert number into words (Indian numbering system: Lakh, Crore)
 */
export const numberToWordsINR = (num) => {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = parseFloat(num || 0);
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';

  const parts = n.toFixed(2).split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  const inWords = (n) => {
    let str = '';
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  let output = '';

  const crores = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;
  if (crores > 0) {
    output += inWords(crores) + 'Crore ';
  }

  const lakhs = Math.floor(integerPart / 100000);
  integerPart %= 100000;
  if (lakhs > 0) {
    output += inWords(lakhs) + 'Lakh ';
  }

  const thousands = Math.floor(integerPart / 1000);
  integerPart %= 1000;
  if (thousands > 0) {
    output += inWords(thousands) + 'Thousand ';
  }

  const hundreds = Math.floor(integerPart / 100);
  integerPart %= 100;
  if (hundreds > 0) {
    output += inWords(hundreds) + 'Hundred ';
  }

  if (integerPart > 0) {
    output += inWords(integerPart);
  }

  output = output.trim() + ' Rupees';

  if (decimalPart > 0) {
    output += ' and ' + inWords(decimalPart).trim() + ' Paise';
  }

  return output + ' Only';
};

export const amountToWords = numberToWordsINR;
