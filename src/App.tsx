import { useEffect, useState } from "react";
import { useMetaMask } from "./hooks/useMetaMask";
import { SwapTab } from "./components/Swap/SwapTab";
import { LiquidityTab } from "./components/Liquidity/LiquidityTab";
import { PoolsTab } from "./components/Pools/PoolsTab";
import "./App.css";
import Transactions from "./components/Transactions";
import {CustomConnectButton}  from "./components/UI/ConnectWalletButton";
import { useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";
import { useWalletClient } from "wagmi";


type TabType = "swap" | "liquidity" | "pools" | "transactions";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("swap");
  const { isConnected } = useAppKitAccount();
  const { data: walletClient, isSuccess } = useWalletClient();
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  useEffect(() => {
    async function setupSigner() {
      if (isSuccess && walletClient) {
        // Convert wagmi’s walletClient → ethers signer
        const provider = new ethers.BrowserProvider(walletClient.transport);
        const s = await provider.getSigner();
        setSigner(s);
      }
    }
    setupSigner();
  }, [walletClient, isSuccess]);



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col">
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dex V3 Adapter
            </h1>
            {
              isConnected && <CustomConnectButton/>
            }
          </header>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              onClick={() => setActiveTab("swap")}
              className={`${activeTab === "swap"
                  ? "text-blue-600 border-blue-500 dark:text-blue-400 dark:border-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                } flex-1 py-4 text-center border-b-2 font-medium text-sm`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab("liquidity")}
              className={`${activeTab === "liquidity"
                  ? "text-blue-600 border-blue-500 dark:text-blue-400 dark:border-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                } flex-1 py-4 text-center border-b-2 font-medium text-sm`}
            >
              Liquidity
            </button>
            <button
              onClick={() => setActiveTab("pools")}
              className={`${activeTab === "pools"
                  ? "text-blue-600 border-blue-500 dark:text-blue-400 dark:border-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                } flex-1 py-4 text-center border-b-2 font-medium text-sm`}
            >
              Pools
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`${activeTab === "transactions"
                  ? "text-blue-600 border-blue-500 dark:text-blue-400 dark:border-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                } flex-1 py-4 text-center border-b-2 font-medium text-sm`}
            >
              Transactions
            </button>
          </div>

          {/* Mobile menu */}
          <div className="sm:hidden mb-6">
            {!isConnected && (
              <CustomConnectButton />
            )}
          </div>
          <div className="px-4 py-6 sm:px-0">
           

            {!isConnected ? (
              <div className="p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No wallet connected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Connect your wallet to start using the Dex V3 Adapter.
                </p>
                <div className="mt-6">
               <CustomConnectButton />
                </div>
              </div>
            ) : (
              <div>
                {activeTab === "swap" && <SwapTab signer={signer} />}
                {activeTab === "liquidity" && <LiquidityTab signer={signer} />}
                {activeTab === "pools" && <PoolsTab signer={signer} handleChangeSetActiveTab={setActiveTab} />}
                {activeTab === "transactions" && <Transactions />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;