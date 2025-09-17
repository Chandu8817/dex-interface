
import { ethers, JsonRpcSigner } from 'ethers';
import POOL_ABI from '../abis/Pool.json';
import { useState } from 'react';


export function usePool(signer: JsonRpcSigner | null) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

 const initializePool = async (
  poolAddress: string,
  reserve1: bigint,
  reserve0: bigint,
 ) => {
  setLoading(true);
  setError(null);
  if (!signer) {
    setLoading(false);
    setError("Signer not provided");
    return;
  }

  if (!poolAddress) {
    setLoading(false);
    setError("Pool contract address not provided");
    return;
  }

  console.log("Creating new Pool contract instance with address:", poolAddress);
  const poolContract = new ethers.Contract(
    poolAddress!,
    POOL_ABI,
    signer
  );
   // Example: 1 WETH per 2000 USDC
 const sqrtPriceX96 = encodePriceSqrt(Number(reserve1), Number(reserve0));
 console.log(sqrtPriceX96.toString());
  const tx = await poolContract.initialize(sqrtPriceX96);
  try {
    await tx.wait();
    setLoading(false);
    return {txHash: tx.hash, success: true};
  } catch (err: any) {
  console.error("Error initializing pool:", err);
  setError(err.message || "Failed to initialize pool");
  setLoading(false);
  return {txHash: null, success: false};
 }
 }

 const isPoolInitialized = async (poolAddress: string) => {
  if (!signer) {
    return false;
  }
  if (!poolAddress) {
    return false;
  }
  const poolContract = new ethers.Contract(
    poolAddress,
    POOL_ABI,
    signer
  );
  const slot0 = await poolContract.slot0();
  return slot0.sqrtPriceX96 > 0;
 }


 // target price = token1 per token0
 function encodePriceSqrt(reserve1: number, reserve0: number): bigint {
   const price = reserve1 / reserve0;
   const sqrtPrice = Math.sqrt(price);
   return BigInt(Math.floor(sqrtPrice * 2 ** 96));
 }
 

 
  return {
    initializePool,
    isPoolInitialized,
    isLoading: loading,
    error,
  };
}
