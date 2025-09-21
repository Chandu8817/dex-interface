import { BigNumber } from 'ethers';

export const formatCurrency = (value: string | number, decimals: number = 2): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

export const formatTokenAmount = (
  amount: string | BigNumber,
  decimals: number = 18,
  displayDecimals: number = 6
): string => {
  if (!amount) return '0';
  
  let formattedAmount: string;
  
  if (typeof amount === 'string') {
    formattedAmount = amount;
  } else {
    formattedAmount = amount.toString();
  }
  
  // If the amount is in wei, format it to ether
  if (decimals > 0) {
    const divisor = BigNumber.from(10).pow(decimals);
    const whole = BigNumber.from(formattedAmount).div(divisor);
    const fraction = BigNumber.from(formattedAmount).mod(divisor);
    
    if (fraction.isZero() || displayDecimals === 0) {
      return whole.toString();
    }
    
    const fractionStr = fraction.toString().padStart(decimals, '0').substring(0, displayDecimals);
    return `${whole}.${fractionStr}`.replace(/\.?0+$/, '');
  }
  
  return formattedAmount;
};

export const formatUSD = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

export const formatPercentage = (value: string | number, decimals: number = 2): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0%';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(numValue / 100);
};

export const shortenAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
