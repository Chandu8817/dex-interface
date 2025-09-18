import { ethers, JsonRpcSigner } from "ethers";
import POOL_ABI from "../abis/Pool.json";
import { useState } from "react";
// import { encodeSqrtRatioX96 } from "../utils";

export function usePool(signer: JsonRpcSigner | null) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const initializePool = async (
    poolAddress: string,
    reserve0: bigint, // token0 (sorted)
    reserve1: bigint  // token1 (sorted)
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

    console.log("Creating Pool instance:", poolAddress);
    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, signer);

    // Correct encoding: price = reserve1/reserve0 (token1 per token0)
    // ratio with decimals considered
   
// const ratio = Number(reserve1) / Number(reserve0);  

// correct formula
const amount1 = 4500_000000n;        // USDC (6 decimals)
const amount0 = 1_000000000000000000n; // WETH (18 decimals)

const sqrtPriceX96 = encodeSqrtRatioX96(amount1, amount0);
console.log(sqrtPriceX96.toString());


console.log(sqrtPriceX96.toString());
    debugger
    try {
      const tx = await poolContract.initialize(sqrtPriceX96);
      await tx.wait();
      setLoading(false);
      return { txHash: tx.hash, success: true };
    } catch (err: any) {
      console.error("Error initializing pool:", err);
      setError(err.message || "Failed to initialize pool");
      setLoading(false);
      return { txHash: null, success: false };
    }
  };

  const isPoolInitialized = async (poolAddress: string) => {
    if (!signer || !poolAddress) return false;
    const poolContract = new ethers.Contract(poolAddress, POOL_ABI, signer);
    const slot0 = await poolContract.slot0();
    return slot0.sqrtPriceX96 > 0n;
  };

 // target price = token1 per token0
 function encodeSqrtRatioX96(amount1: bigint, amount0: bigint) {
  if (amount0 === 0n) throw new Error("amount0 cannot be 0");
  const ratio = Number(amount1) / Number(amount0);
  const sqrt = Math.sqrt(ratio);
  const Q96 = 2 ** 96;
  return BigInt(Math.floor(sqrt * Q96));
}

 
  return {
    initializePool,
    isPoolInitialized,
    isLoading: loading,
    error,
  };
}
