import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import type { Token } from '../../shared/types';
import { usePositionManager } from '../../../hooks/usePositionManager';
import { useTokenBalance } from '../../shared/hooks';

export const useLiquidityPosition = (
  tokenA: Token | null,
  tokenB: Token | null,
  account: string | null | undefined,
  signer: any,
  fee: number
) => {
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const tokenABalance = useTokenBalance(tokenA, account, signer);
  const tokenBBalance = useTokenBalance(tokenB, account, signer);

  const { mint, increaseLiquidity } = usePositionManager(signer);

  const resetAmounts = useCallback(() => {
    setAmountA('');
    setAmountB('');
  }, []);

  const handleAddLiquidity = useCallback(async () => {
    if (!tokenA || !tokenB || !signer || !account) {
      setError('Missing required parameters');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Convert amounts to BigInt with proper decimals
      const amountAWei = ethers.parseUnits(
        amountA,
        tokenA.decimals
      );

      const amountBWei = ethers.parseUnits(amountB, tokenB.decimals);

      // Calculate min amounts with slippage
      const slippageFactor = BigInt(Math.floor((100 - slippage * 100)) * 100);
      const amountAMin = (BigInt(amountAWei.toString()) * slippageFactor) / 10000n;
      const amountBMin = (BigInt(amountBWei.toString()) * slippageFactor) / 10000n;

      // Calculate deadline
      const deadlineInSeconds = Math.floor(Date.now() / 1000) + deadline * 60;

      // Execute the transaction
      const tx = await mint(
        {
          token0: tokenA.id,
          token1: tokenB.id,
          fee,
          tickLower: 0,
          tickUpper: 0,
          amount0Desired: BigInt(amountAWei),
          amount1Desired: BigInt(amountBWei),
          amount0Min: BigInt(amountAMin),
          amount1Min: BigInt(amountBMin),
          recipient: account,
          deadline: deadlineInSeconds
        }
      );

      setTxHash(tx.hash);
      await tx.wait();

      // Refresh balances
      tokenABalance.fetchBalance();
      tokenBBalance.fetchBalance();

      return tx;
    } catch (err: any) {
      console.error('Error adding liquidity:', err);
      setError(err.message || 'Failed to add liquidity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [
    tokenA,
    tokenB,
    signer,
    account,
    amountA,
    amountB,
    slippage,
    deadline,
    fee,
    mint,
    tokenABalance,
    tokenBBalance,
  ]);

  return {
    amountA,
    amountB,
    setAmountA,
    setAmountB,
    slippage,
    setSlippage,
    deadline,
    setDeadline,
    isLoading,
    error,
    txHash,
    handleAddLiquidity,
    resetAmounts,
    tokenABalance: {
      ...tokenABalance,
      formattedBalance: tokenA
        ? tokenABalance.balance
          ? ethers.formatUnits(tokenABalance.balance, Number(tokenA.decimals))
          : '0'
        : '0',
    },
    tokenBBalance: {
      ...tokenBBalance,
      formattedBalance: tokenB
        ? tokenBBalance.balance
          ? ethers.formatUnits(tokenBBalance.balance, Number(tokenB.decimals))
          : '0'
        : '0',
    },
  };
};
