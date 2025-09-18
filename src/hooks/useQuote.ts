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

      // Convert amount to wei
      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);
      
      // Convert sqrtPriceLimitX96 to BigInt and ensure it's a valid uint160
      let sqrtPriceLimit: bigint;
      try {
        sqrtPriceLimit = BigInt(sqrtPriceLimitX96);
        // Ensure it's within uint160 range
        if (sqrtPriceLimit < 0n || sqrtPriceLimit > 2n ** 160n - 1n) {
          throw new Error("sqrtPriceLimitX96 out of range");
        }
      } catch (err) {
        
        throw new Error(`Invalid sqrtPriceLimitX96 value: ${sqrtPriceLimitX96}`);
      }
      
      console.log("Calling quoteExactInputSingle with params:", {
        tokenIn,
        tokenOut,
        fee,
        amountInWei: amountInWei.toString(),
        sqrtPriceLimit: sqrtPriceLimit.toString()
      });
      
      // Get the signer's address
      const signer = contract.runner as ethers.JsonRpcSigner;
      if (!signer) {
        throw new Error("No signer available");
      }
      
  
      
      // Call the contract with the proper signer
        const quote = await contract.quoteExactInputSingle.staticCall(
          {
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountInWei,
            fee: fee,
            sqrtPriceLimitX96: 0n,
          }
        );
      
      console.log("Quote successful, amountOut:", quote.amountOut.toString());
      
      return {
        amountOut: ethers.formatUnits(quote.amountOut.toString(), decimalsOut),
        amountOutWei: quote.amountOut.toString()
      };
    } catch (err: any) {
     
      
      let errorMessage = "Failed to get quote";
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
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
