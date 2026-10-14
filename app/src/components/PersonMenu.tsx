// Le menu de la personne, dans le bandeau de chaque écran (décision du 2026-10-14 : moins d'écrans
// intermédiaires). Il remplace l'ancien accueil « Bonjour Amina » : on l'accueille par son prénom ici,
// et ce qui servait rarement (copie, départ, changer de personne, fermer la séance) s'ouvre à la demande.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { needsBackup } from '../core/profiles';
import { useT, useWords } from '../core/useAids';
import { useMe, useProject } from '../core/useProject';
import { C, F, S } from '../design/theme';
import { CompareVersions } from './CompareVersions';
import { DossierCopy } from './DossierCopy';
import { QrReceive, QrSend } from './QrCopy';

export function PersonMenu() {
  const w = useWords();
  const t = useT();
  const me = useMe();
  const pro = useProject((s) => s.pro);
  const personal = useProject((s) => s.setup?.kind === 'personal');
  const profiles = useProject((s) => s.profiles);
  const backedUpNow = useProject((s) => s.backedUpNow);
  const { closeSession, close, purge } = useProject.getState();
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<'send' | 'receive' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [msg, setMsg] = useState('');
  const { height, width } = useWindowDimensions();
  if (!me.id) return null;
  const profile = profiles.find((p) => p.id === me.id);
  const other = profiles.some((p) => p.copyOf === me.id);
  // Un point sur le bouton quand quelque chose attend la personne : une copie à faire, une autre version.
  const waiting = needsBackup(profile, new Date()) || other;
  const home = (f: () => void) => () => { setOpen(false); f(); router.replace('/'); };

  return (
    <View style={st.wrap}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityHint={t('Ouvre le menu', 'يفتح القائمة')} onPress={() => setOpen(!open)} style={st.toggle}>
        <Text style={st.toggleTxt}>{w('hello')} {me.name} 👋</Text>
        <Text style={st.toggleTxt}>{waiting ? ' •' : ''} ▾</Text>
      </Pressable>
      {open ? (
        <View style={[st.panel, { maxHeight: height * 0.75, width: Math.min(400, width - 32) }]}>
          <ScrollView contentContainerStyle={{ gap: 10 }}>
            <CompareVersions />
            {needsBackup(profile, new Date()) && !leaving ? (
              <View style={st.box}>
                <Text style={st.reminder}>{w('backupReminder')}</Text>
                <DossierCopy />
              </View>
            ) : null}
            {!personal && (
              <Pressable accessibilityRole="button" onPress={home(close)} style={st.item}>
                <Text style={st.itemTxt}>👥 {w('changePerson')}</Text>
              </Pressable>
            )}
            <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'send' ? null : 'send')} style={st.item} accessibilityState={{ expanded: qr === 'send' }}>
              <Text style={st.itemTxt}>{w('copyToDevice')}</Text>
            </Pressable>
            {qr === 'send' ? <QrSend /> : null}
            {personal && (
              <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'receive' ? null : 'receive')} style={st.item} accessibilityState={{ expanded: qr === 'receive' }}>
                <Text style={st.itemTxt}>{w('receiveCopy')}</Text>
              </Pressable>
            )}
            {personal && qr === 'receive' ? <QrReceive onDone={(m) => { setQr(null); setMsg(m); }} /> : null}
            {msg ? <Text style={st.note} accessibilityLiveRegion="polite">{msg}</Text> : null}
            {!personal && (
              <Pressable accessibilityRole="button" onPress={() => setLeaving(!leaving)} style={st.item} accessibilityState={{ expanded: leaving }}>
                <Text style={st.itemTxt}>🧳 {w('leaving')}</Text>
              </Pressable>
            )}
            {leaving ? (
              <View style={st.box}>
                <Text style={st.note}>{w('eraseNote')}</Text>
                <DossierCopy />
                <QrSend />
                {!confirmErase ? (
                  <Pressable accessibilityRole="button" accessibilityState={{ disabled: !backedUpNow }} disabled={!backedUpNow} onPress={() => setConfirmErase(true)} style={[st.item, backedUpNow ? st.danger : st.off]}>
                    <Text style={[st.itemTxt, backedUpNow && { color: C.onAccent }]}>{w('eraseHere')}</Text>
                  </Pressable>
                ) : (
                  <View style={st.box} accessibilityRole="alert">
                    <Text style={st.reminder}>{t('C’est définitif : sur cette tablette, ton dossier sera effacé. Ta copie, elle, reste avec toi.', 'هذا نهائي: سيُمحى ملفّكِ من هذا الجهاز اللوحي. نسختكِ تبقى معكِ.', 'C’est pour toujours. Ta copie reste avec toi.')}</Text>
                    <Pressable accessibilityRole="button" onPress={home(() => { setConfirmErase(false); setLeaving(false); purge(); })} style={[st.item, st.danger]}>
                      <Text style={[st.itemTxt, { color: C.onAccent }]}>{t('Oui, effacer définitivement', 'نعم، امحي نهائياً')}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => setConfirmErase(false)} style={st.item}>
                      <Text style={st.itemTxt}>{w('cancel')}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : null}
            {!personal && (
              <Pressable accessibilityRole="button" onPress={home(closeSession)} style={st.item}>
                <Text style={st.itemTxt}>🔒 {w('closeSession')} · {pro}</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 20 },
  toggle: { flexDirection: 'row', alignItems: 'center', minHeight: S.touch, paddingHorizontal: 14, borderRadius: S.radiusPill, backgroundColor: C.pp.soft, borderWidth: 1, borderColor: C.pp.value },
  toggleTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  panel: { position: 'absolute', top: S.touch + 8, end: 0, padding: 14, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, shadowColor: C.ink, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
  box: { gap: 8, padding: 12, borderRadius: 12, backgroundColor: C.surface2 },
  item: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line },
  itemTxt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  danger: { backgroundColor: C.warn.ink, borderColor: C.warn.ink },
  off: { opacity: 0.5 },
  reminder: { fontFamily: F.bold, fontSize: 15, color: C.warn.ink },
  note: { fontFamily: F.body, fontSize: 14, color: C.muted },
});
