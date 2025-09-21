"use client";
import { useAppKitAccount } from "@reown/appkit/react";
import { appKit } from "../../../utils/modal";

export function CustomConnectButton() {
  const { address, isConnected } = useAppKitAccount();

  const handleClick = () => {
    if (!isConnected) {
      appKit.open({ view: "Connect" });
    } else {
      appKit.open({ view: "Account" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 rounded bg-blue-600 text-white"
    >
      {isConnected && address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "Connect Wallet"}
    </button>
  );
}