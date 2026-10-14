// 05 Regards — Amina au centre choisit qui l'éclaire, et sur quoi : chaque invité voit une seule idée,
// dans sa langue. On voit qui a répondu, jamais le contenu, jusqu'à « découvrir ensemble ».
// Puis quatre lectures : Mon regard · Le regard de… · Nos regards réunis · Avec l'ordre de la professionnelle.

import {Link, usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AideButton } from '../../components/AideButton';
import { Screen } from '../../components/Chrome';
import type { Channel, Circle, Lang, Lean, Rank } from '../../core/acts';
import { expired, lineKey } from '../../core/project';
import {tNow, tell, useT, useWords } from '../../core/useAids';
import { useProject, useProjectState, useMe } from '../../core/useProject';
import { band, leanOf } from '../../core/views';
import { C, F, S } from '../../design/theme';
import type { WordKey } from '../../i18n/words';

const AXES: [Circle, WordKey][] = [['living', 'living'], ['able', 'able'], ['love', 'love'], ['useful', 'useful']];
const ORDER: Rank[] = ['first', 'then', 'also', 'less', 'not_yet'];

const CHANNEL_KEYS: Channel[] = ['sms', 'mail', 'in_session'];

export default function Regards() {
  const pathname = usePathname();
  const pro = useProject((x) => x.pro) ?? '';
  const me = useMe();
  const w = useWords();
  const t = useT();
  const channels: Record<Channel, string> = { sms: '📱 SMS', mail: t('✉️ mail', '✉️ بريد'), in_session: t('🤝 en séance', '🤝 في الجلسة') };
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const [tab, setTab] = useState<string>('mine');
  const [form, setForm] = useState(false);
  const [guest, setGuest] = useState('');
  const [relation, setRelation] = useState('');
  const [idea, setIdea] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('fr');
  const [channel, setChannel] = useState<Channel>('sms');
  const [ideaText, setIdeaText] = useState('');
  const [ideaAided, setIdeaAided] = useState(false);
  const [days, setDays] = useState(7);

  const ideas = Object.entries(s.ideas).filter(([, i]) => i.spot.at !== 'discarded');
  const invitations = Object.entries(s.invitations);
  const stack = (ranks: Partial<Record<Circle, Rank>>) =>
    [...AXES].sort((a, b) => ORDER.indexOf(ranks[a[0]] ?? 'not_yet') - ORDER.indexOf(ranks[b[0]] ?? 'not_yet'));
  const sarahRanks = Object.fromEntries(s.companionOrder?.ranks ?? []) as Partial<Record<Circle, Rank>>;

  const send = () => {
    if (!guest.trim() || !idea) return;
    // En arabe, l'idée part dans la langue de l'invité, confirmée par la personne qui invite.
    if (lang === 'ar' && !ideaText.trim()) return;
    const id = `inv-${invitations.length + 1}`;
    const expires = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const aided = lang === 'ar' && ideaAided;
    act(aided ? 'hlux-ia' : me.id, { act: 'invitation_sent', invitation: id, guest: guest.trim(), relation: relation.trim(), idea, axes: AXES.map((a) => a[0]), lang, expires, channel, idea_text: lang === 'ar' ? ideaText.trim() : null }, aided ? 'generated' : 'by_hand', aided ? me.id : undefined);
    tell(tNow(`${guest.trim()} est invitée sur « ${s.ideas[idea].title} ».`, `${guest.trim()} مدعوّة إلى فكرة « ${s.ideas[idea].title} ».`), pathname);
    setForm(false); setGuest(''); setRelation(''); setIdea(null); setIdeaText(''); setIdeaAided(false);
  };

  const lines = (ranks: Partial<Record<Circle, Rank>>, who: 'mine' | 'together' | string) => (
    <View style={{ gap: 8 }}>
      {stack(ranks).map(([axis, k]) => (
        <View key={axis} style={st.line}>
          <Text style={st.axis}>{w(k)}</Text>
          {ideas.map(([id, i]) => {
            const mine = leanOf(s.lines[lineKey(axis, me.id)] ?? ideas.map(([x]) => x), id);
            const theirs = invitations
              .filter(([, inv]) => inv.idea === id && inv.answered && (who === 'together' || who === inv.guest))
              .map(([, inv]) => [inv.guest, inv.leans.find(([a]) => a === axis)?.[1]] as const)
              .filter(([, l]) => l) as [string, Lean][];
            if (who !== 'mine' && who !== 'together' && theirs.length === 0) return null;
            const marks: [string, Lean][] = [...(who === 'mine' || who === 'together' ? [[me.name, mine ?? 'middle'] as [string, Lean]] : []), ...theirs];
            const b = who === 'together' ? band(marks.map((m) => m[1])) : null;
            return (
              <View key={id} style={st.ideaRow}>
                <Text style={st.ideaName}>{i.title}</Text>
                <View style={st.track}>
                  {b && (
                    <View style={[st.band, { left: `${(['little', 'middle', 'much'].indexOf(b.from) * 100) / 3}%`, width: `${((['little', 'middle', 'much'].indexOf(b.to) - ['little', 'middle', 'much'].indexOf(b.from) + 1) * 100) / 3}%`, backgroundColor: b.narrow ? C.band.near : C.band.far }]} />
                  )}
                  {marks.map(([name, l]) => (
                    <Text key={name} style={[st.mark, { left: `${(['little', 'middle', 'much'].indexOf(l) * 100) / 3 + 4}%` }, name !== me.name && st.markOther]}>{name}</Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      ))}
      {who === 'together' && <Text style={st.small}>{w('narrow')} · {w('wide')}</Text>}
    </View>
  );

  return (
    <Screen side="pp" title="views" question={w('viewsQuestion')}>
      <ScrollView contentContainerStyle={{ gap: 14 }}>
        <View style={st.ring}>
          {(() => {
            // La personne au milieu de l'anneau : la moitié des regards avant elle, l'autre moitié après.
            const around = [
              <View key="pro" style={st.sat}><Text style={st.name}>{pro}</Text><Text style={st.small}>{w('inSession')}</Text></View>,
              ...invitations.map(([id, inv]) => (
                <View key={id} style={st.sat}>
                  <Text style={st.name}>{inv.guest}{inv.relation ? `, ${inv.relation}` : ''}</Text>
                  <Text style={st.small}>« {s.ideas[inv.idea]?.title} » · {inv.lang === 'ar' ? t('en arabe', 'بالعربية') : t('en français', 'بالفرنسية')}</Text>
                  <Text style={[st.status, inv.answered && st.statusOk]}>
                    {inv.answered ? w('answered') : expired(inv, new Date()) ? t('expirée · le lien s’est reposé', 'انتهت · توقّف الرابط', 'fini · le lien ne marche plus') : `${w('invited')} · ${w('notYetAnswered')}`}
                    {inv.channel ? ` · ${channels[inv.channel]}` : ''}
                  </Text>
                  {!inv.answered && !expired(inv, new Date()) && <Link href={`/invite/${id}`} style={st.link}>{t('Ouvrir le lien invité', 'فتح رابط الدعوة')}</Link>}
                </View>
              )),
              <Pressable key="invite" onPress={() => setForm(true)} style={st.btn} accessibilityRole="button"><Text style={st.btnTxt}>{w('invite')}</Text></Pressable>,
            ];
            const mid = Math.ceil(around.length / 2);
            const center = <View key="me" style={st.center}><Text style={st.name}>{me.name}</Text><Text style={st.small}>{w('sheInvites')}</Text></View>;
            return [...around.slice(0, mid), center, ...around.slice(mid)];
          })()}
        </View>
        <Text style={st.small}>{w('onlyHerIdea')} {w('silenceOk')}</Text>

        {!s.viewsRevealed ? (
          <Pressable onPress={() => { act(me.id, { act: 'views_revealed' }); tell(tNow('Les regards se découvrent ensemble.', 'نكتشف النظرات معاً.', 'On regarde ensemble.'), pathname); }} style={[st.btn, st.primary]} accessibilityRole="button">
            <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('revealTogether')}</Text>
          </Pressable>
        ) : (
          <>
            <View style={st.tabs}>
              {[['mine', w('myView')], ...invitations.filter(([, i]) => i.answered).map(([, i]) => [i.guest, t(`Le regard de ${i.guest}`, `نظرة ${i.guest}`)]), ['together', w('together')], ['sarah', t(`Avec l'ordre de ${pro}`, `بترتيب ${pro}`, `L'ordre de ${pro}`)]].map(([k, label]) => (
                <Pressable key={k} onPress={() => setTab(k)} style={[st.tab, tab === k && st.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
                  <Text style={[st.btnTxt, tab === k && { color: C.onAccent }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {tab === 'sarah' ? (
              <>
                <CompanionOrder />
                {lines(sarahRanks, 'together')}
              </>
            ) : (
              lines(s.axisRanks, tab)
            )}
          </>
        )}
      </ScrollView>

      {form && (
        <View style={st.overlay}>
          <ScrollView style={st.sheetScroll} contentContainerStyle={st.sheet}>
            <Text style={st.sheetTitle}>{w('invite')}</Text>
            <TextInput value={guest} onChangeText={setGuest} placeholder={t('Son prénom', 'اسمها')} style={st.input} accessibilityLabel={t('Prénom', 'الاسم')} />
            <TextInput value={relation} onChangeText={setRelation} placeholder={t('Qui est-ce pour toi ?', 'من هي بالنسبة لكِ؟')} style={st.input} accessibilityLabel={t('Lien', 'الصلة')} />
            <Text style={st.small}>{t('Sur quelle idée ? (une seule)', 'على أيّ فكرة؟ (فكرة واحدة فقط)', 'Quelle idée ? Une seule.')}</Text>
            <View style={st.chips}>
              {ideas.map(([id, i]) => (
                <Pressable accessibilityRole="button" key={id} onPress={() => setIdea(id)} style={[st.pick, idea === id && st.pickOn]}><Text style={st.btnTxt}>{i.title}</Text></Pressable>
              ))}
            </View>
            <View style={st.chips}>
              {(['fr', 'ar'] as Lang[]).map((l) => (
                <Pressable accessibilityRole="button" key={l} onPress={() => setLang(l)} style={[st.pick, lang === l && st.pickOn]}><Text style={st.btnTxt}>{l === 'fr' ? t('en français', 'بالفرنسية') : 'بالعربية'}</Text></Pressable>
              ))}
            </View>
            {lang === 'ar' && idea ? (
              <View style={{ gap: 6 }}>
                <TextInput value={ideaText} onChangeText={setIdeaText} placeholder={t("L'idée, en arabe", 'الفكرة، بالعربية')} style={[st.input, { writingDirection: 'rtl' }]} accessibilityLabel={t("L'idée en arabe", 'الفكرة بالعربية')} />
                <AideButton kind="translate" lang="ar" label={t("Traduire l'idée", 'ترجمة الفكرة')} text={s.ideas[idea].title} who={me.name} onProposal={(p) => { setIdeaText(p); setIdeaAided(true); }} />
              </View>
            ) : null}
            <View style={st.chips}>
              {CHANNEL_KEYS.map((c) => (
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: channel === c }} key={c} onPress={() => setChannel(c)} style={[st.pick, channel === c && st.pickOn]}><Text style={st.btnTxt}>{channels[c]}</Text></Pressable>
              ))}
            </View>
            <View style={st.chips}>
              {[3, 7, 14].map((d) => (
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: days === d }} key={d} onPress={() => setDays(d)} style={[st.pick, days === d && st.pickOn]}><Text style={st.btnTxt}>{t(`${d} jours`, d > 10 ? `${d} يوماً` : `${d} أيام`)}</Text></Pressable>
              ))}
            </View>
            <Text style={st.small}>{t('Lien temporaire, sans compte : passé ce délai, il se repose. Rien d’autre que cette idée n’est montré.', 'رابط مؤقّت، بلا حساب: بعد هذه المدّة يتوقّف. لا يظهر شيء غير هذه الفكرة.', 'Le lien marche quelques jours. On voit seulement cette idée.')}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={send} style={[st.btn, st.primary]}><Text style={[st.btnTxt, { color: C.onAccent }]}>{t('Inviter', 'دعوة')}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => setForm(false)} style={st.btn}><Text style={st.btnTxt}>{t('Annuler', 'إلغاء')}</Text></Pressable>
            </View>
          </ScrollView>
        </View>
      )}
    </Screen>
  );
}

/** L'ordre de la professionnelle de la séance : une autre lecture, posée avec la personne, qui ne déplace aucune marque. */
function CompanionOrder() {
  const pro = useProject((x) => x.pro) ?? '';
  const s = useProjectState();
  const act = useProject((x) => x.act);
  const w = useWords();
  const t = useT();
  const current = Object.fromEntries(s.companionOrder?.ranks ?? []) as Partial<Record<Circle, Rank>>;
  const cycle = (axis: Circle) => {
    const next = ORDER[(ORDER.indexOf(current[axis] ?? 'not_yet') + 1) % ORDER.length];
    const ranks = { ...current, [axis]: next };
    act(pro, { act: 'companion_order', by: pro, ranks: Object.entries(ranks) as [Circle, Rank][] });
  };
  return (
    <View style={st.chips}>
      {AXES.map(([a, k]) => (
        <Pressable accessibilityRole="button" key={a} onPress={() => cycle(a)} style={st.pick} accessibilityLabel={t(`Rang de ${pro} pour ${w(k)}`, `ترتيب ${pro} لـ ${w(k)}`)}>
          <Text style={st.btnTxt}>{w(k)} · {current[a] ? { first: t("D'abord", 'أوّلاً'), then: t('Ensuite', 'ثمّ'), also: t('Aussi', 'أيضاً'), less: t('Moins', 'أقلّ'), not_yet: '?' }[current[a]!] : '?'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  // L'anneau des regards : la personne au milieu, les autres autour, dans un cercle en pointillé.
  ring: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 240, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line },
  center: { padding: 18, borderRadius: 999, backgroundColor: C.pp.soft, borderWidth: 3, borderColor: C.pp.value, alignItems: 'center' },
  sat: { padding: 12, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, gap: 2, maxWidth: 280 },
  name: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  status: { fontFamily: F.bold, fontSize: 13, color: C.slate },
  statusOk: { color: C.pe.ink },
  link: { fontFamily: F.bold, fontSize: 15, color: C.violetInk, textDecorationLine: 'underline', minHeight: S.touch, paddingVertical: 12 },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignSelf: 'flex-start' },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  tabOn: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  line: { padding: 12, borderRadius: S.radius, backgroundColor: C.surface, gap: 6 },
  axis: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  ideaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ideaName: { width: 160, fontFamily: F.body, fontSize: 14, color: C.text },
  track: { flex: 1, height: 40, borderRadius: 10, backgroundColor: C.surface2, justifyContent: 'center' },
  band: { position: 'absolute', top: 4, bottom: 4, borderRadius: 8 },
  mark: { position: 'absolute', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: C.violetInk, color: C.onAccent, fontFamily: F.bold, fontSize: 12, overflow: 'hidden' },
  markOther: { backgroundColor: C.blue.soft, color: C.blue.mark, borderWidth: 2, borderStyle: 'dashed', borderColor: C.blue.line, top: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: S.radiusPill, borderWidth: 2, borderColor: C.line, backgroundColor: C.surface },
  pickOn: { borderColor: C.violet, backgroundColor: C.violetSoft },
  overlay: { position: 'absolute', inset: 0, backgroundColor: C.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 },
  // Le formulaire défile si l'écran est petit : « Inviter » reste toujours atteignable.
  sheetScroll: { width: '100%', maxWidth: 560, maxHeight: '100%', borderRadius: 20, backgroundColor: C.surface },
  sheet: { gap: 10, padding: 24 },
  sheetTitle: { fontFamily: F.display, fontSize: 24, color: C.ink },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
});
