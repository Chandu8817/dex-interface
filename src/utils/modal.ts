import { createAppKit } from '@reown/appkit';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { arbitrum, mainnet, sepolia } from '@reown/appkit/networks';

const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, arbitrum, sepolia],
  projectId: import.meta.env.VITE_PROJECT_ID,
});

export const appKit = createAppKit({
  projectId: import.meta.env.VITE_PROJECT_ID, // ✅ add this
  adapters: [wagmiAdapter], // ✅ required
  networks: [mainnet, arbitrum, sepolia], // ✅ required
  metadata: {
    name: 'Dex V3',
    description: 'Dex V3 description',
    url: 'https://dexv3.com',
    icons: ['https://dexv3.com/icon.png'],
  },
  features: {
    onramp: false, // hide fund
    swaps: false, // hide swap
    // send: false (if supported in your version)
  },
});
