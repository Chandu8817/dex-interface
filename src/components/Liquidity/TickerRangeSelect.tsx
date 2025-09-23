import React, { useEffect, useState } from 'react';
import type { JsonRpcSigner } from 'ethers';
import { usePool } from '../../hooks/usePool';

interface TickRangeProps {
  tickLower: string;
  tickUpper: string;
  onTickLowerChange: (value: string) => void;
  onTickUpperChange: (value: string) => void;
  signer: JsonRpcSigner | null;
  poolAddress: string;
}

// utils
const tickToPrice = (tick: number) => Math.pow(1.0001, tick);
const priceToTick = (price: number) => Math.round(Math.log(price) / Math.log(1.0001));

// snap tick to spacing
export const snapTick = (tick: number, tickSpacing: number, isLower: boolean) => {
  return isLower
    ? Math.floor(tick / tickSpacing) * tickSpacing
    : Math.ceil(tick / tickSpacing) * tickSpacing;
};

const TickRange: React.FC<TickRangeProps> = ({
  tickLower,
  tickUpper,
  onTickLowerChange,
  onTickUpperChange,
  signer,
  poolAddress,
}) => {
  const { getSlot0, getTickSpacing } = usePool(signer);
  const [currentTick, setCurrentTick] = useState<number | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [tickSpacing, setTickSpacing] = useState<number>(60); // default

  useEffect(() => {
    const fetchSlot0 = async () => {
      try {
        const slot0 = await getSlot0(poolAddress);

        if (slot0) {
          setCurrentTick(slot0.tick);
          const sqrtRatio = Number(slot0.sqrtPriceX96) / 2 ** 96;
          setCurrentPrice(sqrtRatio * sqrtRatio);
        }

        const spacing = await getTickSpacing(poolAddress);
        if (spacing) setTickSpacing(spacing);
      } catch (err) {
        console.error('Error fetching slot0:', err);
      }
    };
    fetchSlot0();
  }, [getSlot0, getTickSpacing, poolAddress]);

  // Set default tick range to ±2% of currentTick (snapped) if both are empty
  useEffect(() => {
    if (currentTick !== null && tickSpacing && (!tickLower || !tickUpper)) {
      const range = Math.max(1, Math.round(Math.abs(Number(currentTick)) * 0.02));
      const lower = snapTick(Number(currentTick) - range, tickSpacing, true);
      const upper = snapTick(Number(currentTick) + range, tickSpacing, false);
      if (!tickLower) onTickLowerChange(lower.toString());
      if (!tickUpper) onTickUpperChange(upper.toString());
    }
    // Only run when currentTick/tickSpacing are loaded or tickLower/tickUpper are reset
    // eslint-disable-next-line
  }, [currentTick, tickSpacing, tickLower, tickUpper]);

  // UI: derive prices from ticks
  const minPrice = tickLower ? tickToPrice(Number(tickLower)) : '';
  const maxPrice = tickUpper ? tickToPrice(Number(tickUpper)) : '';

  return (
    <div className="w-full bg-white rounded-xl shadow p-4 border">
      <div className="text-sm mb-2 text-gray-500">
        Market price:{' '}
        {currentPrice ? `${currentPrice.toFixed(4)} (Tick ${currentTick})` : 'Loading...'}
      </div>

      <div className="flex gap-4">
        {/* Min Price */}
        <div className="flex-1 bg-gray-50 p-4 rounded-lg flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Min price</div>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => {
              const rawPrice = Number(e.target.value);
              if (!rawPrice) return;
              const rawTick = priceToTick(rawPrice);
              const snapped = snapTick(rawTick, tickSpacing, true);
              onTickLowerChange(snapped.toString());
            }}
            className="w-28 text-center p-2 border rounded"
          />
          <div className="text-xs mt-1 text-gray-400">USDT = 1 ETH (snapped tick {tickLower})</div>
        </div>

        {/* Max Price */}
        <div className="flex-1 bg-gray-50 p-4 rounded-lg flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">Max price</div>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => {
              const rawPrice = Number(e.target.value);
              if (!rawPrice) return;
              const rawTick = priceToTick(rawPrice);
              const snapped = snapTick(rawTick, tickSpacing, false);
              onTickUpperChange(snapped.toString());
            }}
            className="w-28 text-center p-2 border rounded"
          />
          <div className="text-xs mt-1 text-gray-400">USDT = 1 ETH (snapped tick {tickUpper})</div>
        </div>
      </div>
    </div>
  );
};

export default TickRange;
