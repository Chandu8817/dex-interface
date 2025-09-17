import { useCallback, useEffect, useState } from 'react';
import type { Token } from '../types';
import tokens from '../data/tokens.json';

// Common tokens that will be available in the app
const COMMON_TOKENS: Token[] = tokens;

export function useTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real app, you would fetch from a token list URL or your backend
      // For now, we'll use the common tokens list
      setTokens(COMMON_TOKENS);

    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tokens'));

      // Return common tokens as fallback
      setTokens(COMMON_TOKENS);

    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // Find token by address
  const getTokenByAddress = useCallback((address: string): Token | undefined => {
    return tokens.find(token => token.address.toLowerCase() === address.toLowerCase());
  }, [tokens]);

  // Find token by symbol
  const getTokenBySymbol = useCallback((symbol: string): Token | undefined => {
    return tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
  }, [tokens]);

  return {
    tokens,
    isLoading,
    error,
    getTokenByAddress,
    getTokenBySymbol,
    refetch: fetchTokens
  };
}
