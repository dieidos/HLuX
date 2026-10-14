// Emporter mon dossier : une copie chiffrée, lisible seulement avec la phrase de la personne.
// Utilisé sur l'écran 06 (garde-fou : l'export reste possible même si le compte de l'établissement est
// désactivé) et au départ du CHRS (la copie précède l'effacement de la tablette).

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BackupRefusal, exportDossier, MIN_WORDS } from '../core/backup';
import { saveFile } from '../core/saveFile';
import { useProject } from '../core/useProject';
import { C, F, S } from '../design/theme';

export function DossierCopy() {
  const dossier = useProject((s) => s.dossier);
  const markBackedUp = useProject((s) => s.markBackedUp);
  const [phrase, setPhrase] = useState('');
  const [msg, setMsg] = useState('');
  const take = async () => {
    const d = dossier();
    if (!d) return;
    try {
      const f = exportDossier(JSON.stringify(d), phrase);
      await saveFile(`dossier-${d.person}.hlux.json`, JSON.stringify(f));
      markBackedUp(new Date());
      setMsg('Ton dossier chiffré est prêt.');
      setPhrase('');
    } catch (e) {
      setMsg(e instanceof BackupRefusal ? e.message : 'La copie a échoué.');
    }
  };
  return (
    <View style={st.box}>
      <Text style={st.title}>🔒 Emporter mon dossier</Text>
      <Text style={st.small}>
        Une copie chiffrée, lisible seulement avec ta phrase ({MIN_WORDS} mots ou plus). Une phrase perdue, c’est un dossier perdu : personne ne peut la retrouver.
      </Text>
      <TextInput value={phrase} onChangeText={setPhrase} placeholder="Ma phrase de six mots ou plus" secureTextEntry style={st.input} accessibilityLabel="Ma phrase" />
      <Pressable onPress={take} style={st.btn} accessibilityRole="button">
        <Text style={st.btnTxt}>Emporter</Text>
      </Pressable>
      {msg ? <Text style={st.small} accessibilityLiveRegion="polite">{msg}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  box: { gap: 8, padding: 14, borderRadius: S.radius, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, alignSelf: 'stretch' },
  title: { fontFamily: F.bold, fontSize: 17, color: C.ink },
  small: { fontFamily: F.body, fontSize: 13, color: C.muted },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 12, fontFamily: F.body, fontSize: 17, color: C.ink },
  btn: { alignSelf: 'flex-start', minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 18, borderRadius: S.radiusPill, backgroundColor: C.violetInk },
  btnTxt: { fontFamily: F.bold, fontSize: 16, color: C.onAccent },
});
