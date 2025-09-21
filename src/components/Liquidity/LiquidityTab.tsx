import { useState, useEffect } from 'react';
import { JsonRpcSigner } from 'ethers';
import { useAccount } from 'wagmi';
import { Tab } from '@headlessui/react';
import type { Token } from '../shared/types';
import { useTokens } from '../../hooks/useTokens';
import { TransactionStatus } from '../common';
import { PairSelector } from './components/PairSelector';
import { useLiquidityPosition } from './hooks/useLiquidityPosition';
import { getRequiredUSDT } from '../../utils/getAmonutsForLP';

interface LiquidityTabProps {
  signer: JsonRpcSigner | null;
}

export const LiquidityTab = ({ signer }: LiquidityTabProps) => {
  const { address: account } = useAccount();
  const { tokens, getTokenBySymbol } = useTokens();
  
  // State for pair selection
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [fee, setFee] = useState(3000); // 0.3% fee tier
  const [step, setStep] = useState<1 | 2>(1);
  
  // Initialize default tokens when tokens are loaded
  useEffect(() => {
    if (tokens.length > 0 && !tokenA && !tokenB) {
      const defaultTokenA = getTokenBySymbol('ETH');
      const defaultTokenB = getTokenBySymbol('USDC');
      setTokenA(defaultTokenA as Token);
      setTokenB(defaultTokenB as Token);
    }
  }, [tokens, getTokenBySymbol, tokenA, tokenB]);



  // Liquidity position management
  const {
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
    tokenABalance,
    tokenBBalance,
  } = useLiquidityPosition(tokenA, tokenB, account, signer, fee);

  // Handle token switch
  const handleSwitchTokens = () => {
    const temp = tokenA;
    setTokenA(tokenB);
    setTokenB(temp);
    resetAmounts();
  };


  // Handle next step
  const handleNext = () => {
    if (tokenA && tokenB) {
      setStep(2);
    }
  };

  // Handle back to pair selection
  const handleBack = () => {
    setStep(1);
    resetAmounts();
  };

  // const handle getAmountsForLP
  const handleGetAmountsForLP = () => {
    if (tokenA && tokenB) {
      const { liquidity, amountUSDT } = getRequiredUSDT(
        4470, 4096, 4759
      );
    console.log(liquidity, amountUSDT);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-900 rounded-2xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Liquidity</h2>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-colors duration-200 ${
                selected
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-blue-100 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            Add Liquidity
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-colors duration-200 ${
                selected
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-blue-100 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            Remove Liquidity
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="mt-2">
          <Tab.Panel>
            {step === 1 ? (
              <PairSelector
                tokenA={tokenA}
                tokenB={tokenB}
                onTokenAChange={setTokenA as any}
                onTokenBChange={setTokenB as any}
                fee={fee}
                onFeeChange={setFee}
                onNext={handleNext}
                disabled={isLoading}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Add Liquidity</h3>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                    disabled={isLoading}
                  >
                    ← Back
                  </button>
                </div>
                
                {/* Amount Inputs */}
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Input</span>
                      <span className="text-sm text-gray-400">
                        Balance: {tokenABalance.formattedBalance}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        className="bg-transparent text-2xl w-full outline-none text-white"
                        placeholder="0.0"
                        value={amountA}
                        onChange={(e) => setAmountA(e.target.value)}
                        disabled={isLoading}
                      />
                      {tokenA && (
                        <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1.5">
                          <img 
                            src={tokenA.logoURI} 
                            alt={tokenA.symbol} 
                            className="w-6 h-6 rounded-full" 
                          />
                          <span>{tokenA.symbol}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-center -my-2">
                    <button
                      type="button"
                      onClick={handleSwitchTokens}
                      className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
                      disabled={isLoading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M15.707 4.293a1 1 0 010 1.414L10.414 11H18a1 1 0 110 2h-7.586l5.293 5.293a1 1 0 01-1.414 1.414l-7-7a1 1 0 010-1.414l7-7a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">Output</span>
                      <span className="text-sm text-gray-400">
                        Balance: {tokenBBalance.formattedBalance}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="number"
                        className="bg-transparent text-2xl w-full outline-none text-white"
                        placeholder="0.0"
                        value={amountB}
                        onChange={(e) => setAmountB(e.target.value)}
                        disabled={isLoading}
                      />
                      {tokenB && (
                        <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1.5">
                          <img 
                            src={tokenB.logoURI} 
                            alt={tokenB.symbol} 
                            className="w-6 h-6 rounded-full" 
                          />
                          <span>{tokenB.symbol}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Transaction Settings */}
                <div className="bg-gray-800 rounded-xl p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Slippage tolerance</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        className="w-20 bg-gray-700 rounded-lg px-3 py-1.5 text-right"
                        value={slippage}
                        onChange={(e) => setSlippage(Number(e.target.value))}
                        step="0.1"
                        min="0.1"
                        max="50"
                        disabled={isLoading}
                      />
                      <span>%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Transaction deadline</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        className="w-20 bg-gray-700 rounded-lg px-3 py-1.5 text-right"
                        value={deadline}
                        onChange={(e) => setDeadline(Number(e.target.value))}
                        min="1"
                        max="30"
                        disabled={isLoading}
                      />
                      <span>minutes</span>
                    </div>
                  </div>
                </div>
                
                {/* Add Liquidity Button */}
                <button
                  type="button"
                  onClick={handleAddLiquidity}
                  disabled={!tokenA || !tokenB || !amountA || !amountB || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
                </button>
              </div>
            )}
          </Tab.Panel>
          
          <Tab.Panel>
            <div className="text-center py-8">
              <p className="text-gray-400">Remove liquidity coming soon</p>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
      
      {/* Transaction Status */}
      <TransactionStatus
        transactionHash={txHash || undefined}
        status={isLoading ? 'pending' : txHash ? 'success' : 'idle'}
        error={error || undefined}
      />
    </div>
  );
};
