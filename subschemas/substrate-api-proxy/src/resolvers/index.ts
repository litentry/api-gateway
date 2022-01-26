import { Resolvers } from '../generated/resolvers-types';
import { Context } from '../types';
import { Query } from './Query';

export const resolvers: Resolvers<Context> = {
  Query,
  CouncilMember: {
    account: Query.account,
  },
  CouncilCandidate: {
    account: Query.account,
  },
  Proposer: {
    account: Query.account,
  },
  Registrar: {
    account: Query.account,
  },
};
