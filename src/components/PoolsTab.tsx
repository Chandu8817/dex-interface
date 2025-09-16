import { useState, useEffect } from 'react';
import type { Token, Pool } from '../types';
import { usePool } from '../hooks/usePool';
import { TokenSelector } from './TokenSelector';
import { useTokens } from '../hooks/useTokens';

// Using Pool type from types.ts

export function PoolsTab() {
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [feeTier, setFeeTier] = useState(3000);
  const [searchQuery, setSearchQuery] = useState('');
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'your'>('all');
  
  const { tokens } = useTokens();
  const { getPoolAddress, createPool } = usePool();
  
  // Mock tokens data for testing
  const mockTokens: Token[] = [
    {
      address: '0x0000000000000000000000000000000000000000',
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      decimals: 18,
      logoURI: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png'
    },
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      logoURI: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png'
    }
  ];

  // Fetch pools data
  const fetchPools = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, you would fetch this data from:
      // 1. Your subgraph for Dex V3
      // 2. Your own backend API
      // 3. Directly from the blockchain using ethers.js
      
      // Mock data for demonstration
      const mockPools: Pool[] = [
        {
          token0: mockTokens[0],
          token1: mockTokens[1],
          fee: 3000,
          tvl: '$1,234,567',
          volume24h: '$123,456',
          feeTier: '0.3%',
          address: '0x123...456'
        },
        {
          token0: mockTokens[1],
          token1: mockTokens[2],
          fee: 500,
          tvl: '$987,654',
          volume24h: '$45,678',
          feeTier: '0.05%',
          address: '0x789...012'
        },
        // Add more mock pools as needed
      ];
      
      // In a real app, you would do something like:
      // const response = await fetch('https://api.your-service.com/v3/pools');
      // const poolsData = await response.json();
      // setPools(poolsData);
      
      setPools(mockPools);
      
    } catch (error) {
      console.error('Error fetching pools:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch pools'));
      
      // In a real app, you might want to:
      // 1. Show a toast notification
      // 2. Retry the request
      // 3. Show a user-friendly error message
      
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
      
      // Ensure we have valid token objects
      const token0: Token = tokenA;
      const token1: Token = tokenB;
      
      // Sort tokens by address to ensure consistent pool address calculation
      const sortedTokens = [token0, token1].sort((a, b) => 
        a.address.toLowerCase() < b.address.toLowerCase() ? -1 : 1
      ) as [Token, Token];
      
      const [sortedToken0, sortedToken1] = sortedTokens;
      
      // Check if pool already exists
      const poolAddress = await getPoolAddress(sortedToken0, sortedToken1, feeTier);
      const poolExists = !!poolAddress;
      
      if (poolExists) {
        console.log('Pool already exists:', poolAddress);
        // In a real app, you might want to navigate to the pool or show a message
        return;
      }
      
      // Create the pool
      console.log('Creating pool with:', { 
        token0: sortedToken0, 
        token1: sortedToken1, 
        feeTier 
      });
      
      const newPoolAddress = await createPool(sortedToken0, sortedToken1, feeTier);
      
      if (!newPoolAddress) {
        throw new Error('Failed to create pool: No address returned');
      }
      
      console.log('Pool created at:', newPoolAddress);
      
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

  const filteredPools = pools.filter((pool) => {
    const matchesSearch = searchQuery === '' || 
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
      if (!pool?.token0?.address || !pool?.token1?.address) {
        console.error('Invalid pool data:', pool);
        return;
      }
      
      const { token0, token1, fee } = pool;
      
      console.log('Adding liquidity to pool:', {
        token0: token0.address,
        token1: token1.address,
        fee
      });
      
      // In a real app, you would:
      // 1. Set the tokens and fee in the liquidity context/state
      // 2. Switch to the liquidity tab
      // 3. Pre-fill the token amounts if needed
      
      // Example implementation with React Router:
      // navigate('/liquidity', { 
      //   state: { 
      //     token0: token0.address,
      //     token1: token1.address,
      //     feeTier: fee
      //   } 
      // });
      
      // For now, we'll just show an alert
      alert(`Would navigate to add liquidity for ${token0.symbol}/${token1.symbol} (${fee / 10000}%)`);
      
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
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
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
              Your Pools
            </button>
          </div>
        </div>

        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <TokenSelector
              selectedToken={tokenA}
              onSelect={setTokenA}
              excludeToken={tokenB}
              label="Token 1"
            />
          </div>
          <div className="flex-1">
            <TokenSelector
              selectedToken={tokenB}
              onSelect={setTokenB}
              excludeToken={tokenA}
              label="Token 2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fee Tier
            </label>
            <select
              value={feeTier}
              onChange={(e) => setFeeTier(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={100}>0.01%</option>
              <option value={500}>0.05%</option>
              <option value={3000}>0.3%</option>
              <option value={10000}>1%</option>
            </select>
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
            {activeTab === 'all' ? 'All Pools' : 'Your Pools'}
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pool
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    TVL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Volume (24h)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fee Tier
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPools.map((pool, index) => (
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
                              target.src = 'https://via.placeholder.com/32';
                            }}
                          />
                          <img
                            className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-800"
                            src={pool.token1.logoURI}
                            alt={pool.token1.symbol}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://via.placeholder.com/32';
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
                      {pool.tvl}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {pool.volume24h}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {pool.feeTier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleAddLiquidity(pool)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Add Liquidity
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
