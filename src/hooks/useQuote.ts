import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { JsonRpcSigner } from "ethers";
import QUOTE_ABI from "../abis/Quote.json";

// Contract address from environment variables
const QUOTE_ADDRESS = import.meta.env.VITE_QUOTE_ADDRESS;

export const useQuote = (signer: JsonRpcSigner | null) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("useEffect in useQuote - signer changed:", !!signer);
    if (signer) {
      try {
        if (!QUOTE_ADDRESS) {
          throw new Error("Quote contract address not configured");
        }
        
        console.log("Creating new Quote contract instance with address:", QUOTE_ADDRESS);
        const contractInstance = new ethers.Contract(
          QUOTE_ADDRESS,
          QUOTE_ABI,
          signer
        );
        
        console.log("Quote contract instance created:", contractInstance);
        setContract(contractInstance);
        setError(null);
      } catch (err) {
        console.error("Error creating Quote contract instance:", err);
        setError("Failed to initialize Quote contract");
      }
    } else {
      console.log("No signer available, setting contract to null");
      setContract(null);
    }
  }, [signer]);

  const quoteExactInputSingle = async (
    tokenIn: string,
    tokenOut: string,
    fee: number,
    amountIn: string,
    sqrtPriceLimitX96: string = '0',
    decimalsIn: number = 18,
    decimalsOut: number = 18
  ) => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    try {
      setLoading(true);
      setError(null);

      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);
      const sqrtPriceLimit = ethers.getBigInt(sqrtPriceLimitX96);

      const amountOut = await contract.quoteExactInputSingle.staticCall(
        tokenIn,
        tokenOut,
        fee,
        amountInWei,
        sqrtPriceLimit
      );

      return {
        amountOut: ethers.formatUnits(amountOut, decimalsOut),
        amountOutWei: amountOut.toString()
      };
    } catch (err: any) {
      console.error("Error in quoteExactInputSingle:", err);
      setError(err.message || "Failed to get quote");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const quoteExactOutputSingle = async (
    tokenIn: string,
    tokenOut: string,
    fee: number,
    amountIn: string,
    sqrtPriceLimitX96: string = '0',
    decimalsIn: number = 18,
    decimalsOut: number = 18
  ) => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    try {
      setLoading(true);
      setError(null);

      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);
      const sqrtPriceLimit = ethers.getBigInt(sqrtPriceLimitX96);

      const amountOut = await contract.quoteExactOutputSingle.staticCall(
        tokenIn,
        tokenOut,
        fee,
        amountInWei,
        sqrtPriceLimit
      );

      return {
        amountOut: ethers.formatUnits(amountOut, decimalsOut),
        amountInWei: amountIn.toString()
      };
    } catch (err: any) {
      console.error("Error in quoteExactOutputSingle:", err);
      setError(err.message || "Failed to get quote");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getQuote = async (
    tokenIn: string,
    tokenOut: string,
    fee: number,
    amountIn: string,
    decimalsIn: number = 18,
    decimalsOut: number = 18
  ) => {
    // For backward compatibility, default to quoteExactInputSingle
    return quoteExactInputSingle(tokenIn, tokenOut, fee, amountIn, '0', decimalsIn, decimalsOut);
  };

  return {
    // Main functions
    quoteExactInputSingle,
    quoteExactOutputSingle,
    getQuote, // For backward compatibility
    
    // State
    loading,
    error,
    isInitialized: !!contract,
  };
};
