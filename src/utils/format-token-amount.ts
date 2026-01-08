import formatAmount from './format-amount';

const formatTokenAmount = (amount: number, symbol?: string) => {
  if (amount === 0) return `0.00${symbol ? ` ${symbol}` : ''}`;

  let decimals = Math.max(Math.ceil(Math.abs(Math.log10(amount))), 2);

  const formattedAmount = formatAmount(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return `${formattedAmount}${symbol ? ` ${symbol}` : ''}`;
};

export default formatTokenAmount;
