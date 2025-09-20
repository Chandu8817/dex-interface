import type { Token } from '../types/dex';
import { ethers } from 'ethers';

export const formatTokenAmount = (amount: string, decimals = 18) => {
  try {
    return ethers.parseUnits(amount || "0", decimals).toString();
  } catch (e) {
    return "0";
  }
};

export const formatDisplayBalance = (balance: string, decimals: number) => {
  try {
    return ethers.formatUnits(balance, decimals);
  } catch (e) {
    return "0";
  }
};

export const sortTokens = (tokenA: Token, tokenB: Token): [Token, Token] => {
  return [tokenA, tokenB].sort((a, b) =>
    a.id.toLowerCase() < b.id.toLowerCase() ? -1 : 1
  ) as [Token, Token];
};