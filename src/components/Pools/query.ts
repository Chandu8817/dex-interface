import { gql } from '@apollo/client';

export const POOLS_QUERY = gql`
  query Pools(
    $first: Int!
    $skip: Int!
    $orderBy: Pool_orderBy
    $orderDirection: OrderDirection
    $where: Pool_filter
  ) {
    pools(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      feeTier
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
      liquidity
      totalValueLockedUSD
      volumeUSD
      txCount
    }
  }
`;
