// Ce qui entoure chaque écran, comme dans l'Atlas : barre du haut (logo + HLuX, projet, fil des
// six étapes) et barre d'aides (Écouter · Plus simple · Langue).

import { Link, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { I18nManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {say, useAids, useFamily, useLive, useRegister, useWords } from '../core/useAids';
import { PersonMenu } from './PersonMenu';
import { Picto } from './Picto';
import { useThreadCards } from '../core/useThread';
import { useMe, useProject } from '../core/useProject';
import { SvgXml } from 'react-native-svg';

import { useLayout } from '../design/layout';
import { LOGO_XML } from '../design/logo';
import { C, F, S } from '../design/theme';
import type { WordKey } from '../i18n/words';

const PP: [WordKey, string][] = [
  ['cards', '/mon-projet/cartes'], ['feeling', '/mon-projet/ressenti'], ['wishes', '/mon-projet/envies'],
  ['priorities', '/mon-projet/priorites'], ['views', '/mon-projet/regards'], ['path', '/mon-projet/chemin'],
];
const PE: [WordKey, string][] = [
  ['subjects', '/notre-projet/sujets'], ['finding', '/notre-projet/constat'], ['course', '/notre-projet/cap'],
  ['choice', '/notre-projet/choix'], ['actions', '/notre-projet/actions'], ['follow', '/notre-projet/suivi'],
];

/** Le logo, puis HLuX aux couleurs exactes du logo, sans fond ni contour. */
export function Wordmark({ size = 15 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size / 3 }} accessibilityLabel="HLuX">
      <SvgXml xml={LOGO_XML} width={size * 1.9} height={size * 1.9} />
      <Text style={{ fontFamily: F.wordmark, fontSize: size, letterSpacing: 0.8 }}>
        <Text style={{ color: C.logo.first }}>HL</Text>
        <Text style={{ color: C.logo.second }}>u</Text>
        <Text style={{ color: C.logo.third }}>X</Text>
      </Text>
    </View>
  );
}

export function Screen({ side, title, question, children }: { side: 'pp' | 'pe'; title: WordKey; question: string; children: ReactNode }) {
  const w = useWords();
  const path = usePathname();
  const steps = side === 'pp' ? PP : PE;
  const reg = useRegister();
  // Le sas de 07 est un écran de la personne : il suit sa langue, comme 01-06.
  const facing = side === 'pp' || path === '/notre-projet/sujets';
  const rtl = facing && reg === 'ar';
  const body = useFamily();
  const bold = useFamily(true);
  const { phone } = useLayout();
  const live = useLive();
  const me = useMe();
  const thread = useThreadCards();
  return (
    <View style={[st.page, { direction: rtl ? 'rtl' : 'ltr' }]} {...(rtl ? ({ lang: 'ar' } as object) : {})}>
      <View style={st.top}>
        {me.id ? <View style={st.home}><Wordmark /></View> : <Link href="/" accessibilityLabel={reg === 'ar' && facing ? 'الصفحة الرئيسية' : 'Accueil'} style={st.home}><Wordmark /></Link>}
        <Text style={st.proj}>{w(side === 'pp' ? 'myProject' : 'ourProject')}</Text>
        <ThreadPill />
        <PersonMenu />
        {/* Sur un téléphone, le fil des six étapes défile à l'horizontale plutôt que de se tasser. */}
        <ScrollView horizontal={phone} showsHorizontalScrollIndicator={false} contentContainerStyle={phone ? st.stepperPhone : st.stepper} style={phone ? st.stepScroll : st.stepWide}>
          {steps.map(([k, href]) => {
            const on = path === href;
            // Le fil : chaque étape traversée par une Carte choisie porte sa petite image (l'Atlas les allume).
            const lit = me.id ? thread.filter((c) => c.passed.includes(href)) : [];
            return (
              <Link key={href} href={href as never} accessibilityState={{ selected: on }} accessibilityHint={lit.length ? `Passées par ici : ${lit.map((c) => c.title).join(', ')}` : undefined} style={[st.step, lit.length > 0 && st.stepLit, on && { backgroundColor: side === 'pp' ? C.pp.value : C.pe.value }]}>
                <View style={st.stepRow}>
                  {lit.slice(-3).map((c) => (c.picto ? <Picto key={c.id} name={c.picto} size={16} label={false} /> : <Text key={c.id} style={st.stepTxt}>●</Text>))}
                  <Text style={[st.stepTxt, { fontFamily: bold }, on && { color: C.ink }]} numberOfLines={1}>{w(k)}</Text>
                </View>
              </Link>
            );
          })}
        </ScrollView>
      </View>
      <View style={st.head}>
        <Text style={st.title}>{w(title)}</Text>
        <Text style={[st.question, { fontFamily: body }]} onPress={() => say(question)}>{question}</Text>
        {live.text && live.path === path ? (
          <Text style={[st.live, { fontFamily: bold }]} accessibilityLiveRegion="polite">{live.text}</Text>
        ) : null}
      </View>
      <View style={st.body}>{children}</View>
      <AidsBar side={side} facing={facing} />
    </View>
  );
}

/** Le fil, dans le bandeau : les images des Cartes choisies (les trois dernières, puis « +n »). */
function ThreadPill() {
  const cards = useThreadCards();
  const me = useMe();
  const path = usePathname();
  if (!me.id || !cards.length) return null;
  const shown = cards.slice(-3);
  const here = cards.some((c) => c.passed.includes(path));
  return (
    <View style={[st.pill, here && st.pillHere]} accessibilityLabel={`Le fil : ${cards.map((c) => c.title).join(', ')}`}>
      {shown.map((c) => (c.picto ? <Picto key={c.id} name={c.picto} size={22} label={false} /> : <Text key={c.id}>🃏</Text>))}
      <Text style={st.pillTxt} numberOfLines={1}>{cards.length === 1 ? cards[0].title : `${cards.length} Cartes`}</Text>
    </View>
  );
}

export function AidsBar({ side, facing = side === 'pp' }: { side: 'pp' | 'pe'; facing?: boolean }) {
  const w = useWords();
  const bold = useFamily(true);
  const { listen, simple, lang, toggle, switchLang } = useAids();
  const me = useMe();
  const pro = useProject((s) => s.pro);
  const place = useProject((s) => s.setup?.name ?? '');
  const personal = useProject((s) => s.setup?.kind === 'personal');
  return (
    <View style={st.aids}>
      <Aid on={listen} label={w('listen')} font={bold} onPress={() => toggle('listen')} />
      <Aid on={simple} label={w('simpler')} font={bold} onPress={() => toggle('simple')} />
      {facing && <Aid on={lang === 'ar'} label={w('language')} font={bold} onPress={() => { switchLang(); I18nManager.allowRTL(true); }} />}
      <Text style={st.who}>{side === 'pp' ? (pro && !personal ? `${me.name} · ${w('withPro')} ${pro}` : me.name) : place}</Text>
    </View>
  );
}

function Aid({ on, label, onPress, font }: { on: boolean; label: string; onPress: () => void; font: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} style={[st.aid, on && st.aidOn]}>
      <Text style={[st.aidTxt, { fontFamily: font }, on && { color: C.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: S.gap, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.line, zIndex: 20 },
  other: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: S.radiusPill, borderWidth: 2, backgroundColor: C.surface },
  otherTxt: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  home: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, minHeight: S.touch, justifyContent: 'center' },
  proj: { fontFamily: F.bold, color: C.ink, fontSize: 15 },
  stepper: { flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' },
  step: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: S.radiusPill, backgroundColor: C.surface2, minHeight: S.touch, justifyContent: 'center' },
  stepScroll: { flexBasis: '100%' },
  stepperPhone: { flexDirection: 'row', gap: 4 },
  stepWide: { flexGrow: 1 },
  stepTxt: { fontFamily: F.bold, fontSize: 13, color: C.muted },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepLit: { borderWidth: 2, borderColor: C.pp.value },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 260, minHeight: S.touch, paddingHorizontal: 10, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line },
  pillHere: { borderStyle: 'solid', borderColor: C.pp.value },
  pillTxt: { fontFamily: F.bold, fontSize: 14, color: C.ink, flexShrink: 1 },
  head: { paddingHorizontal: 24, paddingTop: 16, gap: 4 },
  title: { fontFamily: F.display, fontSize: S.title, color: C.ink },
  live: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: S.radiusPill, backgroundColor: C.violetSoft, color: C.ink, fontSize: 15 },
  question: { fontFamily: F.body, fontSize: S.body, color: C.text },
  body: { flex: 1, padding: 24 },
  aids: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 12, backgroundColor: C.surface, borderTopWidth: 1, borderColor: C.line },
  aid: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  aidOn: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  aidTxt: { fontFamily: F.bold, color: C.ink, fontSize: 15 },
  who: { marginStart: 'auto', fontFamily: F.bold, fontSize: 13, color: C.muted },
});
