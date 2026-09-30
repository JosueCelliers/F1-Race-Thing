import { Redirect, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { TeamBadge } from '../art/Badges';
import { CarSide } from '../art/Car';
import { series as seriesDef } from '../content/series';
import { acceptOffer, retireCareer, stayOffer } from '../sim/career';
import type { WheelSlice } from '../sim/creation';
import { ageOf } from '../sim/drivers';
import { formatMoney, wildcardOffer } from '../sim/market';
import { mixSeed, Rng } from '../sim/rng';
import type { Offer, World } from '../sim/types';
import { useSession } from '../state/session';
import { useGame, useWorld } from '../state/store';
import { haptic } from '../ui/haptics';
import { Btn, Card, Header, Pill, Screen, SectionTitle, Stars, Txt } from '../ui/kit';
import { SpinWheel, type SpinRequest } from '../ui/SpinWheel';
import { C, R, S, withAlpha } from '../ui/theme';

function perfStars(world: World, teamId: string): number {
  const t = world.teams[teamId];
  const peers = Object.values(world.teams)
    .filter((x) => x.series === t.series)
    .sort((a, b) => b.perf - a.perf);
  const rank = peers.indexOf(t);
  return Math.max(1, 5 - Math.floor((rank / peers.length) * 5));
}

function OfferCard({ world, offer, onSign }: { world: World; offer: Offer; onSign: () => void }) {
  const team = world.teams[offer.team];
  const s = seriesDef(offer.series);
  const me = world.drivers[world.active!.driverId];
  const kindLabel = offer.kind === 'renewal' ? (offer.id === 'stay' ? 'Current contract' : 'Renewal') : offer.kind === 'paySeat' ? 'Pay seat' : offer.kind === 'wildcard' ? 'Wildcard' : 'Offer';
  const kindColor = offer.kind === 'renewal' ? C.green : offer.kind === 'paySeat' ? C.gold : offer.kind === 'wildcard' ? C.purple : C.blue;
  return (
    <Card style={{ padding: 0, borderColor: withAlpha(team.colors.primary, 0.6) }}>
      <View style={{ backgroundColor: withAlpha(team.colors.primary, 0.22), paddingTop: 10, alignItems: 'center' }}>
        <CarSide carClass={s.carClass} colors={team.colors} livery={team.livery} number={me.number} helmet={me.helmet} width={250} />
        <View style={{ position: 'absolute', left: 10, top: 10 }}>
          <Pill label={kindLabel} color={kindColor} />
        </View>
      </View>
      <View style={{ padding: S.lg, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TeamBadge colors={team.colors} short={team.short} size={36} />
          <View style={{ flex: 1 }}>
            <Txt v="h2" numberOfLines={1}>
              {team.name}
            </Txt>
            <Txt v="label" color={s.color}>
              {s.name}
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Stars value={perfStars(world, team.id)} size={13} />
            <Txt v="small" color={C.textMute}>
              car
            </Txt>
          </View>
        </View>
        <Txt v="small" color={C.textDim}>
          {offer.years} year{offer.years > 1 ? 's' : ''} · {offer.role === 'lead' ? 'Lead driver' : offer.role === 'second' ? 'Second driver' : 'Equal status'} ·{' '}
          {offer.salary >= 0 ? `$${formatMoney(offer.salary)}/yr` : `Bring $${formatMoney(-offer.salary)}`}
        </Txt>
        {offer.note ? (
          <Txt v="small" color={C.textMute}>
            {offer.note}
          </Txt>
        ) : null}
        <Btn label="Sign" icon="edit" small onPress={onSign} kind="team" color={team.colors.primary} />
      </View>
    </Card>
  );
}

export default function Offers() {
  const world = useWorld();
  const mutate = useGame((s) => s.mutate);
  const saveCareer = useGame((s) => s.saveCareer);
  const review = useSession((s) => s.review);
  const setReview = useSession((s) => s.setReview);
  const setJustRetired = useSession((s) => s.setJustRetired);
  const [hungerDone, setHungerDone] = useState(false);
  const [hungerReq, setHungerReq] = useState<SpinRequest | null>(null);
  const [fate, setFate] = useState<{ slices: WheelSlice[]; offers: (Offer | null)[] } | null>(null);
  const [fateReq, setFateReq] = useState<SpinRequest | null>(null);
  const [fateResult, setFateResult] = useState<Offer | null | undefined>(undefined);
  const [confirmRetire, setConfirmRetire] = useState(false);
  const a = world?.active;
  const offers = useMemo(() => {
    if (!world || !a) return [];
    const stay = stayOffer(world);
    return [...(stay ? [stay] : []), ...(a.offers ?? [])];
  }, [world, a, a?.offers]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!world || !a) return <Redirect href="/" />;
  if (a.phase !== 'offers') return <Redirect href="/career" />;
  const me = world.drivers[a.driverId];
  const hunger = review?.retireWheel;

  const sign = (o: Offer | null) => {
    haptic.success();
    mutate((w) => acceptOffer(w, o));
    setReview(null);
    router.replace('/career');
  };

  const retire = (reason: string) => {
    let rec;
    mutate((w) => {
      rec = retireCareer(w, reason);
    });
    if (rec) {
      saveCareer(rec);
      setJustRetired(rec);
      setReview(null);
      router.replace(`/archive/${(rec as { id: string }).id}?fresh=1`);
    }
  };

  const openFate = () => {
    const rng = new Rng(mixSeed(world.seed, 'fate', world.year, Date.now()));
    const wc = wildcardOffer(world, rng);
    const list: (Offer | null)[] = [...offers];
    if (wc && !offers.some((o) => o.team === wc.team)) list.push(wc);
    if (list.length < 2) list.push(null);
    const slices: WheelSlice[] = list.map((o, i) => ({
      id: `f${i}`,
      label: o ? world.teams[o.team].name : 'Sit out a year',
      weight: o?.kind === 'wildcard' ? 0.8 : 1,
      color: o ? world.teams[o.team].colors.primary : '#3A4560',
      value: i,
    }));
    setFate({ slices, offers: list });
    setFateResult(undefined);
    setTimeout(() => setFateReq({ id: Date.now(), target: rng.weightedIndex(slices.map((x) => x.weight)) }), 500);
  };

  // --------------------------------------------------------------- Hunger wheel
  if (hunger && !hungerDone) {
    const slices: WheelSlice[] = [
      { id: 'stay', label: 'One more year', weight: hunger.stay, color: '#24D17E', value: 0 },
      { id: 'retire', label: 'Hang up the helmet', weight: hunger.retire, color: '#FF3B5C', value: 1 },
    ];
    return (
      <Screen header={<Header title="One more year?" sub={`Age ${ageOf(me, world.year + 1)} next season`} back={false} />}>
        <Txt v="body" color={C.textDim} center style={{ marginTop: S.md }}>
          {hunger.forced ? 'Your body has made the decision for you.' : 'The hunger is fading. Let the wheel decide if you still have it.'}
        </Txt>
        <View style={{ alignItems: 'center', marginTop: S.lg }}>
          <SpinWheel
            slices={slices}
            size={300}
            request={hungerReq}
            hubLabel="FATE"
            onPressHub={() => {
              if (hungerReq) return;
              const rng = new Rng(mixSeed(world.seed, 'hunger', world.year));
              setHungerReq({ id: Date.now(), target: hunger.forced ? 1 : rng.weightedIndex(slices.map((x) => x.weight)) });
            }}
            onDone={(i) => {
              if (i === 1) setTimeout(() => retire(hunger.forced ? 'Forced to retire by age.' : 'The wheel said it was time.'), 900);
              else setTimeout(() => setHungerDone(true), 900);
            }}
          />
        </View>
        <Btn
          label="Spin"
          icon="refresh"
          style={{ marginTop: S.lg }}
          disabled={!!hungerReq}
          onPress={() => {
            const rng = new Rng(mixSeed(world.seed, 'hunger', world.year));
            setHungerReq({ id: Date.now(), target: hunger.forced ? 1 : rng.weightedIndex(slices.map((x) => x.weight)) });
          }}
        />
      </Screen>
    );
  }

  // --------------------------------------------------------------- Offers
  return (
    <Screen
      header={<Header title="Contract offers" sub={`${world.year + 1} season · ${offers.length} option${offers.length === 1 ? '' : 's'}`} back={false} />}
      footer={
        <View style={{ gap: S.sm }}>
          <Btn label="Spin the Wheel of Fate" icon="dice" kind="gold" onPress={openFate} sub="Let the wheel choose your future" />
        </View>
      }
    >
      {offers.length === 0 ? (
        <Card style={{ marginTop: S.md }} accent={C.red}>
          <Txt v="h1">The phone isn't ringing</Txt>
          <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
            No team wants you for {world.year + 1}. Sit out a year and hope, spin for a miracle, or call it a career.
          </Txt>
          <Btn label="Sit out a year" kind="secondary" small style={{ marginTop: S.md }} onPress={() => sign(null)} />
        </Card>
      ) : null}
      <View style={{ gap: S.md, marginTop: S.md }}>
        {offers.map((o, i) => (
          <Animated.View key={o.id} entering={FadeInDown.delay(i * 90)}>
            <OfferCard world={world} offer={o} onSign={() => sign(o)} />
          </Animated.View>
        ))}
      </View>
      <SectionTitle title="Or..." />
      <Btn label="Retire from racing" icon="flag" kind="ghost" onPress={() => setConfirmRetire(true)} />

      <Modal visible={confirmRetire} transparent animationType="fade" onRequestClose={() => setConfirmRetire(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,4,10,0.85)', justifyContent: 'center', padding: S.lg }}>
          <Card>
            <Txt v="h1">Retire now?</Txt>
            <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
              Your career will be sealed in the Archive and the world moves on.
            </Txt>
            <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.lg }}>
              <Btn label="Not yet" kind="ghost" small style={{ flex: 1 }} onPress={() => setConfirmRetire(false)} />
              <Btn label="Retire" kind="danger" small style={{ flex: 1 }} onPress={() => retire('Walked away on their own terms.')} />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={!!fate} transparent animationType="fade" onRequestClose={() => setFate(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(2,4,10,0.9)', justifyContent: 'center', alignItems: 'center', padding: S.lg }}>
          <Txt v="title" center>
            Wheel of Fate
          </Txt>
          <Txt v="small" color={C.textDim} center style={{ marginBottom: S.lg }}>
            Wherever it lands, you sign.
          </Txt>
          {fate ? (
            <SpinWheel
              slices={fate.slices}
              size={320}
              request={fateReq}
              hubLabel="FATE"
              onDone={(i) => {
                setFateResult(fate.offers[i]);
                haptic.success();
              }}
            />
          ) : null}
          {fateResult !== undefined && fate ? (
            <Animated.View entering={ZoomIn.springify().damping(14)} style={{ marginTop: S.lg, alignSelf: 'stretch', gap: S.sm }}>
              <Card style={{ alignItems: 'center', borderRadius: R.lg }}>
                <Txt v="label" color={C.gold}>
                  Fate has spoken
                </Txt>
                <Txt v="h1" center style={{ marginTop: 4 }}>
                  {fateResult ? `${world.teams[fateResult.team].name}` : 'A year on the sidelines'}
                </Txt>
                {fateResult ? (
                  <Txt v="small" color={C.textDim}>
                    {seriesDef(fateResult.series).name}
                  </Txt>
                ) : null}
              </Card>
              <Btn label="Sign it" icon="check" kind="gold" onPress={() => sign(fateResult)} />
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}
