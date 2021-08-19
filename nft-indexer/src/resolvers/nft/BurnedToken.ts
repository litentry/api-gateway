import type { ApiPromise } from '@polkadot/api';
import { saveEvent } from '../../repositories/events';

export default async function handler(
  api: ApiPromise,
  // https://litentry.github.io/litentry-pallets/pallet_nft/pallet/enum.Event.html#variant.BurnedToken
  [owner, class_id, token_id]: [string, number, number]
): Promise<void> {
  await saveEvent({
    name: 'BurnedToken',
    data: [owner, class_id, token_id],
  });
}
