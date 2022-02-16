export default /* GraphQL */ `
  type BalanceData {
    free: Float!
    reserved: Float!
    miscFrozen: Float!
    feeFrozen: Float!
  }
  type Balance {
    nonce: Int!
    consumers: Int!
    providers: Int!
    sufficients: Int!
    data: BalanceData!
  }
  type Query {
    balance(address: String!, blockNumber: Int): Balance!
  }
`;