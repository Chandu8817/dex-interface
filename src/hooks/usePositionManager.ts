import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { JsonRpcSigner } from "ethers";
import POSITION_MANAGER_ABI from "../abis/PositionManager.json";

// Types
type MintParams = {
  token0: string;
  token1: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  recipient: string;
  deadline: number;
};

type IncreaseLiquidityParams = {
  tokenId: bigint;
  amount0Desired: bigint;
  amount1Desired: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: number;
};

type DecreaseLiquidityParams = {
  tokenId: bigint;
  liquidity: bigint;
  amount0Min: bigint;
  amount1Min: bigint;
  deadline: number;
};

type CollectParams = {
  tokenId: bigint;
  recipient: string;
  amount0Max: bigint;
  amount1Max: bigint;
};

// Contract address from environment variables or default
const POSITION_MANAGER_ADDRESS = import.meta.env.VITE_POSITION_MANAGER_ADDRESS || 
  "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"; // Mainnet address

export const usePositionManager = (signer: JsonRpcSigner | null) => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize contract
  useEffect(() => {
    if (!signer) {
      setContract(null);
      return;
    }

    try {
      const contractInstance = new ethers.Contract(
        POSITION_MANAGER_ADDRESS,
        POSITION_MANAGER_ABI,
        signer
      );
      setContract(contractInstance);
      setError(null);
    } catch (err) {
      console.error("Error initializing Position Manager:", err);
      setError("Failed to initialize Position Manager");
    }
  }, [signer]);

  // Helper function to execute contract methods with error handling
  const executeContractMethod = useCallback(
    async <T>(method: () => Promise<T>): Promise<T> => {
      if (!contract) throw new Error("Contract not initialized");
      try {
        setLoading(true);
        setError(null);
        return await method();
      } catch (err: any) {
        const errorMsg = err.reason || err.message || "Transaction failed";
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [contract]
  );

  // Position Management
  const mint = useCallback(
    async (params: MintParams) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        const tx = await contract.mint({
          token0: params.token0,
          token1: params.token1,
          fee: params.fee,
          tickLower: params.tickLower,
          tickUpper: params.tickUpper,
          amount0Desired: params.amount0Desired,
          amount1Desired: params.amount1Desired,
          amount0Min: params.amount0Min,
          amount1Min: params.amount1Min,
          recipient: params.recipient,
          deadline: params.deadline,
        });
        return await tx.wait();
      });
    },
    [executeContractMethod, contract]
  );

  const increaseLiquidity = useCallback(
    async (params: IncreaseLiquidityParams) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        const tx = await contract.increaseLiquidity({
          tokenId: params.tokenId,
          amount0Desired: params.amount0Desired,
          amount1Desired: params.amount1Desired,
          amount0Min: params.amount0Min,
          amount1Min: params.amount1Min,
          deadline: params.deadline,
        });
        return await tx.wait();
      });
    },
    [executeContractMethod, contract]
  );

  const decreaseLiquidity = useCallback(
    async (params: DecreaseLiquidityParams) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        const tx = await contract.decreaseLiquidity({
          tokenId: params.tokenId,
          liquidity: params.liquidity,
          amount0Min: params.amount0Min,
          amount1Min: params.amount1Min,
          deadline: params.deadline,
        });
        return await tx.wait();
      });
    },
    [executeContractMethod, contract]
  );

  const collect = useCallback(
    async (params: CollectParams) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        const tx = await contract.collect({
          tokenId: params.tokenId,
          recipient: params.recipient,
          amount0Max: params.amount0Max,
          amount1Max: params.amount1Max,
        });
        return await tx.wait();
      });
    },
    [executeContractMethod, contract]
  );

  // Token Management
  const burn = useCallback(
    async (tokenId: bigint) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        const tx = await contract.burn(tokenId);
        return await tx.wait();
      });
    },
    [executeContractMethod, contract]
  );

  // Position Views
  const positions = useCallback(
    async (tokenId: bigint) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        return await contract.positions(tokenId);
      });
    },
    [executeContractMethod, contract]
  );

  // ERC721 Methods
  const approve = useCallback(
    async (to: string, tokenId: bigint) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        const tx = await contract.approve(to, tokenId);
        return await tx.wait();
      });
    },
    [executeContractMethod, contract]
  );

  const setApprovalForAll = useCallback(
    async (operator: string, approved: boolean) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        const tx = await contract.setApprovalForAll(operator, approved);
        return await tx.wait();
      });
    },
    [executeContractMethod, contract]
  );

  const getApproved = useCallback(
    async (tokenId: bigint) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        return await contract.getApproved(tokenId);
      });
    },
    [executeContractMethod, contract]
  );

  const isApprovedForAll = useCallback(
    async (owner: string, operator: string) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        return await contract.isApprovedForAll(owner, operator);
      });
    },
    [executeContractMethod, contract]
  );

  // Token Metadata
  const tokenURI = useCallback(
    async (tokenId: bigint) => {
      return executeContractMethod(async () => {
        if (!contract) throw new Error("Contract not initialized");
        return await contract.tokenURI(tokenId);
      });
    },
    [executeContractMethod, contract]
  );

  // Contract Info
  const factory = useCallback(async () => {
    return executeContractMethod(async () => {
      if (!contract) throw new Error("Contract not initialized");
      return await contract.factory();
    });
  }, [executeContractMethod, contract]);

  const WETH9 = useCallback(async () => {
    return executeContractMethod(async () => {
      if (!contract) throw new Error("Contract not initialized");
      return await contract.WETH9();
    });
  }, [executeContractMethod, contract]);

  return {
    // Core Position Management
    mint,
    increaseLiquidity,
    decreaseLiquidity,
    collect,
    burn,
    positions,
    
    // ERC721 Methods
    approve,
    setApprovalForAll,
    getApproved,
    isApprovedForAll,
    
    // Token Metadata
    tokenURI,
    
    // Contract Info
    factory,
    WETH9,
    
    // State
    contract,
    loading,
    error,
    isInitialized: !!contract,
  };
};
