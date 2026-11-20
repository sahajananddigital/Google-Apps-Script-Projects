/**
 * Application-wide Currency and Localization Formatters
 */

let currentAppCurrency = 'INR';

export const CURRENCY_CONFIG = {
  INR: { locale: 'en-IN', symbol: '₹', name: 'Rupees', subName: 'Paise' },
  USD: { locale: 'en-US', symbol: '$', name: 'Dollars', subName: 'Cents' },
  EUR: { locale: 'en-IE', symbol: '€', name: 'Euros', subName: 'Cents' },
  GBP: { locale: 'en-GB', symbol: '£', name: 'Pounds', subName: 'Pence' },
  AED: { locale: 'en-AE', symbol: 'AED', name: 'Dirhams', subName: 'Fils' },
  CAD: { locale: 'en-CA', symbol: 'CA$', name: 'Dollars', subName: 'Cents' },
  AUD: { locale: 'en-AU', symbol: 'A$', name: 'Dollars', subName: 'Cents' },
  SGD: { locale: 'en-SG', symbol: 'SG$', name: 'Dollars', subName: 'Cents' },
  JPY: { locale: 'ja-JP', symbol: '¥', name: 'Yen', subName: 'Sen' },
  SAR: { locale: 'ar-SA', symbol: 'SAR', name: 'Riyals', subName: 'Halalas' },
  QAR: { locale: 'ar-QA', symbol: 'QAR', name: 'Riyals', subName: 'Dirhams' },
};

/**
 * Configure global active currency from application settings
 */
export const setAppCurrency = (currency) => {
  if (currency && typeof currency === 'string') {
    currentAppCurrency = currency.trim();
  }
};

/**
 * Get current active currency code
 */
export const getAppCurrency = () => currentAppCurrency;

/**
 * Get visual currency symbol for UI labels and headers
 */
export const getCurrencySymbol = (currency = currentAppCurrency) => {
  const code = (currency || 'INR').toUpperCase();
  if (CURRENCY_CONFIG[code]) return CURRENCY_CONFIG[code].symbol;
  return currency || '₹';
};

/**
 * Format number dynamically according to configured currency
 */
export const formatCurrency = (amount, currency = currentAppCurrency) => {
  const num = parseFloat(amount || 0);
  const currCode = (currency || 'INR').toUpperCase();
  const config = CURRENCY_CONFIG[currCode];

  try {
    const locale = config ? config.locale : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currCode,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  } catch (e) {
    const symbol = config ? config.symbol : currCode;
    return `${symbol} ${num.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  }
};

/**
 * Backwards-compatible alias for formatCurrency
 */
export const formatINR = (amount, currency = currentAppCurrency) => {
  return formatCurrency(amount, currency);
};

/**
 * Format date to standard localized format (e.g. 15 Apr 2026)
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

const ONES = [
  '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
  'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
  'Seventeen ', 'Eighteen ', 'Nineteen '
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const convertUnder1000 = (n) => {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + 'Hundred ';
    n %= 100;
  }
  if (n > 19) {
    str += TENS[Math.floor(n / 10)] + ' ' + ONES[n % 10];
  } else if (n > 0) {
    str += ONES[n];
  }
  return str;
};

/**
 * Convert number into words using Indian Numbering System (Lakh, Crore)
 */
export const numberToWordsINR = (num) => {
  const n = parseFloat(num || 0);
  if (isNaN(n) || n === 0) return 'Zero Rupees Only';

  const parts = n.toFixed(2).split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  const inWords = (val) => {
    let str = '';
    if (val > 19) {
      str += TENS[Math.floor(val / 10)] + ' ' + ONES[val % 10];
    } else {
      str += ONES[val];
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

/**
 * Convert number to words in standard International format (Millions, Billions)
 */
export const numberToWordsInternational = (num, currency = 'USD') => {
  const n = parseFloat(num || 0);
  const currCode = (currency || 'USD').toUpperCase();
  const config = CURRENCY_CONFIG[currCode] || { name: currCode, subName: 'Cents' };

  if (isNaN(n) || n === 0) return `Zero ${config.name} Only`;

  const parts = n.toFixed(2).split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let output = '';

  const billions = Math.floor(integerPart / 1000000000);
  integerPart %= 1000000000;
  if (billions > 0) {
    output += convertUnder1000(billions) + 'Billion ';
  }

  const millions = Math.floor(integerPart / 1000000);
  integerPart %= 1000000;
  if (millions > 0) {
    output += convertUnder1000(millions) + 'Million ';
  }

  const thousands = Math.floor(integerPart / 1000);
  integerPart %= 1000;
  if (thousands > 0) {
    output += convertUnder1000(thousands) + 'Thousand ';
  }

  if (integerPart > 0) {
    output += convertUnder1000(integerPart);
  }

  output = output.trim() + ` ${config.name}`;

  if (decimalPart > 0) {
    output += ' and ' + convertUnder1000(decimalPart).trim() + ` ${config.subName}`;
  }

  return output + ' Only';
};

/**
 * General amount-to-words function that switches according to currency
 */
export const amountToWords = (num, currency = currentAppCurrency) => {
  const currCode = (currency || 'INR').toUpperCase();
  if (currCode === 'INR') {
    return numberToWordsINR(num);
  }
  return numberToWordsInternational(num, currCode);
};
