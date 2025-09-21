import { useState, useEffect, useCallback } from 'react';
import { ethers, JsonRpcSigner } from 'ethers';
import { useERC20 } from '../../../hooks/useERC20';
import type { Token } from '../types';

export const useTokenBalance = (
  token: Token | null,
  account: string | null | undefined,
  signer: JsonRpcSigner | null
) => {
  const [balance, setBalance] = useState<string>('0');
  const [allowance, setAllowance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { getBalance, getAllowance, getDecimal } = useERC20(signer as JsonRpcSigner);

  const fetchBalance = useCallback(async () => {
    if (!token || !account || !signer) {
      setBalance('0');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const balance = await getBalance(account, token.id,token.symbol);
      setBalance(balance.toString());
    } catch (err) {
      console.error(`Error fetching ${token.symbol} balance:`, err);
      setError('Failed to fetch token balance');
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  }, [token, account, signer, getBalance]);

  const fetchAllowance = useCallback(
    async (spender: string) => {
      if (!token || !account || !signer) {
        setAllowance('0');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const allowance = await getAllowance(account, spender,token.id,token.symbol);
        setAllowance(allowance.toString());
      } catch (err) {
        console.error(`Error fetching ${token.symbol} allowance:`, err);
        setError('Failed to fetch token allowance');
        setAllowance('0');
      } finally {
        setIsLoading(false);
      }
    },
    [token, account, signer, getAllowance]
  );

  const approve = useCallback(
    async (spender: string, amount: string) => {
      if (!token || !signer) {
        throw new Error('No token or signer available');
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const tokenContract = new ethers.Contract(
          token.id,
          [
            'function approve(address spender, uint256 amount) external returns (bool)',
          ],
          signer
        );

        const tx = await tokenContract.approve(
          spender,
          amount === 'max' ? ethers.MaxUint256 : amount
        );

        await tx.wait();
        await fetchAllowance(spender);
        return tx;
      } catch (err) {
        console.error(`Error approving ${token.symbol}:`, err);
        setError('Failed to approve token');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [token, signer, fetchAllowance]
  );

  // Fetch balance and allowance when token or account changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    allowance,
    isLoading,
    error,
    fetchBalance,
    fetchAllowance,
    approve,
    getDecimal,
  };
};

export default useTokenBalance;
