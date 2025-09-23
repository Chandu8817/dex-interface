import { Dialog, Transition, Tab } from '@headlessui/react'
import { Fragment, useCallback, useEffect, useState } from 'react'

import { formatDisplayBalance } from '../../utils/tokenUtils'
import { usePositionManager } from '../../hooks/usePositionManager'
import { ethers } from 'ethers'
import {SlippageSettings} from '../SlippageSettings'
import type { IncreaseLiquidityParams } from '../../hooks/usePositionManager'

import { useAccount } from 'wagmi'
import { toast } from 'react-toastify'
import { useQuote } from '../../hooks/useQuote'
import { useERC20 } from '../../hooks/useERC20'
import { POSITION_MANAGER_ADDRESS } from '../../constants'


interface LiquidityManageModalProps {
  isOpen: boolean
  onClose: () => void
  position?: any
  signer: ethers.JsonRpcSigner
}

export function LiquidityManageModal({ isOpen, onClose, position, signer }: LiquidityManageModalProps) {
  if (!position) return null

  const [liquidity, setLiquidity] = useState(position.liquidity)
  const [amount0, setAmount0] = useState(position.amount0)
  const [amount1, setAmount1] = useState(position.amount1)
  const {address}  = useAccount()
  const [slippage, setSlippage] = useState(0.5); // 0.5% default slippage
  const [deadline, setDeadline] = useState(15); // 15 minutes default deadline
  const { increaseLiquidity, isInitialized,multicall,contract ,getAmountsDecreaseLiquidity  } = usePositionManager(signer)
  const { quoteExactInputSingle, isInitialized: isQuoteInitialized } = useQuote(signer)
  const { getDecimal: getDecimalTokenIn } = useERC20(signer)
  const { getDecimal: getDecimalTokenOut } = useERC20(signer)
  const { checkOrApproveAll } = useERC20(signer)

  const handleIncreaseLiquidity = async () => {
    if (!isInitialized) return
    const decimalsA = await getDecimalTokenIn(position.token0)
    const decimalsB = await getDecimalTokenOut(position.token1)

    
    const amount0Wei = ethers.parseUnits(amount0.toString(), Number(decimalsA))
    const amount1Wei = ethers.parseUnits(amount1.toString(), Number(decimalsB))
    const checkOrApproveAllTx = await checkOrApproveAll(position.token0, position.token1, amount0Wei, amount1Wei, POSITION_MANAGER_ADDRESS, position.symbol, position.symbol)
    if (!checkOrApproveAllTx) return
    const params: IncreaseLiquidityParams = {
      tokenId: position?.tokenId,
      amount0Desired: amount0Wei,
      amount1Desired: amount1Wei,
      amount0Min: 0n,
      amount1Min: 0n,
      deadline: Math.floor(Date.now() / 1000) + 60 * 10,
    }
    await increaseLiquidity(params)
    setAmount0('')
    setAmount1('')
    setLiquidity(position.liquidity)
    console.log("liquidity added")
    toast.success('Liquidity added successfully')

    onClose()
  }

  const handleDecreaseLiquidity = async () => {
    if (!isInitialized ) {
      console.error('Contract not initialized. Please connect your wallet first.');
      return;
    }
    
    const amounts = await getAmountsDecreaseLiquidity(position)
    const amount0Max = Math.floor(Number(amounts.amount0)*slippage/100)
    const amount1Max = Math.floor(Number(amounts.amount1)*slippage/100)
    
    if(!contract){
      console.error('Contract not initialized. Please connect your wallet first.');
      return;
    }
    
    const calldata = [
      contract?.interface.encodeFunctionData('decreaseLiquidity', [
        {
          tokenId: position?.tokenId,
          liquidity: liquidity,
          amount0Min: BigInt(amount0Max),
          amount1Min: BigInt(amount1Max),
          deadline: Math.floor(Date.now() / 1000) + 60 * deadline,
        },
      ]),
      contract?.interface.encodeFunctionData('collect', [
        {
          tokenId: position?.tokenId,
          recipient: address,
          amount0Max: BigInt(amount0Max),
          amount1Max: BigInt(amount1Max),
        },
      ]),
    ]

   const tx = await multicall(calldata,0n)
    if(tx){
      console.log("liquidity removed")
    }else{
      console.log("liquidity not removed")
    }
    onClose()
  }

    const getAmountOut = useCallback(async () => {
      if (!position.token0 || !position.token1 || !amount0 || !signer) {
        setAmount0('');
        return;
      }
  
      try {
        const decimalsIn = await getDecimalTokenIn(position.token0);
        const decimalsOut = await getDecimalTokenOut(position.token1);
  
        // Validate amount is a positive number
        if (isNaN(Number(amount0)) || Number(amount0) <= 0) {
          setAmount0('');
          return;
        }
        if (!isQuoteInitialized) {
          toast.error('Quote contract not initialized');
          return;
        }
  
        const quote = await quoteExactInputSingle(
          position.token0,
          position.token1,
          Number(position.fee),
          amount0.toString(),
          '0',
          decimalsIn,
          decimalsOut,
        );
        if (!quote) return;
  
        const amountOutWei = ethers.parseUnits(quote.amountOut, decimalsOut);
        const slippageBasisPoints = BigInt(Math.floor(slippage * 100));
        const minAmountOut = ethers.formatUnits(
          (BigInt(amountOutWei) * (10000n - slippageBasisPoints)) / 10000n,
          decimalsOut,
        );
        setAmount1(minAmountOut.toString());
      } catch (err) {
        console.error("Failed to get quote:", err);
      }
    }, [
      position,
      amount0,
      signer,
      quoteExactInputSingle,
    ]);
  
    useEffect(() => {
      getAmountOut();
    }, [amount0, position, slippage, signer]);
  

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                >
                  Manage Liquidity Position
                </Dialog.Title>
                <SlippageSettings
                  slippage={slippage}
                  onSlippageChange={setSlippage}
                  deadline={deadline}
                  onDeadlineChange={setDeadline}
                />

                {/* Position Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-4">
                    <div className="flex -space-x-2 mr-4">
                      <img
                        src={position.token0Logo}
                        alt={position.token0Symbol}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                      />
                      <img
                        src={position.token1Logo}
                        alt={position.token1Symbol}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {position.token0Symbol} / {position.token1Symbol}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fee tier: {Number(position.fee) / 10000}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs for Add / Remove */}
                <Tab.Group>
                  <Tab.List className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-4">
                    {['Add Liquidity', 'Remove Liquidity'].map((tab) => (
                      <Tab
                        key={tab}
                        className={({ selected }) =>
                          `flex-1 rounded-md py-2 text-sm font-medium ${
                            selected
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`
                        }
                      >
                        {tab}
                      </Tab>
                    ))}
                  </Tab.List>

                  <Tab.Panels>
                    {/* Add Liquidity Tab */}
                    <Tab.Panel>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {position.token0Symbol}
                            </label>
                            <input
                              type="number"
                              value={amount0}
                              onChange={(e) => setAmount0(BigInt(e.target.value))}
                              placeholder="0.0"
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {position.token1Symbol}
                            </label>
                            <input
                              type="number"
                              value={amount1}
                              onChange={(e) => setAmount1(BigInt(e.target.value))}
                              placeholder="0.0"
                              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleIncreaseLiquidity}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                        >
                          Add Liquidity
                        </button>
                      </div>
                    </Tab.Panel>

                    {/* Remove Liquidity Tab */}
                    <Tab.Panel>
                      <div className="space-y-4">

                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Liquidity Amount: {formatDisplayBalance(liquidity, 6)}
                        </label>
                        <input
                          type="range"
                          value={liquidity}
                          onChange={(e) => setLiquidity(BigInt(e.target.value))}
                          min="0"
                          max={position.liquidity}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDecreaseLiquidity}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
                        >
                          Remove Liquidity
                        </button>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
