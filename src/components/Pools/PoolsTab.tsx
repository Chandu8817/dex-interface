import { useState, useEffect } from 'react';
import type { Token, Pool } from '../../types';
import { useFactory } from '../../hooks/useFactory';
import { TokenSelector } from '../TokenSelector';
import { useTokens } from '../../hooks/useTokens';
import { ethers } from 'ethers';
import { usePool } from '../../hooks/usePool';

import { useQuery } from '@apollo/client/react';
import tokenLogos from '../../data/tokens.json';
import { formatDisplayBalance } from '../../utils/tokenUtils';
import { POOLS_QUERY } from './query';
import { usePositionManager } from '../../hooks/usePositionManager';
import { snapTick } from '../Liquidity/TickerRangeSelect';
import { useERC20 } from '../../hooks/useERC20';
import { POSITION_MANAGER_ADDRESS } from '../../constants';
import { LiquidityManageModal } from '../Liquidity/LiquidityManageModal';

// Using Pool type from types.ts

interface PoolsTabProps {
  signer: ethers.Signer | null;
  handleChangeSetActiveTab: (tab: 'swap' | 'liquidity' | 'pools' | 'transactions') => void;
}

export function PoolsTab({ signer, handleChangeSetActiveTab }: PoolsTabProps) {
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [feeTier, setFeeTier] = useState(3000);
  const [searchQuery, setSearchQuery] = useState('');
  const [pools, setPools] = useState<Pool[]>([]);
  const [userPositions, setUserPositions] = useState<Pool[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'your'>('all');
  const [reserve0, setReserve0] = useState<number>(0);
  const [reserve1, setReserve1] = useState<number>(0);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Pool | null>(null);

  const { getTokenByAddress } = useTokens();
  const { getPoolAddress, createPool } = useFactory(signer as ethers.JsonRpcSigner);
  const { getUserPositions, mint } = usePositionManager(signer as ethers.JsonRpcSigner);
  const { initializePool, isPoolInitialized, getSlot0, getTickSpacing } = usePool(
    signer as ethers.JsonRpcSigner,
  );
  const { checkOrApproveAll, getSymbol } = useERC20(signer as ethers.JsonRpcSigner);

  const { data } = useQuery<any>(POOLS_QUERY, {
    variables: {
      first: 10,
      skip: 0,
      orderBy: 'volumeUSD',
      orderDirection: 'desc',
      where: {}, // add any filters you need
    },
  });

  const poolData = data?.pools ?? [];

  useEffect(() => {
    if (poolData) {
      const pools = (poolData || []).map((pool: any) => {
        const token0Logo = tokenLogos.find(
          (logo) => logo.symbol.toLowerCase() === pool.token0.symbol.toLowerCase(),
        );
        const token1Logo = tokenLogos.find(
          (logo) => logo.symbol.toLowerCase() === pool.token1.symbol.toLowerCase(),
        );

        return {
          ...pool,
          token0: {
            ...pool.token0,
            logoURI:
              token0Logo?.url ||
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
          },
          token1: {
            ...pool.token1,
            logoURI:
              token1Logo?.url ||
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
          },
        };
      });
      setPools(pools);
    }
  }, [poolData]);

  useEffect(() => {
    const fetchUserPools = async () => {
      if (signer) {
        try {
          setIsLoading(true);
          const userAddress = await signer.getAddress();
          const positions = await getUserPositions(userAddress);
          const detailedPositions = await Promise.all(
            positions.map(async (pos) => {
              const poolAddress = await getPoolAddress(
                getTokenByAddress(pos.token0)!,
                getTokenByAddress(pos.token1)!,
                pos.fee,
              );
              return {
                ...pos,
                poolAddress,
                token0Logo: getTokenByAddress(pos.token0)?.logoURI,
                token1Logo: getTokenByAddress(pos.token1)?.logoURI,
                token0Symbol: getTokenByAddress(pos.token0)?.symbol,
                token1Symbol: getTokenByAddress(pos.token1)?.symbol,
              };
            }),
          );
          console.log('User positions:', detailedPositions);

          setUserPositions(detailedPositions);
          // You can further process positions to fetch pool details if needed
        } catch (err) {
          console.error('Error fetching user positions:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    if (activeTab === 'your') {
      fetchUserPools();
    }
  }, [signer, activeTab]);

  // Fetch pools data
  const fetchPools = async () => {
    setIsLoading(true);
    setError(null);

    try {
    } catch (error) {
      console.error('Error fetching pools:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch pools'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const handleCreatePool = async () => {
    
    if (!tokenA || !tokenB) {
      console.error('Both tokens must be selected');
      return;
    }

    try {
      setIsLoading(true);

      const token0: Token = tokenA!;
      const token1: Token = tokenB!;

      const sortedTokens = [token0, token1].sort((a, b) =>
        a.id.toLowerCase() < b.id.toLowerCase() ? -1 : 1,
      ) as [Token, Token];

      const [sortedToken0, sortedToken1] = sortedTokens;
      let amount0, amount1;

      if (sortedToken0.id.toLowerCase() === tokenA.id.toLowerCase()) {
        // matlab tokenA == token0
        amount0 = ethers.parseUnits(reserve0.toString(), Number(sortedToken0.decimals));
        amount1 = ethers.parseUnits(reserve1.toString(), Number(sortedToken1.decimals));
      } else {
        // matlab tokenB == token0
        amount0 = ethers.parseUnits(reserve1.toString(), Number(sortedToken0.decimals));
        amount1 = ethers.parseUnits(reserve0.toString(), Number(sortedToken1.decimals));
      }

      // Check if pool already exists
      let poolAddress = await getPoolAddress(sortedToken0, sortedToken1, feeTier);
      const poolExists = poolAddress !== ethers.ZeroAddress;

      if (poolExists) {
        const isInitialized = await isPoolInitialized(poolAddress);
        if (isInitialized) {
          console.log('Pool already initialized');
          return;
        }

        await initializePool(poolAddress, amount0, amount1);
      }

      // Create the pool
      console.log('Creating pool with:', {
        token0: sortedToken0,
        token1: sortedToken1,
        feeTier,
      });

      const { txHash, newPoolAddress } = await createPool(sortedToken0, sortedToken1, feeTier);

      console.log('New pool address:', newPoolAddress);

      if (txHash && newPoolAddress) {
        await initializePool(newPoolAddress, BigInt(amount0), BigInt(amount1));
      } else {
        throw new Error('Failed to create pool');
      }
     

      console.log('Pool created at:', newPoolAddress);

      const symbolA = await getSymbol(sortedToken0.id);
      const symbolB = await getSymbol(sortedToken1.id);

      const checkOrApproveAllTx = await checkOrApproveAll(
        sortedToken0.id,
        sortedToken1.id,
        amount0,
        amount1,
        POSITION_MANAGER_ADDRESS,
        symbolA,
        symbolB,
      );

      const slot0 = await getSlot0(newPoolAddress);
      const currentTick = slot0.tick;
      const tickSpacing = await getTickSpacing(newPoolAddress);
      const range = Math.max(1, Math.round(Math.abs(Number(currentTick)) * 0.02));
      const lower = snapTick(Number(currentTick) - range, Number(tickSpacing), true);
      const upper = snapTick(Number(currentTick) + range, Number(tickSpacing), false);

      // mint lp position
      if (checkOrApproveAllTx) {
        const mintTx = await mint({
          token0: sortedToken0.id,
          token1: sortedToken1.id,
          fee: feeTier,
          tickLower: lower,
          tickUpper: upper,
          amount0Desired: amount0,
          amount1Desired: amount1,
          amount0Min: 0n,
          amount1Min: 0n,
          recipient: await signer!.getAddress(),
          deadline: Math.floor(Date.now() / 1000) + 60 * 10,
        });
        console.log('Mint tx hash:', mintTx.txHash);
      }

      // Refresh the pools list
      await fetchPools();

      // Reset the form
      setTokenA(null);
      setTokenB(null);
      setFeeTier(3000); // Reset to default fee tier
    } catch (error) {
      console.error('Error creating pool:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPools = pools.filter((pool: any) => {
    const matchesSearch =
      searchQuery === '' ||
      pool.token0.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.token1.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'your') {
      // TODO: Filter for user's pools only
      return matchesSearch;
    }

    return matchesSearch;
  });

  const handleAddLiquidity = (pool: Pool) => {
    try {
      if (!pool?.token0 || !pool?.token1) {
        console.error('Invalid pool data:', pool);
        return;
      }

      setSelectedPosition(pool);
      setIsManageModalOpen(true);
    } catch (error) {
      console.error('Error in handleAddLiquidity:', error);
      // In a real app, show a user-friendly error message
    }
  };

  // Render error message if there's an error
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error loading pools
            </h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error.message}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={fetchPools}
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/40"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading && pools.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LiquidityManageModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        position={selectedPosition || undefined}
        signer={signer as ethers.JsonRpcSigner}
      />
      {/* Show loading overlay if pools are being updated */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="text-gray-700 dark:text-gray-200">Processing...</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pools</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'all'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              All Pools
            </button>
            <button
              onClick={() => setActiveTab('your')}
              className={`px-4 py-2 text-sm font-medium rounded-lg ${
                activeTab === 'your'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              Your Positions
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Token A Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Token 1
              </label>
              <TokenSelector
                selectedToken={tokenA}
                onSelect={setTokenA}
                excludeToken={tokenB}
                label=""
              />
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Initial Reserve
                </label>
                <input
                  type="number"
                  value={reserve0}
                  onChange={(e) => setReserve0(Number(e.target.value))}
                  placeholder="0.0"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Token B Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Token 2
              </label>
              <TokenSelector
                selectedToken={tokenB}
                onSelect={setTokenB}
                excludeToken={tokenA}
                label=""
              />
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Initial Reserve
                </label>
                <input
                  type="number"
                  value={reserve1}
                  onChange={(e) => setReserve1(Number(e.target.value))}
                  placeholder="0.0"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Fee Tier Section */}
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fee Tier
            </label>
            <select
              value={feeTier}
              onChange={(e) => setFeeTier(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={100}>0.01% - Best for stable pairs (e.g., USDC/USDT)</option>
              <option value={500}>0.05% - Best for stable pairs</option>
              <option value={3000}>0.3% - Best for most pairs (e.g., ETH/USDC)</option>
              <option value={10000}>1% - Best for exotic pairs</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select the fee tier that best matches your trading pair.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCreatePool}
            disabled={!tokenA || !tokenB || isLoading}
            className={`px-6 py-2 rounded-lg font-medium ${
              !tokenA || !tokenB || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Loading...' : 'Create Pool'}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {activeTab === 'all' ? 'All Pools' : 'Your Positions'}
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No pools found matching your search.' : 'No pools found.'}
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            {activeTab === 'all' ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Pool
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Liquidity
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Fee Tier
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPools.map((pool: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex -space-x-2">
                            <img
                              className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800"
                              src={pool.token0.logoURI}
                              alt={pool.token0.symbol}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
                              }}
                            />
                            <img
                              className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800"
                              src={pool.token1.logoURI}
                              alt={pool.token1.symbol}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {pool.token0.symbol} / {pool.token1.symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDisplayBalance(pool.liquidity, 6)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {pool.feeTier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleChangeSetActiveTab('liquidity')}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Add Liquidity
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Pool
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Liquidity
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Position ID
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {userPositions.map((pos: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {/* Pool Tokens */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex -space-x-2">
                            <img
                              className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800"
                              src={
                                pos.token0Logo ||
                                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
                              }
                              alt={pos.token0Symbol || 'T0'}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
                              }}
                            />
                            <img
                              className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800"
                              src={
                                pos.token1Logo ||
                                'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
                              }
                              alt={pos.token1Symbol || 'T1'}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
                              }}
                            />
                          </div>
                          <br />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {pos.token0Symbol} / {pos.token1Symbol}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Liquidity */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDisplayBalance(pos.liquidity, 6)}
                      </td>

                      {/* Token ID */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        #{pos.tokenId}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleAddLiquidity(pos)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
