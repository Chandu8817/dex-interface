import { useEffect, useState } from 'react';
import { ethers, JsonRpcSigner } from 'ethers';
import type { Token } from '../types';
import FACTORY_ABI from '../abis/Factory.json';
const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;

export function useFactory(signer: JsonRpcSigner | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  useEffect(() => {
    console.log("useEffect in useFactory - signer changed:", !!signer);
    if (signer) {
      try {
        if (!FACTORY_ADDRESS) {
          throw new Error("Factory contract address not configured");
        }

        console.log("Creating new Factory contract instance with address:", FACTORY_ADDRESS);
        const contractInstance = new ethers.Contract(
          FACTORY_ADDRESS,
          FACTORY_ABI,
          signer
        );

        console.log("Factory contract instance created:", contractInstance);
        setFactoryContract(contractInstance);
        setError(null);
      } catch (err) {
        console.error("Error creating Factory contract instance:", err);
        setError(err as Error);
      }
    } else {
      console.log("No signer available, setting contract to null");
      setFactoryContract(null);
    }
  }, [signer]);

  const getPoolAddress = async (tokenA: Token, tokenB: Token, feeTier: number): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

      if (!factoryContract) {
        throw new Error("Factory contract not initialized");
      }
      const poolAddress = await factoryContract.getPool(token0.address, token1.address, feeTier);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const code = await provider.getCode(poolAddress);

      return code !== '0x' ? poolAddress : ethers.ZeroAddress;
    } catch (err) {
      console.error('Error getting pool address:', err);
      setError(err as Error);
      return ethers.ZeroAddress;
    } finally {
      setIsLoading(false);
    }
  };

  const createPool = async (tokenA: Token, tokenB: Token, feeTier: number) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!factoryContract) {
        throw new Error("Factory contract not initialized");
      }

      const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
    
      const tx = await factoryContract.createPool(token0.address, token1.address, feeTier);
      await tx.wait();
      const newPoolAddress = await getPoolAddress(token0, token1, feeTier);
      console.log('Pool created at:', newPoolAddress);

      return { txHash: tx.hash, newPoolAddress };
    } catch (err) {
      console.error('Error creating pool:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getPoolAddress,
    createPool,
    isLoading,
    error,
  };
}
