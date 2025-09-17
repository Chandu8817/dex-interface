import { useState, useEffect, useCallback } from "react";
import { ethers, JsonRpcSigner } from "ethers";
import { POSITION_MANAGER_ADDRESS, usePositionManager } from "../hooks/usePositionManager";
import { useERC20 } from "../hooks/useERC20";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useQuote } from "../hooks/useQuote";
import { SlippageSettings } from "./SlippageSettings";
import TokenSelector from "./TokenSelector";
import type { Token } from "../types";
import { useTokens } from "../hooks/useTokens";


interface LiquidityTabProps {
  signer: JsonRpcSigner | null;
}
type TabType = "add" | "remove";

export const LiquidityTab = ({ signer }: LiquidityTabProps) => {
  const { tokens, getTokenBySymbol } = useTokens();
  const [activeTab, setActiveTab] = useState<TabType>("add");
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);

  // Initialize default tokens when tokens are loaded
  useEffect(() => {
    if (tokens.length > 0) {
      const defaultTokenA = getTokenBySymbol("WETH") || tokens[0];
      const defaultTokenB = getTokenBySymbol("USDC") || (tokens[1] || tokens[0]);
      setTokenA(defaultTokenA);
      setTokenB(defaultTokenB);
    }
  }, [tokens, getTokenBySymbol]);

  const [tokenId, setTokenId] = useState("");
  const [liquidity, setLiquidity] = useState("");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [fee, setFee] = useState(3000); // 0.3% fee tier
  const [tickLower, setTickLower] = useState("-60000");
  const [tickUpper, setTickUpper] = useState("60000");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balanceA, setBalanceA] = useState("0");
  const [balanceB, setBalanceB] = useState("0");
  const [decimalsA, setDecimalsA] = useState(6);
  const [decimalsB, setDecimalsB] = useState(18);
  const [allowanceA, setAllowanceA] = useState("0");
  const [allowanceB, setAllowanceB] = useState("0");
  const [symbolA, setSymbolA] = useState("");
  const [symbolB, setSymbolB] = useState("");
  const [slippage, setSlippage] = useState(0.5); // 0.5% default slippage
  const [deadline, setDeadline] = useState(15); // 15 minutes default deadline

 
  const {
    getSymbol: getSymbolA,
    getBalance: getBalanceA,
    getAllowance: getAllowanceA,
    approve: approveA,
    isInitialized: isERC20InitializedA,
  } = useERC20(signer);
  const {
    getSymbol: getSymbolB,
    getBalance: getBalanceB,
    getAllowance: getAllowanceB,
    approve: approveB,
    isInitialized: isERC20InitializedB,
  } = useERC20(signer);
  const {
    mint,
    decreaseLiquidity,
    collect,
    burn,
    positions,
    approve,
    isApprovedForAll,
    isInitialized,
  } = usePositionManager(signer);
  const { getDecimal: getDecimalTokenIn } = useERC20(signer);
  const { getDecimal: getDecimalTokenOut } = useERC20(signer);
  const { quoteExactInputSingle ,isInitialized: isQuoteInitialized } = useQuote(signer);

  // Format token amount with decimals
  const formatTokenAmount = (amount: string, decimals = 18) => {
    try {
      return ethers.parseUnits(amount || "0", decimals).toString();
    } catch (e) {
      return "0";
    }
  };

  // Check if user has sufficient balance
  const hasSufficientBalance = useCallback(() => {
    
    if (!amountA || !amountB) return false;
    try {
      const amountAWei = formatTokenAmount(amountA, decimalsA); 
      const amountBWei = formatTokenAmount(amountB, decimalsB); 
      return (
        BigInt(balanceA) >= BigInt(amountAWei) &&
        BigInt(balanceB) >= BigInt(amountBWei)
      );
    } catch (e) {
      return false;
    }
  }, [amountA, amountB, balanceA, balanceB]);

  // Check if token is approved
  const isTokenAApproved = useCallback(() => {
    if (!amountA) return false;
    try {
      const amountAWei = formatTokenAmount(amountA, decimalsA);
      return BigInt(allowanceA) >= BigInt(amountAWei);
    } catch (e) {
      return false;
    }
  }, [amountA, allowanceA]);

  const isTokenBApproved = useCallback(() => {
    if (!amountB) return false;
    try {
      const amountBWei = formatTokenAmount(amountB, decimalsB);
      return BigInt(allowanceB) >= BigInt(amountBWei);
    } catch (e) {
      return false;
    }
  }, [amountB, allowanceB]);

  // Function to update token A and B data
  const updateTokenData = useCallback(
    async (newTokenA: string, newTokenB: string) => {
      if (
        !signer ||
        !isInitialized ||
        !isERC20InitializedA ||
        !isERC20InitializedB
      )
        return;

      try {
        const signerAddress = await signer.getAddress();

        // Fetch new balances and allowances
        const [balanceA, balanceB, allowanceA, allowanceB, symbolA, symbolB] =
          await Promise.all([
            getBalanceA(signerAddress, newTokenA),
            getBalanceB(signerAddress, newTokenB),
            getAllowanceA(signerAddress, POSITION_MANAGER_ADDRESS, newTokenA),
            getAllowanceB(signerAddress, POSITION_MANAGER_ADDRESS, newTokenB),
            getSymbolA(newTokenA),
            getSymbolB(newTokenB),
          ]);

        // Update state with new values
        setBalanceA(balanceA.toString());
        setBalanceB(balanceB.toString());
        setAllowanceA(allowanceA.toString());
        setAllowanceB(allowanceB.toString());
        setDecimalsA(await getDecimalTokenIn(newTokenA));
        setDecimalsB(await getDecimalTokenOut(newTokenB));
        setSymbolA(symbolA);
        setSymbolB(symbolB);
      } catch (error) {
        console.error("Error updating token data:", error);
        toast.error("Failed to update token data");
      }
    },
    [
      signer,
      isInitialized,
      isERC20InitializedA,
      isERC20InitializedB,
      getBalanceA,
      getBalanceB,
      getAllowanceA,
      getAllowanceB,
    ],
  );

  // Fetch balances and allowances
  const fetchBalancesAndAllowances = useCallback(async () => {
    if (
      !signer ||
      !isInitialized ||
      !isERC20InitializedA ||
      !isERC20InitializedB
    ){
      return;}

    try {
      const signerAddress = await signer.getAddress();

      // Fetch balances and allowances for both tokens
      if (!tokenA || !tokenB) return;
      const [balanceA, balanceB, allowanceA, allowanceB, symbolA, symbolB] =
        await Promise.all([

          getBalanceA(signerAddress, tokenA.address),
          getBalanceB(signerAddress, tokenB.address),
          getAllowanceA(signerAddress, POSITION_MANAGER_ADDRESS, tokenA.address),
          getAllowanceB(signerAddress, POSITION_MANAGER_ADDRESS, tokenB.address),
          getSymbolA(tokenA.address),
          getSymbolB(tokenB.address),
        ]);

      // Update state with fetched values
      setBalanceA(balanceA.toString());
      setBalanceB(balanceB.toString());
      setAllowanceA(allowanceA.toString());
      setAllowanceB(allowanceB.toString());
      setDecimalsA(await getDecimalTokenIn(tokenA.address));
      setDecimalsB(await getDecimalTokenOut(tokenB.address));
      setSymbolA(symbolA);
      setSymbolB(symbolB);
    } catch (error) {
      console.error("Error fetching balances and allowances:", error);
      toast.error("Failed to fetch token data");
    }
  }, [
    signer,
    isInitialized,
    isERC20InitializedA,
    isERC20InitializedB,
    tokenA,
    tokenB,
    getBalanceA,
    getBalanceB,
    getAllowanceA,
    getAllowanceB,
  ]);

  // Initial fetch
  useEffect(() => {
    fetchBalancesAndAllowances();
  }, [fetchBalancesAndAllowances]);

  const handleApproveTokenA = async () => {
    if (!amountA || !tokenA) return; 
    try {
      setIsProcessing(true);
      await approveA(
        POSITION_MANAGER_ADDRESS,
        ethers.parseUnits(amountA, decimalsA),
        tokenA.address,
      );
      toast.success("Token A approved successfully");
      await fetchBalancesAndAllowances();
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error("Failed to approve Token A");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveTokenB = async () => {
    if (!amountB || !tokenB) return;
    try {
      setIsProcessing(true);
      await approveB(
        POSITION_MANAGER_ADDRESS,
        ethers.parseUnits(amountB, decimalsB),
        tokenB.address,
      );
      toast.success("Token B approved successfully");
      await fetchBalancesAndAllowances();
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error("Failed to approve Token B");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (
      !tokenA ||
      !tokenB ||
      !amountA ||
      !amountB ||
      !tickLower ||
      !tickUpper
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isInitialized || !isERC20InitializedA || !isERC20InitializedB) {
      setError("Contract not initialized. Please connect your wallet first.");
      return;
    }

    try {
      setError(null);
      setTxHash(null);
      setIsProcessing(true);

      // Check if we need to approve tokens first
      if (!isTokenAApproved()) {
        toast.info("Please approve Token A first");
        return;
      }

      if (!isTokenBApproved()) {
        toast.info("Please approve Token B first");
        return;
      }debugger

      // Double-check balances before proceeding
      if (!hasSufficientBalance()) {
        toast.error("Insufficient balance for one or both tokens");
        return;
      }

      toast.info("Adding liquidity...");
      
      // First, create a new position
      const signerAddress = await signer?.getAddress();
      if (!signerAddress) throw new Error("No signer address available");
      
      // Sort tokens by address (required by Uniswap V3)
      const token0 = tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? tokenA : tokenB;
      const token1 = tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? tokenB : tokenA;
      
      // Parse amounts based on token order
      const amount0Desired = token0 === tokenA 
        ? ethers.parseUnits(amountA, tokenA.decimals)
        : ethers.parseUnits(amountB, tokenB.decimals);
      const amount1Desired = token0 === tokenA 
        ? ethers.parseUnits(amountB, tokenB.decimals)
        : ethers.parseUnits(amountA, tokenA.decimals);

      // Calculate minimum amounts with slippage
      const slippageBasisPoints = BigInt(Math.floor(slippage * 100));
      const amount0Min = (amount0Desired * (10000n - slippageBasisPoints)) / 10000n;
      const amount1Min = (amount1Desired * (10000n - slippageBasisPoints)) / 10000n;

      const base = Math.floor(-360447 / 200) * 200;
const rangeMultiplier = 1; // how wide: 1 -> +/- one tickSpacing, bigger -> wider range
const tickLower = base - 200 * rangeMultiplier;
const tickUpper = base + 200 * rangeMultiplier;

      const params = {
        token0: token0.address,
        token1: token1.address,
        fee: Number(fee),
        tickLower: Number(tickLower),
        tickUpper: Number(tickUpper),
        amount0Desired,
        amount1Desired,
        amount0Min,
        amount1Min,
        recipient: signerAddress,
        deadline: Math.floor(Date.now() / 1000) + deadline * 60, // deadline minutes from now
      };
      
     
      // Call the mint function with all required parameters
      const tx = await mint({
        token0: params.token0,
        token1: params.token1,
        fee: params.fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        amount0Desired: params.amount0Desired,
        amount1Desired: params.amount1Desired,
        amount0Min: 0n,
        amount1Min: 0n,
        recipient: params.recipient,
        deadline: params.deadline,
      });
      debugger
      const receipt = await tx.wait();

      toast.success("Liquidity added successfully!");
      setTxHash(receipt.transactionHash);

      // Reset form
      setAmountA("");
      setAmountB("");

      // Refresh balances
      await fetchBalancesAndAllowances();
    } catch (err: any) {
      console.error("Add liquidity failed:", err);
      setError(err.message || "Failed to add liquidity");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const fetchPosition = async () => {
      if (tokenId) {
        try {
          const position = await positions(BigInt(tokenId));
          if (position) {
            setLiquidity(position.liquidity.toString());
            console.log("Position:", position);
          }
        } catch (err) {
          console.error("Failed to fetch position:", err);
          setError("Failed to fetch position. Please check the position ID.");
        }
      }
    };
    fetchPosition();
  }, [tokenId, positions]);

  const handleRemoveLiquidity = async () => {
    if (!tokenId) {
      setError("Please enter a valid position ID");
      return;
    }
    
    const signerAddress = await signer?.getAddress();
    if (!signerAddress) {
      setError("No signer address available");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setTxHash(null);
      
      // First check if the position manager is approved
      const signerAddress = await signer?.getAddress();
      if (!signerAddress) throw new Error("No signer address available");
      
      const isApproved = await isApprovedForAll(
        signerAddress,
        POSITION_MANAGER_ADDRESS
      );

      if (!isApproved) {
        toast.info("Approving position manager...");
        const approveTx = await approve(POSITION_MANAGER_ADDRESS, 1n);
        await approveTx.wait();
      }

      // Get position details
      const position = await positions(BigInt(tokenId));
      if (!position) {
        throw new Error("Position not found");
      }

      // Decrease liquidity to 0
      const params = {
        tokenId: BigInt(tokenId),
        liquidity: position.liquidity,
        amount0Min: 0n,
        amount1Min: 0n,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from now
      };

      toast.info("Removing liquidity...");
      const tx = await decreaseLiquidity(params);
      const receipt = await tx.wait();

      // Collect fees
      await collect({
        tokenId: BigInt(tokenId),
        recipient: signerAddress,
        amount0Max: ethers.MaxUint256,
        amount1Max: ethers.MaxUint256,
      });

      // Burn the position
      await burn(BigInt(tokenId));

      toast.success("Liquidity removed successfully!");
      setTxHash(receipt.transactionHash);
      setTokenId("");
      setLiquidity("");
      
      // Refresh balances
      await fetchBalancesAndAllowances();
    } catch (err: any) {
      console.error("Remove liquidity failed:", err);
      setError(err.message || "Failed to remove liquidity");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwapTokens = async () => {
    if (!tokenA || !tokenB) return;

    try {
      setIsProcessing(true);

      // Store current values
      const oldTokenA = tokenA;
      const oldTokenB = tokenB;
      const oldAmountA = amountA;
      const oldAmountB = amountB;

      // Swap token addresses and amounts
      setTokenA(oldTokenB);
      setTokenB(oldTokenA);
      setAmountA(oldAmountB);
      setAmountB(oldAmountA);

      // Fetch new balances and allowances for the swapped tokens
      await updateTokenData(oldTokenB.address, oldTokenA.address);
    } catch (error) {
      console.error("Error swapping tokens:", error);
      toast.error("Failed to swap tokens");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTokenAChange = (newToken: Token) => {
    setTokenA(newToken);
    setAmountA("");
    setAmountB("");
  };

  const handleTokenBChange = (newToken: Token) => {
    setTokenB(newToken);
    setAmountA("");
    setAmountB("");
  };

  const getAmountOut = useCallback(async () => {
    if (!tokenA || !tokenB || !amountA || !signer) {
      setAmountB("");
      return;
    }

    try {
      const decimalsIn = await getDecimalTokenIn(tokenA.address);
      const decimalsOut = await getDecimalTokenOut(tokenB.address);

      // Validate amount is a positive number
      if (isNaN(Number(amountA)) || Number(amountA) <= 0) {
        setAmountB("");
        return;
      }
      if (!isQuoteInitialized) {
        toast.error("Quote contract not initialized");
        return;
      }

      const quote = await quoteExactInputSingle(
        tokenA.address,
        tokenB.address,
        Number(fee),
        amountA,
        '0',
        decimalsIn,
        decimalsOut,
      );
      if (!quote) return;
      

      const amountOutWei = ethers.parseUnits(quote.amountOut, decimalsOut);
      const slippageBasisPoints = BigInt(Math.floor(slippage * 100));
      const minAmountOut = ethers.formatUnits(BigInt(amountOutWei) * (10000n - slippageBasisPoints) / 10000n, decimalsOut);
      setAmountB(minAmountOut.toString());
    } catch (err) {
      console.error("Failed to get quote:", err);

    }
  }, [
    tokenA,
    tokenB,
    amountA,
    fee,
    signer,
    getDecimalTokenIn,
    getDecimalTokenOut,
    quoteExactInputSingle,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      getAmountOut();
    }, 500);

    return () => clearTimeout(timer);
  }, [getAmountOut]);

  // Format balance for display
  const formatDisplayBalance = (balance: string, decimals: number) => {
    try {
      return Number(ethers.formatUnits(balance, decimals)).toFixed(4);
    } catch (e) {
      return "0";
    }
  };

  // Get button state
  const getButtonState = () => {
    if (!amountA || !amountB) {
      return {
        disabled: true,
        text: "Enter amounts",
        onClick: () => {},
      };
    }

    if (!hasSufficientBalance()) {
      return {
        disabled: true,
        text: "Insufficient balance",
        onClick: () => {},
      };
    }

    if (!isTokenAApproved()) {
      return {
        disabled: isProcessing,
        text: `Approve Token A`,
        onClick: handleApproveTokenA,
      };
    }

    if (!isTokenBApproved()) {
      return {
        disabled: isProcessing,
        text: `Approve Token B`,
        onClick: handleApproveTokenB,
      };
    }

    return {
      disabled: isProcessing || !hasSufficientBalance(),
      text: "Add Liquidity",
      onClick: handleAddLiquidity,
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="max-w-md mx-auto">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {activeTab === "add" ? "Add Liquidity" : "Remove Liquidity"}
          </h1>
          <SlippageSettings 
            slippage={slippage} 
            onSlippageChange={setSlippage}
            deadline={deadline}
            onDeadlineChange={setDeadline}
          />
        </div>
        {/* Transaction Status */}
        {isProcessing && (
          <div className="p-3 bg-blue-100 text-blue-800 rounded">
            Processing transaction...
          </div>
        )}

        {txHash && (
          <div className="p-3 bg-green-100 text-green-800 rounded">
            <p>Transaction successful!</p>
            <a
              href={`https://arbiscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              View on Arbiscan
            </a>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>
        )}

        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === "add" ? "border-b-2 border-blue-500 font-medium" : "text-gray-500"}`}
            onClick={() => setActiveTab("add")}
          >
            Add Liquidity
          </button>
          <button
            className={`px-4 py-2 ${activeTab === "remove" ? "border-b-2 border-blue-500 font-medium" : "text-gray-500"}`}
            onClick={() => setActiveTab("remove")}
          >
            Remove Liquidity
          </button>
        </div>

        {activeTab === "add" ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Add Liquidity</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Token A</label>
                <span className="text-xs text-gray-500">
                  Balance: {formatDisplayBalance(balanceA, decimalsA)} {symbolA}
                </span>
              </div>
              <div className="w-40">
                <TokenSelector
                  selectedToken={tokenA}
                  onSelect={handleTokenAChange}
                  excludeToken={tokenB}
                  label="Token A"
                  className="w-40"
                />
              </div>

              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Token B</label>
                <span className="text-xs text-gray-500">
                  Balance: {formatDisplayBalance(balanceB, decimalsB)} {symbolB}
                </span>
              </div>
              <div className="w-40">
                <TokenSelector
                  selectedToken={tokenB}
                  onSelect={handleTokenBChange}
                  excludeToken={tokenA}
                  label="Token B"
                  className="w-40"
                />
              </div>
              <div className="flex justify-center -my-2">
                <button
                  onClick={handleSwapTokens}
                  disabled={isProcessing}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full disabled:opacity-50"
                  type="button"
                  aria-label="Swap tokens"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount A</label>
              <input
                type="text"
                value={amountA}
                onChange={(e) => setAmountA(e.target.value)}
                placeholder="0.0"
                className="w-full p-2 border rounded"
              />
              {amountA &&
                BigInt(balanceA) <
                  BigInt(formatTokenAmount(amountA, decimalsA)) && (
                  <p className="mt-1 text-xs text-red-500">
                    Insufficient balance
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amount B</label>
              <input
                type="text"
                value={amountB}
                onChange={(e) => setAmountB(e.target.value)}
                placeholder="0.0"
                className="w-full p-2 border rounded"
              />
              {amountB &&
                BigInt(balanceB) <
                  BigInt(formatTokenAmount(amountB, decimalsB)) && (
                  <p className="mt-1 text-xs text-red-500">
                    Insufficient balance
                  </p>
                )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Fee Tier</label>
              <select
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full p-2 border rounded"
              >
                <option value={500}>0.05%</option>
                <option value={3000}>0.3%</option>
                <option value={10000}>1%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tick Lower (e.g., -887272 for full range)
              </label>
              <input
                type="number"
                value={tickLower}
                onChange={(e) => setTickLower(e.target.value)}
                placeholder="Tick lower bound"
                className="w-full p-2 border rounded"
                min="-887272"
                max="887272"
                step="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Tick Upper (e.g., 887272 for full range)
              </label>
              <input
                type="number"
                value={tickUpper}
                onChange={(e) => setTickUpper(e.target.value)}
                placeholder="Tick upper bound"
                className="w-full p-2 border rounded"
                min="-887272"
                max="887272"
                step="60"
              />
              <p className="mt-1 text-xs text-gray-500">
                Common tick spacings: 10 for 1%, 60 for 0.3%, 200 for 1% fee tiers
              </p>
            </div>

            <button
              onClick={buttonState.onClick}
              disabled={buttonState.disabled}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white ${
                buttonState.disabled
                    ? 'w-full py-3 px-4 rounded-xl font-medium text-white bg-red-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isProcessing ? "Processing..." : buttonState.text}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Remove Liquidity</h2>

            <div>
              <label className="block text-sm font-medium mb-1">
                Position ID
              </label>
              <input
                type="text"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="Position ID"
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Liquidity Amount
              </label>
              <input
                type="text"
                value={liquidity}
                onChange={(e) => setLiquidity(e.target.value)}
                placeholder="0.0"
                className="w-full p-2 border rounded"
              />
            </div>

            <button
              onClick={handleRemoveLiquidity}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white ${
                buttonState.disabled
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isProcessing ? "Processing..." : "Remove Liquidity"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
