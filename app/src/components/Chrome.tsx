// Ce qui entoure chaque écran, comme dans l'Atlas : barre du haut (logo + HLuX, projet, fil des
// six étapes) et barre d'aides (Écouter · Plus simple · Langue).

import { Link, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

import { say, useAids, useRegister, useWords } from '../core/useAids';
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

/** HLuX, aux couleurs exactes du logo, sans fond ni contour. */
export function Wordmark({ size = 15 }: { size?: number }) {
  return (
    <Text style={{ fontFamily: F.wordmark, fontSize: size, fontWeight: '700', letterSpacing: 0.8 }} accessibilityLabel="HLuX">
      <Text style={{ color: C.logo.first }}>HL</Text>
      <Text style={{ color: C.logo.second }}>u</Text>
      <Text style={{ color: C.logo.third }}>X</Text>
    </Text>
  );
}

export function Screen({ side, title, question, children }: { side: 'pp' | 'pe'; title: WordKey; question: string; children: ReactNode }) {
  const w = useWords();
  const path = usePathname();
  const steps = side === 'pp' ? PP : PE;
  const reg = useRegister();
  const rtl = side === 'pp' && reg === 'ar';
  return (
    <View style={[st.page, { direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={st.top}>
        <Link href="/" accessibilityLabel="Accueil" style={st.home}><Wordmark /></Link>
        <Text style={st.proj}>{w(side === 'pp' ? 'myProject' : 'ourProject')}</Text>
        <View style={st.stepper}>
          {steps.map(([k, href]) => {
            const on = path === href;
            return (
              <Link key={href} href={href as never} style={[st.step, on && { backgroundColor: side === 'pp' ? C.pp.value : C.pe.value }]}>
                <Text style={[st.stepTxt, on && { color: C.ink }]} numberOfLines={1}>{w(k)}</Text>
              </Link>
            );
          })}
        </View>
      </View>
      <View style={st.head}>
        <Text style={st.title}>{w(title)}</Text>
        <Text style={st.question} onPress={() => say(question)}>{question}</Text>
      </View>
      <View style={st.body}>{children}</View>
      <AidsBar side={side} />
    </View>
  );
}

export function AidsBar({ side }: { side: 'pp' | 'pe' }) {
  const w = useWords();
  const { listen, simple, lang, toggle, switchLang } = useAids();
  return (
    <View style={st.aids}>
      <Aid on={listen} label={w('listen')} onPress={() => toggle('listen')} />
      <Aid on={simple} label={w('simpler')} onPress={() => toggle('simple')} />
      {side === 'pp' && <Aid on={lang === 'ar'} label={w('language')} onPress={() => { switchLang(); I18nManager.allowRTL(true); }} />}
      <Text style={st.who}>{side === 'pp' ? `Amina · ${w('withSarah')}` : 'CHRS Les Lilas'}</Text>
    </View>
  );
}

function Aid({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} style={[st.aid, on && st.aidOn]}>
      <Text style={[st.aidTxt, on && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: S.gap, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderColor: C.line },
  home: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  proj: { fontFamily: F.body, fontWeight: '700', color: C.ink, fontSize: 15 },
  stepper: { flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' },
  step: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: S.radiusPill, backgroundColor: C.surface2, minHeight: 32 },
  stepTxt: { fontFamily: F.body, fontSize: 13, fontWeight: '700', color: C.muted },
  head: { paddingHorizontal: 24, paddingTop: 16, gap: 4 },
  title: { fontFamily: F.display, fontSize: S.title, color: C.ink },
  question: { fontFamily: F.body, fontSize: S.body, color: C.text },
  body: { flex: 1, padding: 24 },
  aids: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: C.surface, borderTopWidth: 1, borderColor: C.line },
  aid: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  aidOn: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  aidTxt: { fontFamily: F.body, fontWeight: '700', color: C.ink, fontSize: 15 },
  who: { marginStart: 'auto', fontFamily: F.body, fontSize: 13, color: C.muted, fontWeight: '700' },
});
