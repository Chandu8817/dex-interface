export function encodeSqrtRatioX96(amount1: bigint, amount0: bigint): bigint {
  if (amount0 === 0n) throw new Error('amount0 cannot be 0');

  // shift 192 bits instead of multiply 2**192
  const numerator = amount1 << 192n;
  const ratio = numerator / amount0;
  return bigintSqrt(ratio);
}

// bigint sqrt helper
export function bigintSqrt(value: bigint): bigint {
  if (value < 0n) throw new Error('square root of negative numbers is not supported');
  if (value < 2n) return value;
  let x0 = value / 2n;
  let x1 = (x0 + value / x0) / 2n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) / 2n;
  }
  return x0;
}


const Q96 = 2n ** 96n;

// Convert tick to sqrtPriceX96
export function tickToSqrtPriceX96(tick: number): bigint {
  return BigInt(Math.floor(Math.pow(1.0001, tick / 2) * Number(Q96)));
}

// Calculate amount0
export function getAmount0(liquidity: bigint, sqrtPriceCurrent: bigint, sqrtPriceUpper: bigint): bigint {
  return (liquidity * (sqrtPriceUpper - sqrtPriceCurrent) * Q96) / (sqrtPriceUpper * sqrtPriceCurrent);
}

// Calculate amount1
export function getAmount1(liquidity: bigint, sqrtPriceCurrent: bigint, sqrtPriceLower: bigint): bigint {
  return (liquidity * (sqrtPriceCurrent - sqrtPriceLower)) / Q96;
}
