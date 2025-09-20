import { useCallback, useEffect, useState } from "react";
import { ethers, JsonRpcSigner } from "ethers";
import { SWAP_ROUTER_ADDRESS, useSwapRouter } from "../../hooks/useSwapRouter";
import { useERC20 } from "../../hooks/useERC20";
import { toast, ToastContainer } from "react-toastify";
import { useQuote } from "../../hooks/useQuote";
import { SlippageSettings } from "../SlippageSettings";
import TokenSelector from "../TokenSelector";
import { useTokens } from "../../hooks/useTokens";
type Token = {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};
interface SwapTabProps {
  signer: JsonRpcSigner | null;
}

export const SwapTab = ({ signer }: SwapTabProps) => {
  const { tokens, getTokenBySymbol } = useTokens();
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const feeTier = import.meta.env.VITE_FEE_TIER || "3000";

  useEffect(() => {
    if (tokens.length > 0) {
      const defaultTokenIn = getTokenBySymbol("ETH");
      const defaultTokenOut = getTokenBySymbol("USDC");
      setTokenIn(defaultTokenIn as Token);
      setTokenOut(defaultTokenOut as Token);
    }
  }, [tokens]);

  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  const [isOutput, setIsOutput] = useState(false);
  const [slippage, setSlippage] = useState(0.5); // 0.5% default slippage
  const [deadline, setDeadline] = useState(15); // 15 minutes default deadline
  const [isSwapping, setIsSwapping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMulitiCallOn, setIsMulitiCallOn] = useState(false);

  const [balanceIn, setBalanceIn] = useState("0");
  const [balanceOut, setBalanceOut] = useState("0");
  const [decimalsIn, setDecimalsIn] = useState(6);
  const [decimalsOut, setDecimalsOut] = useState(18);
  const [allowanceIn, setAllowanceIn] = useState("0");


  const { exactInputSingle, exactOutputSingle, multicall, contract } = useSwapRouter(signer);
  const { quoteExactInputSingle, quoteExactOutputSingle } = useQuote(signer);
  const {
    isInitialized: isERC20InitializedA,
    getBalance: getBalanceIn,
    getBalance: getBalanceOut,
    getAllowance: getAllowanceIn,
    approve: approveTokenIn,
    getDecimal: getDecimalTokenIn,
  } = useERC20(signer);
  const {
    isInitialized: isERC20InitializedB,
    getDecimal: getDecimalTokenOut,
  } = useERC20(signer);
  // const {getFee,isPoolInitialized,initializePool} = usePool(signer);

  // Handle token switch
  const handleSwitchTokens = () => {
    if (tokenIn && tokenOut) {
      setTokenIn(tokenOut);
      setTokenOut(tokenIn);
      setAmountIn(amountOut);
      setAmountOut(amountIn);
    }
  };



  // Handle amount in change
  const handleAmountInChange = async (value: string) => {
    setAmountIn(value);
    setIsOutput(false);
    if (value && parseFloat(value) > 0 && tokenIn && tokenOut) {
      try {


        const quote = await quoteExactInputSingle(
          tokenIn.id,
          tokenOut.id,
          Number(feeTier),
          value,
          '0',
          tokenIn.decimals,
          tokenOut.decimals
        );
        setAmountOut(quote?.amountOut || "0");
      } catch (err) {
        console.error('Error getting quote:', err);
        setAmountOut('');
      }
    } else {
      setAmountOut('');
    }
  };

  // Handle amount out change
  const handleAmountOutChange = async (value: string) => {
    setAmountOut(value);
    setIsOutput(true);
    if (value && parseFloat(value) > 0 && tokenIn && tokenOut) {
      try {


        const quote = await quoteExactOutputSingle(
          tokenIn.id,
          tokenOut.id,
          Number(feeTier),
          value,
          '0',
          tokenIn.decimals,
          tokenOut.decimals
        );
        setAmountIn(quote?.amountIn || "0");
      } catch (err) {
        console.error('Error getting quote:', err);
        setAmountIn('');
      }
    } else {
      setAmountIn('');
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
    if (!amountIn || !balanceIn || !tokenIn) return false;
    try {

      const amountInWei = ethers.parseUnits(amountIn, Number(tokenIn.decimals));
      return BigInt(balanceIn) < amountInWei;
    } catch (e) {
      console.error('Error checking insufficient balance:', e);
      return false;
    }
  }, [amountIn, balanceIn, tokenIn]);

  // Fetch balances and allowances
  const fetchBalancesAndAllowances = useCallback(async () => {
    console.log({
      signer,
      isInitialized,
      isERC20InitializedA,
      isERC20InitializedB,
      tokenIn,
      tokenOut,
    });
    if (
      !signer ||
      !isInitialized ||
      !isERC20InitializedA ||
      !isERC20InitializedB ||
      !tokenIn ||
      !tokenOut
    ) {
      console.warn('Cannot fetch balances: missing required data');
      return;
    }

    try {
      const signerAddress = await signer.getAddress();

      // Fetch balances
      const [balanceA, allowanceA, balanceB] = await Promise.all([
        getBalanceIn(signerAddress, tokenIn.id,tokenIn.symbol),
        getAllowanceIn(signerAddress, SWAP_ROUTER_ADDRESS, tokenIn.id,tokenIn.symbol),
        getBalanceOut(signerAddress, tokenOut.id,tokenOut.symbol),
      ]);

      setBalanceIn(balanceA.toString());
      setBalanceOut(balanceB.toString());
      setAllowanceIn(allowanceA.toString());
      setDecimalsIn(await getDecimalTokenIn(tokenIn.id));
      setDecimalsOut(await getDecimalTokenOut(tokenOut.id));

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
    getAllowanceIn,
  ]);

  // Fetch balances when signer, tokenIn, or tokenOut changes
  useEffect(() => {
    if (signer && tokenIn && tokenOut) {
      setIsInitialized(true);
      fetchBalancesAndAllowances();
    }
  }, [signer, tokenIn?.id, tokenOut?.id]);
  // const fetchQuote = useCallback(async () => {
  //   if (!tokenIn || !tokenOut || !amountIn || !signer) {
  //     setAmountOut("");
  //     return;
  //   }

  //   try {

  //     // const poolAddress = await getPoolAddress(tokenIn, tokenOut);

  //     const decimalsIn = await getDecimalTokenIn(tokenIn.id);
  //     const decimalsOut = await getDecimalTokenOut(tokenOut.id);

  //     // Validate amount is a positive number
  //     if (isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
  //       setAmountOut("");
  //       return;
  //     }
  //     if (!isQuoteInitialized) {
  //       toast.error("Quote contract not initialized");
  //       return;
  //     }

  //     // const quote = await quoteExactInputSingle(
  //     //   tokenIn.id,
  //     //   tokenOut.id,
  //     //   Number(feeTier),
  //     //   amountIn,
  //     //   '0',
  //     //   decimalsIn,
  //     //   decimalsOut,
  //     // );
  //     // const amountOutWei = ethers.parseUnits(quote?.amountOut || "0", decimalsOut);
  //     // const slippageBasisPoints = BigInt(Math.floor(slippage * 100));
  //     // const minAmountOut = ethers.formatUnits(BigInt(amountOutWei) * (10000n - slippageBasisPoints) / 10000n, decimalsOut);
  //     // setAmountOut(minAmountOut.toString());
  //   } catch (err) {
  //     console.error("Failed to get quote:", err);
  //     setAmountOut("");
  //   }
  // }, [
  //   tokenIn,
  //   tokenOut,
  //   amountIn,
  //   // feeTier,
  //   signer,
  //   getDecimalTokenIn,
  //   getDecimalTokenOut,
  //   quoteExactInputSingle,
  //   isQuoteInitialized,
  // ]);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     fetchQuote();
  //   }, 500);

  //   return () => clearTimeout(timer);
  // }, [fetchQuote]);

  const handleApproveTokenIn = async () => {
    if (!amountIn || !signer || !tokenIn) {
      toast.error("Please connect your wallet, select a token, and enter an amount");
      return;
    }

    try {
      setIsSwapping(true);
      const decimals = await getDecimalTokenIn(tokenIn.id);
      const amountInWei = ethers.parseUnits(amountIn, decimals);

      await approveTokenIn(
        SWAP_ROUTER_ADDRESS,
        amountInWei,
        tokenIn.id,
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
    if (!newToken) return;
    setTokenIn(newToken);
    setAmountIn("");
    setAmountOut("");
  };

  // const handleTokenBChange = (newToken: Token) => {
  //   if (!newToken) return;
  //   setTokenOut(newToken);
  //   setAmountIn("");
  //   setAmountOut("");
  // };

  // Handle swap
  const handleSwap = async () => {
    if (!signer || !tokenIn || !tokenOut) {
      console.error('Signer or tokens not initialized');
      toast.error('Please connect your wallet and select tokens');
      return;
    }
    if (!tokenIn || !tokenOut || !amountIn || !amountOut || !signer) {
      toast.error("Please fill in all fields and connect your wallet");
      return;
    }

    try {
      setIsSwapping(true);
      const signerAddress = await signer.getAddress();

      // Get decimals for both tokens
      const [decimalsIn, decimalsOut] = await Promise.all([
        getDecimalTokenIn(tokenIn.id),
        getDecimalTokenOut(tokenOut.id),
      ]);

      // Convert amounts to wei
      const amountInWei = ethers.parseUnits(amountIn, decimalsIn);
      const amountOutWei = ethers.parseUnits(amountOut, decimalsOut);

      // Check and approve tokenIn if needed
      let allowanceIn;
      if (tokenIn.symbol !== "ETH")
        allowanceIn = await getAllowanceIn(
          signerAddress,
          SWAP_ROUTER_ADDRESS,
          tokenIn.id,tokenIn.symbol
        );
      else allowanceIn = amountInWei;
      if (!isMulitiCallOn && BigInt(allowanceIn) < amountInWei) {
        await approveTokenIn(
          SWAP_ROUTER_ADDRESS,
          amountInWei,
          tokenIn.id,
        );

        toast.success("Token approved, please confirm swap");
        return;
      }

      // Calculate slippage
      const slippageBasisPoints = BigInt(Math.floor(slippage * 100));
      const minAmountOut = (BigInt(amountOutWei) * (10000n - slippageBasisPoints)) / 10000n;

      // Execute swap
      /// check with eth
      let tx

  const value = tokenIn.symbol === "ETH" ? amountInWei : 0n;
      if (isMulitiCallOn) {
        
        if (isOutput) {
          // exactOutputSingle encoded call
          if (!contract) throw new Error("Contract not initialized");
          const exactOutputData = contract.interface.encodeFunctionData(
            "exactOutputSingle",
            [{
              tokenIn: tokenIn.id,
              tokenOut: tokenOut.id,
              fee: feeTier,
              recipient: signerAddress,
              deadline: Math.floor(Date.now() / 1000) + deadline * 60,
              amountOut: minAmountOut,
              amountInMaximum: amountInWei,
              sqrtPriceLimitX96: 0n,
            }]
          );
          
          tx = await multicall([exactOutputData], value);
        } else {
          // exactInputSingle encoded call
          if (!contract) throw new Error("Contract not initialized");
          const exactInputData = contract.interface.encodeFunctionData(
            "exactInputSingle",
            [{
              tokenIn: tokenIn.id,
              tokenOut: tokenOut.id,
              fee: feeTier,
              recipient: signerAddress,
              deadline: Math.floor(Date.now() / 1000) + deadline * 60,
              amountIn: amountInWei,
              amountOutMinimum: amountOutWei,
              sqrtPriceLimitX96: 0n,
            }]
          );
    
          tx = await multicall([exactInputData],value);
        }


        console.log("muliticall is on")

      } else {
        if (isOutput) {
          tx = await exactOutputSingle({
            tokenIn: tokenIn.id,
            tokenOut: tokenOut.id,
            fee: feeTier,
            recipient: signerAddress,
            deadline: Math.floor(Date.now() / 1000) + deadline * 60, // 15 minutes from now
            amountOut: minAmountOut,
            amountInMaximum: amountInWei,
            sqrtPriceLimitX96: 0n,

          }, value);
        } else {
          tx = await exactInputSingle({
            tokenIn: tokenIn.id,
            tokenOut: tokenOut.id,
            fee: feeTier,
            recipient: signerAddress,
            deadline: Math.floor(Date.now() / 1000) + deadline * 60, // 15 minutes from now
            amountIn: amountInWei,
            amountOutMinimum: minAmountOut,
            sqrtPriceLimitX96: 0n,

          }, value);
        }
      }
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
            isMulitiCallOn={isMulitiCallOn}
            setIsMulitiCallOn={setIsMulitiCallOn}
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
                  onSelect={handleTokenAChange as any}
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

              />
              <div className="w-40">
                <TokenSelector
                  selectedToken={tokenOut}
                  onSelect={setTokenOut as any}
                />
              </div>
            </div>
          </div>
        </div>


      </div>


      <div className="flex space-x-2">
        {!isInsufficientBalance() ? (
          !isMulitiCallOn && allowanceIn < amountIn ? (
            <button
              type="button"
              onClick={handleApproveTokenIn}
              disabled={isSwapping || !signer || !amountIn || parseFloat(amountIn) <= 0}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white ${isSwapping || !signer || !amountIn || parseFloat(amountIn) <= 0
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
              className={`w-full py-3 px-4 rounded-xl font-medium text-white ${isSwapping || !signer || !amountIn || parseFloat(amountIn) <= 0
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
