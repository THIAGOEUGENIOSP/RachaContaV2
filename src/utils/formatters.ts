/**
 * Format a number as Brazilian currency (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Parse an input value to format as currency
 */
export function parseInputValue(value: string): string {
  // Remove all non-numeric characters
  value = value.replace(/\D/g, '');
  
  // Format as currency
  if (value === '') return '';
  
  const amount = parseInt(value, 10) / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}