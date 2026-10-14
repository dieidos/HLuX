// 01 Cartes — « Quelle Carte reprendre ? Ou j'en ajoute une. »
// Cartes existantes ; Nouvelle Carte (je parle / j'écris / je choisis une image) ; Carte en grand.

import { momentAr } from '../../i18n/moments';
import { usePathname } from 'expo-router';
import { refusalAr } from '../../i18n/refusals';
import { dayInWords } from '../../core/dates';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CardView } from '../../components/CardView';
import { DictateButton } from '../../components/DictateButton';
import { Screen } from '../../components/Chrome';
import { Picto } from '../../components/Picto';
import { AideRefusal, askAide, sortPictos } from '../../core/aides';
import { cardThread } from '../../core/thread';
import { useFacilityState } from '../../core/useFacility';
import { say, tNow, tell, useAids, useT, useWords } from '../../core/useAids';
import { usePending, useProject, useProjectState, useMe } from '../../core/useProject';
import { PICTOS, type PictoKey } from '../../design/pictos';
import { C, F, S } from '../../design/theme';

/** La provenance d'une Carte : comment elle est née. */
/** `lang="ar"` sur le web (react-native-web le transmet ; les types de React Native ne le connaissent pas). */
const AR = { lang: 'ar' } as object;
const ORIGIN = {
  spoken: ['🗣️ dite', '🗣️ قيلت بالصوت'],
  written: ['✍️ écrite', '✍️ كُتبت'],
  picture: ['🖼️ choisie en image', '🖼️ اختيرت بصورة'],
} as const;

/** Les étapes du fil de la Carte, dites en arabe. */
const STEP_AR: Record<string, string> = {
  Dite: 'قيلت', Ressentie: 'أُحسّت', 'Une envie en est née': 'وُلدت منها رغبة', 'Apportée au collectif': 'قُدّمت للمجموعة',
  'Un engagement du collectif': 'التزام من المجموعة', 'Reliée à mon chemin': 'رُبطت بطريقي',
};

export default function Cartes() {
  const pathname = usePathname();
  const arabic = useAids().lang === 'ar';
  const me = useMe();
  const w = useWords();
  const t = useT();
  const s = useProjectState();
  const f = useFacilityState();
  const act = useProject((x) => x.act);
  const pro = useProject((x) => x.pro);
  const brought = new Set(Object.values(s.subjects).map((x) => x.card));
  const confirm = useProject((x) => x.confirm);
  const undo = useProject((x) => x.undo);
  const pending = usePending();
  const [aideMsg, setAideMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [picto, setPicto] = useState<PictoKey | null>(null);
  // « …ou je choisis une image » : l'IA peut ordonner les images d'après la phrase, sur geste ; elle ne choisit pas.
  const [order, setOrder] = useState<PictoKey[]>(Object.keys(PICTOS) as PictoKey[]);
  const [sortMsg, setSortMsg] = useState('');
  const sortByText = async () => {
    try {
      const keys = Object.keys(PICTOS) as PictoKey[];
      const sorted = (await sortPictos(text, keys, arabic ? 'ar' : 'fr')) as PictoKey[];
      setOrder(sorted);
      setSortMsg(sorted === keys ? tNow('Les images restent dans l’ordre habituel.', 'تبقى الصور بترتيبها المعتاد.') : tNow('Les images les plus proches de ta phrase sont devant. C’est toi qui choisis.', 'الصور الأقرب إلى جملتكِ في المقدّمة. أنتِ من تختارين.'));
    } catch (e) {
      setSortMsg(e instanceof AideRefusal ? tNow(e.message, refusalAr(e.message)) : tNow("L'aide n'a pas répondu.", 'لم تُجب المساعدة.'));
    }
  };
  const [spoken, setSpoken] = useState(false);
  const big = open ? s.cards[open] : null;

  // Une aide IA : sur geste, le résultat attend la validation d'Amina (journal : « hypothesis »).
  const aide = async (card: string, kind: 'simplify' | 'translate') => {
    const c = s.cards[card];
    try {
      setAideMsg('…');
      // Simplifier : dans la langue de la Carte. Traduire : vers l'autre langue (fr ↔ ar).
      const target = kind === 'translate' ? (c.lang === 'ar' ? 'fr' : 'ar') : c.lang;
      const r = await askAide({ kind, text: c.verbatim || c.title, lang: target, register: kind === 'simplify' ? 'falc' : 'plain' });
      act('hlux-ia', kind === 'simplify' ? { act: 'card_simpler', card, text: r.proposal } : { act: 'card_translated', card, lang: target, text: r.proposal }, 'hypothesis');
      setAideMsg(r.offline
        ? tNow('Exemple hors ligne (sans IA) — à valider.', 'مثال دون اتصال (بلا ذكاء اصطناعي) — للتأكيد.', 'Un exemple. Tu dois dire oui ou non.')
        : tNow('Proposition — à valider.', 'اقتراح — للتأكيد.', 'Une idée. Tu dois dire oui ou non.'));
    } catch (e) {
      setAideMsg(e instanceof AideRefusal ? tNow(e.message, refusalAr(e.message)) : tNow("L'aide n'a pas répondu.", 'لم تُجب المساعدة.'));
    }
  };
  const proposalsFor = (card: string) =>
    pending.filter((e) => e.act && 'card' in e.act && e.act.card === card && (e.act.act === 'card_simpler' || e.act.act === 'card_translated'));

  const create = () => {
    if (!text.trim() && !picto) return;
    const id = `carte-${Object.keys(s.cards).length + 1}`;
    act(me.id, {
      act: 'card_created', card: id, title: picto ? PICTOS[picto].fr : text.trim().split(' ').slice(0, 3).join(' '),
      picto, verbatim: text.trim(), lang: arabic ? 'ar' : 'fr', origin: picto && !text.trim() ? 'picture' : spoken ? 'spoken' : 'written', said_with: pro, when: dayInWords(),
    });
    tell(tNow('Ta Carte est créée.', 'تمّ إنشاء بطاقتكِ.'), pathname);
    setAdding(false); setText(''); setPicto(null); setSpoken(false);
  };

  return (
    <Screen side="pp" title="cards" question={w('whichCard')}>
      <ScrollView contentContainerStyle={st.grid}>
        {Object.entries(s.cards).map(([id, c]) => (
          <Pressable accessibilityRole="button" key={id} onPress={() => { setOpen(id); say(c.verbatim || c.title); }} accessibilityLabel={c.title}>
            <CardView card={c} brought={brought.has(id)} />
          </Pressable>
        ))}
        <Pressable onPress={() => setAdding(true)} style={st.new} accessibilityRole="button">
          <Text style={st.plus}>＋</Text>
          <Text style={st.newTitle}>{w('newCard')}</Text>
          <Text style={st.muted}>{w('newCardHow')}</Text>
        </Pressable>
      </ScrollView>

      {big && (
        <View style={st.overlay}>
          <View style={st.bigCard}>
            {big.picto && <Picto name={big.picto} size={96} />}
            <Text style={st.bigTitle}>{arabic && big.picto ? PICTOS[big.picto as PictoKey]?.ar ?? big.title : big.title}</Text>
            {big.verbatim ? <Text style={st.verbatim}>« {big.verbatim} »</Text> : null}
            {big.simpler ? <Text style={st.simpler}>{t('Plus simple : ', 'أبسط: ')}{big.simpler}</Text> : null}
            {big.translations.ar ? <Text style={[st.simpler, { writingDirection: "rtl" }]} {...AR}>🌐 {big.translations.ar}</Text> : null}
            <Text style={st.chip}>{t(ORIGIN[big.origin][0], ORIGIN[big.origin][1])}{big.saidWith ? t(` · avec ${big.saidWith}`, ` · مع ${big.saidWith}`) : ''}{brought.has(open!) ? t(' · 🟢 apportée au collectif', ' · 🟢 قُدّمت للمجموعة', ' · 🟢 donnée au groupe') : ''}</Text>
            {!big.feeling && <Text style={st.chip}>{w('notPlaced')}</Text>}
            <Text style={st.muted}>{w('keepsAll')}</Text>
            <View style={st.thread} accessibilityLabel={t('Le fil de la Carte', 'مسار البطاقة')}>
              {cardThread(open!, s, f).map((x, i) => (
                <View key={`${x.step}-${i}`} style={st.step}>
                  <View style={st.dot} />
                  <Text style={st.stepTxt}><Text style={{ fontFamily: F.bold }}>{t(x.step, STEP_AR[x.step] ?? x.step)}</Text> · {arabic ? momentAr(x.detail) : x.detail}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable accessibilityRole="button" onPress={() => aide(open!, 'simplify')} style={st.btn}><Text style={st.btnTxt}>{t('💬 Version plus simple', '💬 نسخة أبسط', '💬 Plus simple')}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => aide(open!, 'translate')} style={st.btn}><Text style={st.btnTxt}>{big.lang === 'ar' ? t('🌐 En français', '🌐 بالفرنسية') : t('🌐 En arabe', '🌐 بالعربية')}</Text></Pressable>
            </View>
            {aideMsg ? <Text style={st.muted} accessibilityLiveRegion="polite">{aideMsg}</Text> : null}
            {proposalsFor(open!).map((e) => (
              <View key={e.rank} style={st.proposal}>
                <Text style={st.simpler}>{t('Proposition : ', 'اقتراح: ')}{e.act && 'text' in e.act ? e.act.text : ''}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable accessibilityRole="button" onPress={() => { confirm(e.rank, me.id); setAideMsg(tNow(`Validé par ${me.name}.`, `وافقت ${me.name}.`)); }} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Je valide', 'أوافق')}</Text></Pressable>
                  <Pressable accessibilityRole="button" onPress={() => { undo(me.id, e.rank); setAideMsg(tNow('Écartée.', 'تمّ الإبعاد.', 'Enlevée.')); }} style={st.btn}><Text style={st.btnTxt}>{t('Non merci', 'لا، شكراً')}</Text></Pressable>
                </View>
              </View>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setOpen(null)} style={st.btn}><Text style={st.btnTxt}>{t('Fermer', 'إغلاق')}</Text></Pressable>
          </View>
        </View>
      )}

      {adding && (
        <View style={st.overlay}>
          <View style={st.bigCard}>
            <Text style={st.bigTitle}>{w('newCard')}</Text>
            <TextInput value={text} onChangeText={setText} placeholder={t("J'écris ce que je veux dire…", 'أكتب ما أريد قوله…', "J'écris ici…")} style={st.input} multiline accessibilityLabel={t("J'écris", 'أكتب')} />
            <DictateButton lang={arabic ? 'ar' : 'fr'} onText={(said) => { setText(said); setSpoken(true); }} />
            <Text style={st.muted}>{t('…ou je choisis une image', '…أو أختار صورة')}</Text>
            {text.trim() ? (
              <Pressable accessibilityRole="button" onPress={sortByText} style={st.btn}>
                <Text style={st.btnTxt}>{t('✨ Les images proches de ma phrase', '✨ الصور القريبة من جملتي')}</Text>
              </Pressable>
            ) : null}
            {sortMsg ? <Text style={st.muted} accessibilityLiveRegion="polite">{sortMsg}</Text> : null}
            <View style={st.pictos}>
              {order.map((k) => (
                <Pressable accessibilityRole="button" key={k} onPress={() => setPicto(k)} style={[st.pick, picto === k && st.pickOn]} accessibilityLabel={arabic ? PICTOS[k].ar : PICTOS[k].fr}>
                  <Picto name={k} size={56} />
                </Pressable>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={create} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Créer ma Carte', 'إنشاء بطاقتي')}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setAdding(false)} style={st.btn}><Text style={st.btnTxt}>{t('Annuler', 'إلغاء')}</Text></Pressable>
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  new: { minWidth: 220, padding: 16, borderRadius: S.radius, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, backgroundColor: C.surface },
  plus: { fontSize: 32, color: C.slate },
  newTitle: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  muted: { fontFamily: F.body, fontSize: 13, color: C.muted },
  overlay: { position: 'absolute', inset: 0, backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 },
  bigCard: { width: '100%', maxWidth: 620, gap: 10, padding: 24, borderRadius: 20, backgroundColor: C.surface, borderTopWidth: 8, borderTopColor: C.pp.value },
  bigTitle: { fontFamily: F.display, fontSize: 26, color: C.ink },
  verbatim: { fontFamily: F.display, fontSize: 22, color: C.ink },
  simpler: { fontFamily: F.body, fontSize: 16, color: C.text },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: S.radiusPill, backgroundColor: C.surface2, fontFamily: F.body, fontSize: 13, color: C.slate },
  thread: { gap: 6, paddingLeft: 4, borderLeftWidth: 2, borderLeftColor: C.line, marginLeft: 6 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: -9 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.pp.value },
  stepTxt: { flexShrink: 1, fontFamily: F.body, fontSize: 15, color: C.text },
  proposal: { gap: 6, padding: 10, borderRadius: 12, backgroundColor: C.violetSoft, borderWidth: 1, borderStyle: 'dashed', borderColor: C.violet },
  input: { minHeight: 80, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
  pictos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: { borderRadius: 16, padding: 3, borderWidth: 3, borderColor: 'transparent' },
  pickOn: { borderColor: C.violet },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start' },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 16, color: C.ink },
});
