import { useCallback, useEffect, useState } from "react";
import { ethers, JsonRpcSigner } from "ethers";
import { SWAP_ROUTER_ADDRESS, useSwapRouter } from "../hooks/useSwapRouter";
import { useERC20 } from "../hooks/useERC20";
import { toast, ToastContainer } from "react-toastify";
import { useQuote } from "../hooks/useQuote";
import { SlippageSettings } from "./SlippageSettings";
import TokenSelector from "./TokenSelector";

type Token = {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoURI: string;
};
interface SwapTabProps {
  signer: JsonRpcSigner | null;
}


const DEFAULT_TOKENS = {
  USDC: {
    name: "USDC",
    symbol: "USDC",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png"
  },
  WETH: {
    name: "WETH",
    symbol: "WETH",
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/logo.png"
  }
};

export const SwapTab = ({ signer }: SwapTabProps) => {
  const [tokenIn, setTokenIn] = useState<Token>(DEFAULT_TOKENS.WETH);
  const [tokenOut, setTokenOut] = useState<Token>(DEFAULT_TOKENS.USDC);
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [slippage, setSlippage] = useState(0.5); // 0.5% default slippage
  const [deadline, setDeadline] = useState(15); // 15 minutes default deadline
  const [fee, setFee] = useState(3000); // 0.3% fee tier
  const [isSwapping, setIsSwapping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [balanceIn, setBalanceIn] = useState("0");
  const [balanceOut, setBalanceOut] = useState("0");
  const [decimalsIn, setDecimalsIn] = useState(6);
  const [decimalsOut, setDecimalsOut] = useState(18);
  const [allowanceIn, setAllowanceIn] = useState("0");
  const [symbolIn, setSymbolIn] = useState("");
  const [symbolOut, setSymbolOut] = useState("");

  const { exactInputSingle } = useSwapRouter(signer);
  const { quoteExactInputSingle, quoteExactOutputSingle, isInitialized: isQuoteInitialized } = useQuote(signer);
  const {
    isInitialized: isERC20InitializedA,
    getBalance: getBalanceIn,
    getAllowance: getAllowanceIn,
    approve: approveTokenIn,
    getSymbol: getSymbolIn,
    getDecimal: getDecimalTokenIn,
  } = useERC20(signer);
  const {
    isInitialized: isERC20InitializedB,
    getBalance: getBalanceOut,
    getAllowance: getAllowanceOut,
    approve: approveTokenOut,
    getSymbol: getSymbolOut,
    getDecimal: getDecimalTokenOut,
  } = useERC20(signer);

  // Handle token switch
  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  // Handle amount in change
  const handleAmountInChange = async (value: string) => {
    setAmountIn(value);
    if (value && parseFloat(value) > 0) {
      try {
        const quote = await quoteExactInputSingle(
          tokenIn.address, 
          tokenOut.address, 
          Number(fee), 
          value, 
          decimalsIn.toString()
        );
        setAmountOut(quote.amountOut);
      } catch (err) {
        console.error('Error getting quote:', err);
        setAmountOut('');
      }
    } else {
      setAmountOut('');
    }
  };

  // Handle amount out change
  const handleAmountOutChange = (value: string) => {
    setAmountOut(value);
    // We don't implement reverse quote here for simplicity
  };

  // Check if balance is insufficient
  const hasInsufficientBalance = (): boolean => {
    if (!amountIn) return false;
    try {
      const amount = parseFloat(amountIn);
      const balance = parseFloat(ethers.formatUnits(balanceIn, decimalsIn));
      return amount > balance;
    } catch (e) {
      console.error('Error checking balance:', e);
      return true;
    }
  };

  // Format balance for display
  const formatDisplayBalance = (balance: string, decimals: number): string => {
    try {
      const formatted = ethers.formatUnits(balance, decimals);
      return parseFloat(formatted).toFixed(4);
    } catch (e) {
      console.error('Error formatting balance:', e);
      return "0";
    }
  };

  // Check if input amount exceeds balance
  const isInsufficientBalance = useCallback(() => {
    if (!amountIn || !balanceIn) return false;
    try {
      const decimals = tokenIn === DEFAULT_TOKENS.USDC ? 6 : 18; // Assuming USDC has 6 decimals
      const amountInWei = ethers.parseUnits(amountIn, decimals);
      return BigInt(balanceIn) < amountInWei;
    } catch (e) {
      return false;
    }
  }, [amountIn, balanceIn, tokenIn]);

  // Fetch balances and allowances
  const fetchBalancesAndAllowances = useCallback(async () => {
    if (
      !signer ||
      !isInitialized ||
      !isERC20InitializedA ||
      !isERC20InitializedB
    )
      return;

    try {
      const signerAddress = await signer.getAddress();

      // Fetch balances
      const [balanceA, allowanceA] = await Promise.all([
        getBalanceIn(signerAddress, tokenIn.address),
        getAllowanceIn(signerAddress, SWAP_ROUTER_ADDRESS, tokenIn.address),
      ]);

      setBalanceIn(balanceA.toString());
      setAllowanceIn(allowanceA.toString());
      setDecimalsIn(await getDecimalTokenIn(tokenIn.address));
    } catch (error) {
      console.error("Error fetching balances and allowances:", error);
      toast.error("Failed to fetch token data");
    } finally {
      // Loading state handled by isProcessing
    }
  }, [
    signer,
    isInitialized,
    isERC20InitializedA,
    isERC20InitializedB,
    getBalanceIn,
    getBalanceOut,
    getAllowanceIn,
    getAllowanceOut,
  ]);
  useEffect(() => {
    fetchBalancesAndAllowances();
  }, [fetchBalancesAndAllowances]);

  useEffect(() => {
    if (signer) {
      setIsInitialized(true);
      fetchBalancesAndAllowances();
    }
  }, [signer]);
  const fetchQuote = useCallback(async () => {
    if (!tokenIn || !tokenOut || !amountIn || !signer) {
      setAmountOut("");
      return;
    }
    try {
      const decimalsIn = await getDecimalTokenIn(tokenIn.address);
      const decimalsOut = await getDecimalTokenOut(tokenOut.address);

      // Validate amount is a positive number
      if (isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
        setAmountOut("");
        return;
      }
      if (!isQuoteInitialized) {
        toast.error("Quote contract not initialized");
        return;
      }

      const quote = await quoteExactInputSingle(
        tokenIn.address,
        tokenOut.address,
        Number(fee),
        amountIn,
        '0',
        decimalsIn,
        decimalsOut,
      );
      const amountOutWei = ethers.parseUnits(quote.amountOut, decimalsOut);
      const slippageBasisPoints = BigInt(Math.floor(slippage * 100));
      const minAmountOut = ethers.formatUnits(BigInt(amountOutWei) * (10000n - slippageBasisPoints) / 10000n, decimalsOut);
      setAmountOut(minAmountOut.toString());
    } catch (err) {
      console.error("Failed to get quote:", err);
      setAmountOut("");
    }
  }, [
    tokenIn,
    tokenOut,
    amountIn,
    fee,
    signer,
    getDecimalTokenIn,
    getDecimalTokenOut,
    quoteExactInputSingle,
    isQuoteInitialized,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const handleApproveTokenIn = async () => {
    if (!amountIn || !signer) {
      toast.error("Please connect your wallet and enter an amount");
      return;
    }

    try {
      setIsSwapping(true);
      const decimals = await getDecimalTokenIn(tokenIn.address);
      const amountInWei = ethers.parseUnits(amountIn, decimals);

      await approveTokenIn(
        SWAP_ROUTER_ADDRESS,
        amountInWei,
        tokenIn.address,
      );
      toast.success("Token approved successfully");

      // Refresh balances and allowances
      await fetchBalancesAndAllowances();
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error("Failed to approve token");
    } finally {
      setIsSwapping(false);
    }
  };

    const handleTokenAChange = (newToken: Token) => {
      setTokenIn(newToken);
      setAmountIn("");
      setAmountOut("");
    };
  
    const handleTokenBChange = (newToken: Token) => {
      setTokenOut(newToken);
      setAmountIn("");
      setAmountOut("");
    };

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn || !amountOut || !signer) {
      toast.error("Please fill in all fields and connect your wallet");
      return;
    }

    try {
      setIsSwapping(true);
      const signerAddress = await signer.getAddress();

      // Get decimals for both tokens
      const [decimalsIn, decimalsOut] = await Promise.all([
        getDecimalTokenIn(tokenIn.address),
        getDecimalTokenOut(tokenOut.address),
      ]);

      // Convert amounts to wei
      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);
      const amountOutWei = ethers.parseUnits(amountOut, decimalsOut);

      // Check and approve tokenIn if needed
      const allowanceIn = await getAllowanceIn(
        signerAddress,
        SWAP_ROUTER_ADDRESS,
        tokenIn.address,
      );
      if (BigInt(allowanceIn) < amountInWei) {
        await approveTokenIn(
          SWAP_ROUTER_ADDRESS,
          amountInWei,
          tokenIn.address,
        );
        toast.success("Token approved, please confirm swap");
        return; // Let the user initiate swap after approval
      }

      // Calculate slippage
      // const slippageBasisPoints = BigInt(Math.floor(slippage * 100));
      // const minAmountOut = (BigInt(amountOutWei) * (10000n - slippageBasisPoints)) / 10000n;

      // Execute swap
      const tx = await exactInputSingle({
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee,
        recipient: signerAddress,
        deadline: Math.floor(Date.now() / 1000) + deadline * 60, // 15 minutes from now
        amountIn: amountInWei,
        amountOutMinimum: amountOutWei,
        sqrtPriceLimitX96: 0n,
      });

      console.log("Transaction hash:", tx);
      toast.success("Swap executed successfully");

      // Refresh data after successful swap
      await fetchBalancesAndAllowances();
      setAmountIn("");
      setAmountOut("");
    } catch (err: any) {
      console.error("Swap failed:", err);
      toast.error(`Swap failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Swap</h1>
          <SlippageSettings 
            slippage={slippage} 
            onSlippageChange={setSlippage} 
            deadline={deadline}
            onDeadlineChange={setDeadline}
          />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">You pay</label>
              <span className="text-xs text-gray-500">
                Balance: {formatDisplayBalance(balanceIn, decimalsIn)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                className="w-full p-3 text-xl border-0 focus:ring-2 focus:ring-blue-500 rounded-lg"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => handleAmountInChange(e.target.value)}
              />
              <div className="w-40">
                <TokenSelector
                  selectedToken={tokenIn}
                  onSelect={handleTokenAChange}
                  excludeToken={tokenOut}
                  label="Token In"
                  className="w-40"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center my-2">
            <button
              type="button"
              onClick={handleSwitchTokens}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-500"
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

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">You receive</label>
              <span className="text-xs text-gray-500">
                Balance: {formatDisplayBalance(balanceOut, decimalsOut)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                className="w-full p-3 text-xl border-0 focus:ring-2 focus:ring-blue-500 rounded-lg"
                placeholder="0.0"
                value={amountOut}
                onChange={(e) => handleAmountOutChange(e.target.value)}
                readOnly
              />
              <div className="w-40">
                <TokenSelector
                  selectedToken={tokenOut}
                  onSelect={setTokenOut}
                />
              </div>
            </div>
          </div>
        </div>

    
      </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Fee Tier (0.05%, 0.3%, or 1%)
            </label>
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

          <div className="flex space-x-2">
            {!hasInsufficientBalance ? (
              allowanceIn < amountIn ? (
                <button
                  type="button"
                  onClick={handleApproveTokenIn}
                  disabled={isSwapping || !signer || !amountIn || parseFloat(amountIn) <= 0}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-white ${
                    isSwapping || !signer || !amountIn || parseFloat(amountIn) <= 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSwapping ? 'Approving...' : 'Approve'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={isSwapping || !signer || !amountIn || parseFloat(amountIn) <= 0}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-white ${
                    isSwapping || !signer || !amountIn || parseFloat(amountIn) <= 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSwapping ? 'Swapping...' : 'Swap'}
                </button>
              )
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-3 px-4 rounded-xl font-medium text-white bg-red-500 cursor-not-allowed"
              >
                Insufficient Balance
              </button>
            )}
          </div>

          {amountOut && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <div className="flex justify-between">
                <span>Expected Output:</span>
                <span className="font-medium">{amountOut}</span>
              </div>
            </div>
          )}
        </div>
     
    

  );
};
