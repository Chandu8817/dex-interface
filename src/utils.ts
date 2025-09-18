export function encodeSqrtRatioX96(amount1: bigint, amount0: bigint): bigint {
    if (amount0 === 0n) throw new Error("amount0 cannot be 0");
  
    // shift 192 bits instead of multiply 2**192
    const numerator = amount1 << 192n;
    const ratio = numerator / amount0;
    return bigintSqrt(ratio);
  }
  
  // bigint sqrt helper
  export function bigintSqrt(value: bigint): bigint {
    if (value < 0n) throw new Error("square root of negative numbers is not supported");
    if (value < 2n) return value;
    let x0 = value / 2n;
    let x1 = (x0 + value / x0) / 2n;
    while (x1 < x0) {
      x0 = x1;
      x1 = (x0 + value / x0) / 2n;
    }
    return x0;
  }
  