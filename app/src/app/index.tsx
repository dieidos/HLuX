// Accueil. Premier lancement : on nomme l'établissement et l'équipe (la tablette démarre vide).
// Puis la séance locale ouvre la tablette (décision du 2026-10-14).
// Appui long sur « HLuX » : le mode démonstration, caché, qui entre lui-même ses données.
// 1. La professionnelle touche son prénom. 2. La personne touche le sien, ou entre avec un prénom et une phrase.
// 3. « Bonjour Amina », puis Mon projet ou Notre projet. Hors séance, les profils restent fermés.
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Wordmark } from '../components/Chrome';
import { DossierCopy } from '../components/DossierCopy';
import { QrReceive, QrSend } from '../components/QrCopy';
import { BackupRefusal, importDossier, type BackupFile } from '../core/backup';
import { pickTextFile } from '../core/openFile';
import { needsBackup, readDossier } from '../core/profiles';
import { useWords } from '../core/useAids';
import { enterDemo, useMe, useProject, useTeam } from '../core/useProject';
import { C, F, S } from '../design/theme';

export default function Home() {
  const w = useWords();
  const me = useMe();
  const pro = useProject((s) => s.pro);
  const setup = useProject((s) => s.setup);
  const team = useTeam();
  const [place, setPlace] = useState('');
  const [names, setNames] = useState('');
  const [askDemo, setAskDemo] = useState(false);
  const profiles = useProject((s) => s.profiles);
  const backedUpNow = useProject((s) => s.backedUpNow);
  const { openSession, closeSession, open, close, createProfile, restoreProfile, purge } = useProject.getState();
  const [name, setName] = useState('');
  const [sentence, setSentence] = useState('');
  const [file, setFile] = useState<string | null>(null);
  const [restorePhrase, setRestorePhrase] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [qr, setQr] = useState<'send' | 'receive' | null>(null);
  const profile = profiles.find((p) => p.id === me.id);

  const choose = async () => {
    try {
      setFile(await pickTextFile());
      setRestoreMsg('');
    } catch {
      setRestoreMsg("Ce fichier ne s'ouvre pas.");
    }
  };
  const restore = () => {
    if (!file) return;
    try {
      const d = readDossier(importDossier(JSON.parse(file) as BackupFile, restorePhrase));
      restoreProfile(d);
      setFile(null);
      setRestorePhrase('');
      setRestoreMsg('');
    } catch (e) {
      setRestoreMsg(e instanceof BackupRefusal ? e.message : "Ce fichier n'est pas un dossier HLuX.");
    }
  };

  // Appui long sur « HLuX » : proposer la démonstration (jamais par accident : il faut confirmer).
  const logo = (
    <>
      <Pressable onLongPress={() => setAskDemo(true)} delayLongPress={800} accessibilityLabel="HLuX" accessibilityHint={w('demoOpen')}>
        <Wordmark size={28} />
      </Pressable>
      {askDemo ? (
        <View style={st.newBox}>
          <Text style={st.note}>{w('demoOpen')}</Text>
          <View style={st.row}>
            <Pressable accessibilityRole="button" onPress={() => { setAskDemo(false); enterDemo(); }} style={[st.btn, st.primary]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('openIt')}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setAskDemo(false)} style={st.btn}>
              <Text style={st.btnTxt}>{w('cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </>
  );

  if (!setup) {
    return (
      <ScrollView contentContainerStyle={st.page}>
        {logo}
        <Text style={st.hello}>{w('setupTitle')}</Text>
        <View style={st.newBox}>
          <TextInput value={place} onChangeText={setPlace} placeholder={w('setupPlace')} style={st.input} accessibilityLabel={w('setupPlace')} />
          <TextInput value={names} onChangeText={setNames} placeholder={w('setupTeam')} multiline style={st.input} accessibilityLabel={w('setupTeam')} />
          <Pressable accessibilityRole="button" onPress={() => useProject.getState().configure(place, names.split(/[,;\n]/))} style={[st.btn, st.primary]}>
            <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('begin')}</Text>
          </Pressable>
          <Text style={st.note}>{w('setupNote')}</Text>
        </View>
      </ScrollView>
    );
  }

  if (!pro) {
    return (
      <View style={st.page}>
        {logo}
        <Text style={st.hello}>{w('whoOpens')}</Text>
        <View style={st.row}>
          {team.map((t) => (
            <Pressable key={t} accessibilityRole="button" onPress={() => openSession(t)} style={st.name}>
              <Text style={st.nameTxt}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={st.note}>{w('closedNote')}</Text>
      </View>
    );
  }

  if (!me.id) {
    return (
      <ScrollView contentContainerStyle={st.page}>
        <Wordmark size={28} />
        <Text style={st.hello}>{w('whoIsHere')}</Text>
        <View style={st.row}>
          {profiles.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => open(p.id)} style={st.name}>
              <Text style={st.nameTxt}>{p.firstName}</Text>
            </Pressable>
          ))}
        </View>
        <View style={st.newBox}>
          <Text style={st.doorTxt}>{w('newPerson')}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={w('firstName')} style={st.input} accessibilityLabel={w('firstName')} />
          <TextInput value={sentence} onChangeText={setSentence} placeholder={w('oneSentence')} multiline style={st.input} accessibilityLabel={w('oneSentence')} />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (createProfile(name, sentence)) {
                setName('');
                setSentence('');
              }
            }}
            style={[st.btn, st.primary]}>
            <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('enter')}</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'receive' ? null : 'receive')} style={st.btn} accessibilityState={{ expanded: qr === 'receive' }}>
          <Text style={st.btnTxt}>{w('receiveCopy')}</Text>
        </Pressable>
        {qr === 'receive' ? <QrReceive onDone={(m) => { setQr(null); setRestoreMsg(m); }} /> : null}
        <View style={st.newBox}>
          <Text style={st.doorTxt}>{w('restore')}</Text>
          <Pressable accessibilityRole="button" onPress={choose} style={st.btn}>
            <Text style={st.btnTxt}>📂 {w('chooseFile')}{file ? ' ✓' : ''}</Text>
          </Pressable>
          {file ? <TextInput value={restorePhrase} onChangeText={setRestorePhrase} placeholder="Sa phrase de six mots ou plus" secureTextEntry style={st.input} accessibilityLabel="Phrase du dossier" /> : null}
          {file ? (
            <Pressable accessibilityRole="button" onPress={restore} style={[st.btn, st.primary]}>
              <Text style={[st.btnTxt, { color: C.onAccent }]}>{w('openIt')}</Text>
            </Pressable>
          ) : null}
          {restoreMsg ? <Text style={st.note} accessibilityLiveRegion="polite">{restoreMsg}</Text> : null}
        </View>
        <Link href="/notre-projet/constat" style={[st.door, { borderTopColor: C.pe.value }]}>
          <Text style={st.doorTxt}>🏛️ {w('ourProject')}</Text>
        </Link>
        <Pressable accessibilityRole="button" onPress={closeSession} style={st.btn}>
          <Text style={st.btnTxt}>{w('closeSession')} · {pro}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={st.page}>
      <Wordmark size={28} />
      <Text style={st.hello}>{w('hello')} {me.name} 👋</Text>
      {needsBackup(profile, new Date()) && !leaving ? (
        <View style={st.newBox}>
          <Text style={st.reminder}>{w('backupReminder')}</Text>
          <DossierCopy />
        </View>
      ) : null}
      <View style={st.row}>
        <Link href="/mon-projet/cartes" style={[st.door, { borderTopColor: C.pp.value }]}>
          <Text style={st.doorTxt}>👤 {w('myProject')}</Text>
        </Link>
        <Link href="/notre-projet/sujets" style={[st.door, { borderTopColor: C.pe.value }]}>
          <Text style={st.doorTxt}>🏛️ {w('ourProject')}</Text>
        </Link>
      </View>
      <View style={st.row}>
        <Pressable accessibilityRole="button" onPress={close} style={st.btn}>
          <Text style={st.btnTxt}>{w('changePerson')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={closeSession} style={st.btn}>
          <Text style={st.btnTxt}>{w('closeSession')} · {pro}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setQr(qr === 'send' ? null : 'send')} style={st.btn} accessibilityState={{ expanded: qr === 'send' }}>
          <Text style={st.btnTxt}>{w('copyToDevice')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setLeaving(!leaving)} style={st.btn} accessibilityState={{ expanded: leaving }}>
          <Text style={st.btnTxt}>🧳 {w('leaving')}</Text>
        </Pressable>
      </View>
      {qr === 'send' ? <QrSend /> : null}
      {leaving ? (
        <View style={st.newBox}>
          <Text style={st.note}>{w('eraseNote')}</Text>
          <DossierCopy />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !backedUpNow }}
            disabled={!backedUpNow}
            onPress={() => purge()}
            style={[st.btn, backedUpNow ? st.danger : st.off]}>
            <Text style={[st.btnTxt, backedUpNow && { color: C.onAccent }]}>{w('eraseHere')}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 24, backgroundColor: C.bg, padding: 24 },
  hello: { fontFamily: F.display, fontSize: 40, color: C.ink, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  name: { minWidth: 140, minHeight: S.touch * 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line },
  nameTxt: { fontFamily: F.display, fontSize: 24, color: C.ink },
  newBox: { width: '100%', maxWidth: 420, gap: 10, padding: 16, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 6, borderTopColor: C.pp.value },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
  door: { minWidth: 260, padding: 28, borderRadius: S.radius, backgroundColor: C.surface, borderTopWidth: 8 },
  doorTxt: { fontFamily: F.bold, fontSize: 22, color: C.ink },
  note: { fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center', maxWidth: 420 },
  btn: { minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderColor: C.line, alignSelf: 'center' },
  primary: { backgroundColor: C.violetInk, borderColor: C.violetInk },
  danger: { backgroundColor: C.warn.ink, borderColor: C.warn.ink },
  off: { opacity: 0.5 },
  reminder: { fontFamily: F.bold, fontSize: 17, color: C.warn.ink },
  btnTxt: { fontFamily: F.bold, fontSize: 16, color: C.ink },
});
