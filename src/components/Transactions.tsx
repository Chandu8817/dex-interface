import { Tab } from '@headlessui/react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ethers } from 'ethers';

type Transactions = {
  id: string;
  timestamp: string;
};


// GraphQL queries removed. Will use ethers.js to fetch Mint, Burn, and Swap events directly from Uniswap V3 contracts.
const formatDate = (timestamp: string) => {
  return new Date(parseInt(timestamp) * 1000).toLocaleString();
};

export default function Transactions() {
  // GraphQL queries
  const TRANSACTIONS_QUERY = gql`
    query {
      transactions(first: 100, orderBy: timestamp, orderDirection: desc) {
        id
    
        timestamp
      }
    }
  `;


  // Apollo queries
  type TransactionsResponse = { transactions: Transactions[] };

  const { data: transactionsData } = useQuery<TransactionsResponse>(TRANSACTIONS_QUERY);

  // Calculate totals
  const totalTx = transactionsData?.transactions?.length || 0;

 

 

  return (
    <div className="flex flex-col p-4 max-w-6xl mx-auto w-full">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-gray-500 text-sm font-medium">Total LP Added</h3>
          <p className="text-2xl font-semibold">
            {ethers.formatEther(totalTx?.toString() || '0')}
          </p>
        </div>
        
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md transition-colors ${
                selected ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-gray-200'
              }`
            }
          >
            LP Deposits
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md transition-colors ${
                selected ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-gray-200'
              }`
            }
          >
            LP Withdrawals
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full py-2.5 text-sm font-medium rounded-md transition-colors ${
                selected ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:bg-gray-200'
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
                        tx hash
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactionsData?.transactions?.map((tx: Transactions) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(tx.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tx.id}
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
