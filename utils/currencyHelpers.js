export const parsePrice = (value) => {
  if (value === undefined || value === null) return 0;
  let cleanValue = String(value).replace(/rs\.?/gi, '').replace(/pkr/gi, '');
  cleanValue = cleanValue.replace(/,/g, '');
  const numericValue = parseFloat(cleanValue.replace(/[^0-9.-]/g, ''));
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

export const formatCurrency = (value) => {
  const numericValue = parsePrice(value);
  return `Rs. ${numericValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};
