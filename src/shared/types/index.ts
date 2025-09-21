export interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  balance?: string;
  allowance?: string;
}

export type TabType = 'add' | 'remove';

export interface TransactionSettings {
  slippage: number;
  deadline: number;
  multiCall: boolean;
}

export interface TokenAmount {
  token: Token | null;
  amount: string;
  usdValue?: string;
}

export interface Pool {
  address: string;
  token0: Token;
  token1: Token;
  fee: number;
  tvl: string;
  volume24h: string;
  fees24h: string;
}

export interface Position {
  id: string;
  pool: Pool;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  amount0: string;
  amount1: string;
  uncollectedFees0: string;
  uncollectedFees1: string;
}
