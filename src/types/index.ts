export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  chainId?: number;
}

export interface Pool {
  token0: Token;
  token1: Token;
  fee: number;
  tvl: string;
  volume24h: string;
  feeTier: string;
  address?: string;
}
