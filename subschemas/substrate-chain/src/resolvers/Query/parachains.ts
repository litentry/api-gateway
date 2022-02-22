import type {ParaId, ParaLifecycle, CandidatePendingAvailability} from '@polkadot/types/interfaces';
import {createWsEndpoints} from '@polkadot/apps-config/endpoints';
import type {LinkOption} from '@polkadot/apps-config/endpoints/types';
import type {Context} from '../../types';
import type {AccountInfo, Parachain, ParachainsInfo} from '../../generated/resolvers-types';
import {
  ValidatorsInfo,
  getParachainValidators,
  LastEvents,
  getLastEvents,
  getLeasePeriod,
  getUpcomingParaIds,
  getBlocks,
  getLeasePeriodString,
  getNonVoters,
  getValidatorInfo,
} from '../../services/parachainsService';
import {bnToBn, bnToHex} from '@polkadot/util';
import type {Option} from '@polkadot/types';

export async function parachainsInfo(
  _: Record<string, never>,
  __: Record<string, never>,
  {api}: Context,
): Promise<ParachainsInfo> {
  const [parachainIds, proposals, upcomingParaIds, leasePeriod] = await Promise.all([
    api.query.paras?.parachains?.<ParaId[]>(),
    api.query.proposeParachain?.proposals?.entries(),
    getUpcomingParaIds(api),
    getLeasePeriod(api),
  ]);

  return {
    parachainsCount: parachainIds?.length ?? 0,
    parathreadsCount: upcomingParaIds.length,
    proposalsCount: proposals?.length ?? 0,
    leasePeriod,
  };
}

export async function parachains(
  _: Record<string, never>,
  __: Record<string, never>,
  {api}: Context,
): Promise<Promise<Parachain>[]> {
  const [parachainIds, genesisHash, lastEvents, validators] = await Promise.all([
    api.query.paras?.parachains?.<ParaId[]>(),
    api.genesisHash.toHex(),
    getLastEvents(api),
    getParachainValidators(api),
  ]);

  const startingEndpoints = createWsEndpoints((key: string, value: string | undefined) => value || key);
  const endpoints = startingEndpoints.filter(({genesisHashRelay}) => genesisHash === genesisHashRelay);

  const parachains = parachainIds
    .map((paraId) => {
      const parachain = endpoints.find((e) => e.paraId === paraId.toNumber());

      if (!parachain) {
        return undefined;
      }

      return parachain;
    })
    .filter((elem) => elem !== undefined) as LinkOption[];

  return parachains.map((p) => extractParachainData(api, p, lastEvents, validators));
}

export function parachain(_: Record<string, never>, params: {id: string}, {api}: Context) {
  throw new Error('Not implemented yet');
}

const extractParachainData = async (
  api: Context['api'],
  parachain: LinkOption,
  lastEvents: LastEvents,
  validators: ValidatorsInfo,
): Promise<Parachain> => {
  const id = parachain.paraId!;

  const [leases, leasePeriod, optLifecycle, optPending] = await Promise.all([
    api.query.slots?.leases?.(id) as any,
    getLeasePeriod(api),
    api.query.paras?.paraLifecycles?.<Option<ParaLifecycle>>(id),
    (api.query.parasInclusion || api.query.paraInclusion || api.query.inclusion)?.pendingAvailability?.<
      Option<CandidatePendingAvailability>
    >(id),
  ]);

  const filteredLeases = leases
    .map((opt: {isSome: any}, index: any) => (opt.isSome ? index : -1))
    .filter((period: number) => period !== -1);
  const period =
    leasePeriod?.currentLease && leases && getLeasePeriodString(bnToBn(leasePeriod.currentLease), filteredLeases);
  const validatorInfo = getValidatorInfo(id.toString(), validators);

  return {
    id: id.toString(),
    name: parachain.text?.toString() ?? `#${id.toString()}`,
    lease: {
      period: period,
      blockTime: bnToHex(getBlocks(api, filteredLeases, leasePeriod)),
    },
    lifecycle: optLifecycle?.unwrap().toString() ?? '',
    lastIncludedBlock: lastEvents.lastIncluded[id]?.blockNumber?.toString() ?? '',
    lastBackedBlock: lastEvents.lastBacked[id]?.blockNumber?.toString() ?? '',
    homepage: parachain.homepage ?? undefined,
    validators: {
      groupIndex: validatorInfo?.groupIndex?.toString(),
      validators: validatorInfo?.validators?.map((e) => {
        return e.toString();
      }),
    },
    nonVoters: getNonVoters(validators.validators, optPending?.unwrapOr(undefined)).map((e) => {
      return e.toString();
    }),
  };
};
