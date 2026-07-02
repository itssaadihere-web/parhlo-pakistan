export const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'Rs. 0';
  const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (Number.isNaN(numericValue)) return 'Rs. 0';
  return `Rs. ${numericValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};
