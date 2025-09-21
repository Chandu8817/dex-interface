import JSBI from "jsbi";
import { ethers } from "ethers";

// Constants
const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));

/**
 * Encode price (token1/token0) as sqrtPriceX96
 * @param price Price in token1 per token0 (e.g., USDT per ETH)
 */
function encodeSqrtPriceX96(price: number): JSBI {
  // Calculate square root using JSBI to handle large numbers
  // First, scale up the price to maintain precision
  const scale = 1e18;
  const scaledPrice = Math.floor(price * scale);
  
  // Calculate square root of the scaled price
  const sqrtScaledPrice = Math.floor(Math.sqrt(scaledPrice) * scale);
  
  // Multiply by 2^96 and divide by scale to get the final result
  const twoPow96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96));
  const result = JSBI.divide(
    JSBI.multiply(JSBI.BigInt(sqrtScaledPrice.toString()), twoPow96),
    JSBI.BigInt(scale.toString())
  );
  
  return result;
}

/**
 * Compute liquidity for given amount of token0 (ETH)
 */
function getLiquidityForAmount0(
  sqrtPriceAX96: JSBI,
  sqrtPriceBX96: JSBI,
  amount0: JSBI
): JSBI {
  if (JSBI.greaterThan(sqrtPriceAX96, sqrtPriceBX96)) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }
  
  const intermediate = JSBI.multiply(sqrtPriceAX96, sqrtPriceBX96);
  const numerator = JSBI.multiply(amount0, intermediate);
  const denominator = JSBI.multiply(
    JSBI.subtract(sqrtPriceBX96, sqrtPriceAX96),
    Q96
  );
  
  return JSBI.divide(numerator, denominator);
}

/**
 * Compute amount of token1 (USDT) required for given liquidity
 */
function getAmount1ForLiquidity(
  sqrtPriceX96: JSBI,
  sqrtPriceAX96: JSBI,
  sqrtPriceBX96: JSBI,
  liquidity: JSBI
): JSBI {
  if (JSBI.greaterThan(sqrtPriceAX96, sqrtPriceBX96)) {
    [sqrtPriceAX96, sqrtPriceBX96] = [sqrtPriceBX96, sqrtPriceAX96];
  }

  if (JSBI.lessThan(sqrtPriceX96, sqrtPriceAX96)) {
    // Current price is below the range
    return JSBI.BigInt(0);
  } else if (JSBI.greaterThan(sqrtPriceX96, sqrtPriceBX96)) {
    // Current price is above the range - use the full range
    return JSBI.divide(
      JSBI.multiply(
        liquidity,
        JSBI.subtract(sqrtPriceBX96, sqrtPriceAX96)
      ),
      Q96
    );
  } else {
    // Current price is within the range
    return JSBI.divide(
      JSBI.multiply(
        liquidity,
        JSBI.subtract(sqrtPriceX96, sqrtPriceAX96)
      ),
      Q96
    );
  }
}

/**
 * Calculate required USDT for 1 ETH within specified price range
 * @param currentPrice Current price of ETH in USDT (e.g., 4470)
 * @param lowerPrice Lower bound of price range (e.g., 4096)
 * @param upperPrice Upper bound of price range (e.g., 4759)
 * @returns Object containing liquidity and required USDT amount
 */
export function getRequiredUSDT(
  currentPrice: number,
  lowerPrice: number,
  upperPrice: number
) {
  // Convert prices to sqrtPriceX96 format
  const sqrtPriceX96 = encodeSqrtPriceX96(currentPrice);
  const sqrtPriceAX96 = encodeSqrtPriceX96(lowerPrice);
  const sqrtPriceBX96 = encodeSqrtPriceX96(upperPrice);

  // 1 ETH in wei
  const oneETH = JSBI.BigInt(ethers.parseEther("1").toString());

  // Calculate liquidity based on 1 ETH
  const liquidity = getLiquidityForAmount0(
    sqrtPriceAX96,
    sqrtPriceBX96,
    oneETH
  );

  // Calculate required USDT amount
  const usdtAmount = getAmount1ForLiquidity(
    sqrtPriceX96,
    sqrtPriceAX96,
    sqrtPriceBX96,
    liquidity
  );

  // Convert from Q96 to human-readable format (6 decimals for USDT)
  const usdtFormatted = ethers.formatUnits(usdtAmount.toString(), 0);

  return {
    liquidity: liquidity.toString(),
    amountUSDT: usdtFormatted,
  };
}
