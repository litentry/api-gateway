import type { ApiPromise } from '@polkadot/api';

/** @public */
export interface Resolvers {
  [pallet: string]: {
    [event: string]: (
      api: ApiPromise,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: any
    ) => Promise<void>;
  };
}
