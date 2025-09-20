import { Tab } from "@headlessui/react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { ethers } from "ethers";
type Token = {
  id: string;
  symbol: string;
};

type LiquidityAdded = {
  id: string;
  tokenId: string;
  amountA: string;
  amountB: string;
  pair: {
    id: string;
    token0: Token;
    token1: Token;
  };
  createdAtTimestamp: string;
};

type LiquidityRemoved = {
  id: string;
  tokenId: string;
  amountA: string;
  amountB: string;
  pair: {
    id: string;
    token0: Token;
    token1: Token;
  };
  createdAtTimestamp: string;
};

type TokensSwapped = {
  id: string;
  amountIn: string;
  amountOut: string;
  pair: {
    id: string;
    token0: Token;
    token1: Token;
  };
  createdAtTimestamp: string;
};

// GraphQL queries removed. Will use ethers.js to fetch Mint, Burn, and Swap events directly from Uniswap V3 contracts.
const formatDate = (timestamp: string) => {
  return new Date(parseInt(timestamp) * 1000).toLocaleString();
};

export default function Transactions() {
  // GraphQL queries
  const LIQUIDITY_ADDED_QUERY = gql`
    query {
      liquidityAddeds(
        first: 100
        orderBy: createdAtTimestamp
        orderDirection: desc
      ) {
        id
        tokenId
        amountA
        amountB
        pair {
          id
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        createdAtTimestamp
      }
    }
  `;

  const LIQUIDITY_REMOVED_QUERY = gql`
    query {
      pools(
        first: 100
        orderBy: createdAtTimestamp
        orderDirection: desc
      ) {
        id
        feeTier
        amountA
        amountB
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
        createdAtTimestamp
      }
    }
  `;

  const TOKENS_SWAPPED_QUERY = gql`
    query {
      swaps {
    amount0
    amount1
    amountUSD
    id
    timestamp
    token0 {
      id
      symbol
      decimals
    }
    token1 {
      id
      symbol
      decimals
    }
  }
    }
  `;

  // Apollo queries
  type LiquidityAddedResponse = { liquidityAddeds: LiquidityAdded[] };
  type LiquidityRemovedResponse = { liquidityRemoveds: LiquidityRemoved[] };
  type TokensSwappedResponse = { tokensSwappeds: TokensSwapped[] };

  const { data: liquidityAddedData } = useQuery<LiquidityAddedResponse>(LIQUIDITY_ADDED_QUERY);
  const { data: liquidityRemovedData } = useQuery<LiquidityRemovedResponse>(LIQUIDITY_REMOVED_QUERY);
  const { data: tokensSwappedData } = useQuery<TokensSwappedResponse>(TOKENS_SWAPPED_QUERY);

  // Calculate totals
  const totalDeposited = liquidityAddedData?.liquidityAddeds?.reduce(
    (sum: number, tx: LiquidityAdded) =>
      sum + (parseFloat(tx.amountA) + parseFloat(tx.amountB)) / 2, // Simple average of both amounts
    0,
  );

  const totalRemoved = liquidityRemovedData?.liquidityRemoveds?.reduce(
    (sum: number, tx: LiquidityRemoved) =>
      sum + (parseFloat(tx.amountA) + parseFloat(tx.amountB)) / 2,
    0,
  );

  const totalSwapped = tokensSwappedData?.tokensSwappeds?.length || 0;

  return (
    <div className="flex flex-col p-4 max-w-6xl mx-auto w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm font-medium">Total LP Added</h3>
          <p className="text-2xl font-semibold">
            {ethers.formatEther(totalDeposited?.toString() || "0")}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm font-medium">
            Total LP Removed
          </h3>
          <p className="text-2xl font-semibold">
            {ethers.formatEther(totalRemoved?.toString() || "0")}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm font-medium">Total Swaps</h3>
          <p className="text-2xl font-semibold">{totalSwapped}</p>
        </div>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md transition-colors ${
                selected
                  ? "bg-white shadow text-indigo-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`
            }
          >
            LP Deposits
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md transition-colors ${
                selected
                  ? "bg-white shadow text-indigo-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`
            }
          >
            LP Withdrawals
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md transition-colors ${
                selected
                  ? "bg-white shadow text-indigo-700"
                  : "text-gray-600 hover:bg-gray-200"
              }`
            }
          >
            Swaps
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          {/* LP Deposits Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pair
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LP Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token 0 Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token 1 Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liquidityAddedData?.liquidityAddeds?.map((tx: LiquidityAdded) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tx.createdAtTimestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tx.pair.token0.symbol}/{tx.pair.token1.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(
                            Number(ethers.formatEther(tx.amountA)) + Number(ethers.formatEther(tx.amountB))
                          ).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Number(ethers.formatEther(tx.amountA)).toFixed(4)} {tx.pair.token0.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Number(ethers.formatEther(tx.amountB)).toFixed(4)} {tx.pair.token1.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.tokenId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>
          {/* LP Withdrawals Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pair
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        LP Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token 0 Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token 1 Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Token ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {liquidityRemovedData?.liquidityRemoveds?.map((tx: LiquidityRemoved) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tx.createdAtTimestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tx.pair.token0.symbol}/{tx.pair.token1.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(
                            Number(ethers.formatEther(tx.amountA)) + Number(ethers.formatEther(tx.amountB))
                          ).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Number(ethers.formatEther(tx.amountA)).toFixed(4)} {tx.pair.token0.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Number(ethers.formatEther(tx.amountB)).toFixed(4)} {tx.pair.token1.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.tokenId}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>
          {/* Swaps Panel */}
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pair
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Out
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tokensSwappedData?.tokensSwappeds?.map((tx: TokensSwapped) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tx.createdAtTimestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tx.pair.token0.symbol}/{tx.pair.token1.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Number(ethers.formatEther(tx.amountIn)).toFixed(4)} {tx.pair.token0.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {Number(ethers.formatEther(tx.amountOut)).toFixed(4)} {tx.pair.token1.symbol}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
