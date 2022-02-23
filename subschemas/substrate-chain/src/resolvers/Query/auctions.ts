import {ApiPromise} from '@polkadot/api';
import {createWsEndpoints} from '@polkadot/apps-config/endpoints';
import type {LinkOption} from '@polkadot/apps-config/endpoints/types';
import type {ITuple, Codec} from '@polkadot/types/types';
import type {u32, u128, Option, StorageKey} from '@polkadot/types';
import type {AuctionIndex, BlockNumber, LeasePeriodOf, WinningData} from '@polkadot/types/interfaces';
import {BN, BN_ONE, BN_ZERO, formatNumber} from '@polkadot/util';
import type {Context} from '../../types';
import type {AuctionsSummary, Auction} from '../../generated/resolvers-types';
import {extractWinningData, Winning} from '../../utils/winners';
import {formatBalance, getBlockTime} from '../../services/substrateChainService';

export async function auctionsSummary(
  _: Record<string, string>,
  __: Record<string, string>,
  {api}: Context,
): Promise<AuctionsSummary> {
  const [numAuctions, optInfo, leasePeriodsPerSlot, endingPeriod, winners, totalIssuance, bestNumber, genesisHash] =
    await Promise.all([
      api.query.auctions?.auctionCounter?.<AuctionIndex>(),
      api.query.auctions?.auctionInfo?.<Option<ITuple<[LeasePeriodOf, BlockNumber]>>>(),
      api.consts.auctions?.leasePeriodsPerSlot,
      api.consts.auctions?.endingPeriod as BlockNumber | undefined,
      api.query.auctions?.winning?.entries() as Promise<[StorageKey<[BlockNumber]>, Option<WinningData>][]>,
      api.query.balances.totalIssuance(),
      api.derive.chain.bestNumber(),
      api.genesisHash.toHex(),
    ]);
  const [leasePeriod, endBlock] = optInfo?.unwrapOr([null, null]) ?? [null, null];
  const winningData = extractWinningData({endBlock, leasePeriod, numAuctions, leasePeriodsPerSlot}, winners);
  const startingEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);
  const endpoints = startingEndpoints.filter(({genesisHashRelay}) => genesisHash === genesisHashRelay);

  return {
    auctionsInfo: {
      numAuctions: formatNumber(numAuctions) ?? 0,
      active: Boolean(leasePeriod),
    },
    latestAuction: getLatestAuction(
      api,
      leasePeriod,
      leasePeriodsPerSlot,
      winningData,
      totalIssuance,
      bestNumber,
      endBlock,
      endingPeriod,
      endpoints,
    ),
  };
}

const getLatestAuction = (
  api: ApiPromise,
  leasePeriod: LeasePeriodOf | null,
  leasePeriodsPerSlot: Codec,
  winningData: Winning[],
  totalIssuance: u128,
  bestNumber: BlockNumber,
  endBlock: BlockNumber | null,
  endingPeriod: BlockNumber | undefined,
  endpoints: LinkOption[],
): Auction => {
  const lastWinners = winningData && winningData[0];
  const raised = lastWinners?.total ?? BN_ZERO;
  const total = totalIssuance ?? BN_ZERO;
  const raisedPercent = total.isZero() ? 0 : raised.muln(10000).div(total).toNumber() / 100;
  const [endingIn, currentPosition] = getEndingPeriodValues(bestNumber, endBlock, endingPeriod);
  const remainingPercent = endingIn.isZero() ? 0 : currentPosition.muln(10000).div(endingIn).toNumber() / 100;

  return {
    leasePeriod: {
      first: formatNumber(leasePeriod),
      last: formatNumber(leasePeriod?.add((leasePeriodsPerSlot as u32) ?? BN_ONE).isub(BN_ONE)),
    },
    endingPeriod: {
      endingIn: getBlockTime(api, endingIn).timeStringParts,
      remaining: getBlockTime(api, endingIn.sub(currentPosition)).timeStringParts,
      remainingPercent,
    },
    raised: formatBalance(api, raised),
    raisedPercent,
    winningBid: {
      blockNumber: lastWinners?.blockNumber.toString(),
      projectId: lastWinners?.winners[0].paraId.toString(),
      projectName:
        endpoints?.find((e) => e.paraId === lastWinners?.winners[0]?.paraId.toNumber())?.text?.toString() || '',
      amount: String(formatBalance(api, lastWinners?.total)),
    },
  };
};

const getEndingPeriodValues = (bestNumber: BlockNumber, endBlock: any, endingPeriod: any): [BN, BN] => {
  if (endBlock && bestNumber) {
    if (bestNumber.lt(endBlock)) {
      return [endBlock, bestNumber];
    } else if (endingPeriod) {
      return [endingPeriod, bestNumber.sub(endBlock)];
    }
  }
  return [BN_ZERO, BN_ZERO];
};
