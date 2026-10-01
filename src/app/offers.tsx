import { Redirect, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { TeamBadge } from '../art/Badges';
import { CarSide } from '../art/Car';
import { series as seriesDef } from '../content/series';
import { acceptOffer, isFarewell, retireCareer, stayOffer } from '../sim/career';
import type { WheelSlice } from '../sim/creation';
import { ageOf } from '../sim/drivers';
import { formatMoney, wildcardOffer } from '../sim/market';
import { mixSeed, Rng } from '../sim/rng';
import type { Offer, World } from '../sim/types';
import { useSession } from '../state/session';
import { useGame, useWorld } from '../state/store';
import { haptic } from '../ui/haptics';
import { Btn, Header, ModalScrim, Screen, SectionTitle, SheetModal, Txt } from '../ui/kit';
import { useScreen } from '../ui/screen';
import { SpinWheel, type SpinRequest } from '../ui/SpinWheel';
import { C, F, R, S, withAlpha } from '../ui/theme';

function perfStars(world: World, teamId: string): number {
  const t = world.teams[teamId];
  const peers = Object.values(world.teams)
    .filter((x) => x.series === t.series)
    .sort((a, b) => b.perf - a.perf);
  const rank = peers.indexOf(t);
  return Math.max(1, 5 - Math.floor((rank / peers.length) * 5));
}

function CarRating({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((k) => (
        <View key={k} style={{ width: 9, height: 12, backgroundColor: k <= value ? (value >= 5 ? C.gold : value >= 4 ? C.cyan : C.text) : C.surface3, transform: [{ skewX: '-14deg' }] }} />
      ))}
    </View>
  );
}

function OfferCard({ world, offer, onSign }: { world: World; offer: Offer; onSign: () => void }) {
  const team = world.teams[offer.team];
  const s = seriesDef(offer.series);
  const me = world.drivers[world.active!.driverId];
  const kindLabel = offer.kind === 'renewal' ? (offer.id === 'stay' ? 'Current contract' : 'Renewal') : offer.kind === 'paySeat' ? 'Pay seat' : offer.kind === 'wildcard' ? 'Wildcard' : 'Offer';
  const kindColor = offer.kind === 'renewal' ? C.green : offer.kind === 'paySeat' ? C.gold : offer.kind === 'wildcard' ? C.purple : C.cyan;
  const stars = perfStars(world, team.id);
  return (
    <View style={[panel, { borderColor: withAlpha(team.colors.primary, 0.5) }]}>
      <View style={{ height: 112, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6, overflow: 'hidden' }}>
        <LinearGradient colors={[withAlpha(team.colors.primary, 0.42), withAlpha(team.colors.primary, 0.06)]} style={StyleSheet.absoluteFill} />
        <CarSide carClass={s.carClass} colors={team.colors} livery={team.livery} number={me.number} helmet={me.helmet} width={250} />
        <View
          style={{
            position: 'absolute',
            left: 10,
            top: 10,
            height: 24,
            justifyContent: 'center',
            paddingHorizontal: 8,
            backgroundColor: kindColor,
            transform: [{ skewX: '-11deg' }],
            borderRadius: R.xs,
          }}
        >
          <Txt v="micro" color="#07090E" style={{ transform: [{ skewX: '11deg' }] }}>
            {kindLabel}
          </Txt>
        </View>
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TeamBadge colors={team.colors} short={team.short} size={38} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: F.title, fontSize: 20, lineHeight: 23, color: C.text, textTransform: 'uppercase' }} numberOfLines={1}>
              {team.name}
            </Text>
            <Txt v="micro" color={C.textDim}>
              {s.name}
            </Txt>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <CarRating value={stars} />
            <Txt v="micro" color={C.textMute}>
              Car
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: C.line, borderRadius: R.xs }}>
          {[
            ['Years', `${offer.years}`],
            ['Role', offer.role === 'lead' ? 'Lead' : offer.role === 'second' ? 'Second' : 'Equal'],
            [offer.salary >= 0 ? 'Salary / yr' : 'You bring', `$${formatMoney(Math.abs(offer.salary))}`],
          ].map(([l, v], i) => (
            <View key={l} style={[{ flex: 1, paddingHorizontal: 10, paddingVertical: 7 }, i > 0 && { borderLeftWidth: 1, borderColor: C.line }]}>
              <Txt v="micro" color={C.textMute}>
                {l}
              </Txt>
              <Text style={{ fontFamily: F.title, fontSize: 18, color: l === 'You bring' ? C.amber : C.text }}>{v}</Text>
            </View>
          ))}
        </View>
        {offer.note ? (
          <Txt v="small" color={C.textDim} style={{ fontSize: 13 }}>
            {offer.note}
          </Txt>
        ) : null}
        <Btn label="Sign" icon="edit" onPress={onSign} kind="team" color={team.colors.primary} />
      </View>
    </View>
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
  const { width } = useScreen();
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
  if (hunger && !hungerDone && !isFarewell(world)) {
    const slices: WheelSlice[] = [
      { id: 'stay', label: 'One more year', weight: hunger.stay, color: C.green, value: 0 },
      { id: 'retire', label: 'Hang up the helmet', weight: hunger.retire, color: C.red, value: 1 },
    ];
    const spinHunger = () => {
      if (hungerReq) return;
      const rng = new Rng(mixSeed(world.seed, 'hunger', world.year));
      setHungerReq({ id: Date.now(), target: hunger.forced ? 1 : rng.weightedIndex(slices.map((x) => x.weight)) });
    };
    return (
      <Screen
        scroll={false}
        header={<Header kicker={`Age ${ageOf(me, world.year + 1)} next season`} title="One more year?" back={false} />}
        footer={<Btn label="Spin" icon="refresh" disabled={!!hungerReq} onPress={spinHunger} />}
      >
        <Txt v="body" color={C.text} center style={{ marginTop: S.sm }}>
          {hunger.forced ? 'Your body has made the decision for you.' : 'The hunger is fading. Let the wheel decide if you still have it.'}
        </Txt>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <SpinWheel
            slices={slices}
            size={Math.min(width - 32, 360)}
            request={hungerReq}
            hubLabel="FATE"
            onPressHub={spinHunger}
            onDone={(i) => {
              if (i === 1) setTimeout(() => retire(hunger.forced ? 'Forced to retire by age.' : 'The wheel said it was time.'), 900);
              else setTimeout(() => setHungerDone(true), 900);
            }}
          />
        </View>
      </Screen>
    );
  }

  // --------------------------------------------------------------- Offers
  return (
    <Screen
      header={<Header kicker={`${world.year + 1} season · ${offers.length} option${offers.length === 1 ? '' : 's'}`} title="Contract offers" back={false} />}
      footer={
        <View style={{ gap: S.sm }}>
          <Btn label="Spin the Wheel of Fate" icon="dice" kind="gold" onPress={openFate} sub="Let the wheel choose your future" />
        </View>
      }
    >
      {isFarewell(world) ? (
        <View style={[panel, notice, { borderColor: withAlpha(C.gold, 0.45), marginTop: S.sm }]}>
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.gold }} />
          <Txt v="micro" color={C.gold}>
            Farewell season complete
          </Txt>
          <Text style={heading}>Time to hang up the helmet?</Text>
          <Txt v="body" color={C.textDim}>
            You promised {world.year} would be your last year. The paddock has its farewells ready, but these teams still want you.
          </Txt>
          <Btn label="Retire" icon="flag" kind="gold" small style={{ marginTop: S.sm }} onPress={() => retire('Retired after a farewell season.')} />
        </View>
      ) : null}
      {offers.length === 0 ? (
        <View style={[panel, notice, { borderColor: withAlpha(C.red, 0.45), marginTop: S.sm }]}>
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: C.red }} />
          <Txt v="micro" color={C.red}>
            No offers
          </Txt>
          <Text style={heading}>The phone isn’t ringing</Text>
          <Txt v="body" color={C.textDim}>
            No team wants you for {world.year + 1}. Sit out a year and hope, spin for a miracle, or call it a career.
          </Txt>
          <Btn label="Sit out a year" kind="secondary" small style={{ marginTop: S.sm }} onPress={() => sign(null)} />
        </View>
      ) : null}
      <View style={{ gap: S.md, marginTop: S.md }}>
        {offers.map((o, i) => (
          <Animated.View key={o.id} entering={FadeInDown.delay(i * 90)}>
            <OfferCard world={world} offer={o} onSign={() => sign(o)} />
          </Animated.View>
        ))}
      </View>
      <SectionTitle title="Or" style={{ marginBottom: S.sm }} />
      <Btn label="Retire from racing" icon="flag" kind="ghost" onPress={() => setConfirmRetire(true)} />

      <SheetModal visible={confirmRetire} onClose={() => setConfirmRetire(false)} accent={C.redDeep}>
        <Txt v="h1">Retire now?</Txt>
        <Txt v="body" color={C.textDim} style={{ marginTop: 6 }}>
          Your career will be sealed in the Archive and the world moves on.
        </Txt>
        <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.lg }}>
          <Btn label="Not yet" kind="ghost" small style={{ flex: 1 }} onPress={() => setConfirmRetire(false)} />
          <Btn label="Retire" kind="danger" small style={{ flex: 1 }} onPress={() => retire('Walked away on their own terms.')} />
        </View>
      </SheetModal>

      <Modal visible={!!fate} transparent animationType="fade" onRequestClose={() => setFate(null)}>
        <ModalScrim bg="rgba(3,4,8,0.94)" center>
          <Txt v="micro" color={C.gold}>
            Wherever it lands, you sign
          </Txt>
          <Text style={[heading, { fontSize: 34, lineHeight: 38, marginBottom: S.lg }]}>Wheel of Fate</Text>
          {fate ? (
            <SpinWheel
              slices={fate.slices}
              size={Math.min(width - 40, 340)}
              request={fateReq}
              hubLabel="FATE"
              onDone={(i) => {
                setFateResult(fate.offers[i]);
                haptic.success();
              }}
            />
          ) : null}
          {fateResult !== undefined && fate ? (
            <Animated.View entering={ZoomIn.duration(260)} style={{ marginTop: S.lg, alignSelf: 'stretch', gap: S.sm }}>
              <View style={[panel, { alignItems: 'center', padding: 14, borderColor: withAlpha(C.gold, 0.45) }]}>
                <Txt v="micro" color={C.gold}>
                  Fate has spoken
                </Txt>
                <Text style={[heading, { textAlign: 'center' }]}>{fateResult ? `${world.teams[fateResult.team].name}` : 'A year on the sidelines'}</Text>
                {fateResult ? (
                  <Txt v="small" color={C.textDim}>
                    {seriesDef(fateResult.series).name}
                  </Txt>
                ) : null}
              </View>
              <Btn label="Sign it" icon="check" kind="gold" onPress={() => sign(fateResult)} />
            </Animated.View>
          ) : null}
        </ModalScrim>
      </Modal>
    </Screen>
  );
}

const st = StyleSheet.create({
  panel: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: R.sm, overflow: 'hidden' },
  notice: { paddingLeft: 15, paddingRight: 12, paddingVertical: 12, gap: 4 },
  heading: { fontFamily: F.title, fontSize: 22, lineHeight: 25, color: C.text, textTransform: 'uppercase' },
});
const panel = st.panel;
const notice = st.notice;
const heading = st.heading;
