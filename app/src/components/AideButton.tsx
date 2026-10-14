// Le bouton d'aide IA, le même partout : un geste explicite, une seule proposition, et un humain qui valide.
// La proposition remplit le champ ; elle ne compte qu'une fois validée par le bouton habituel de l'écran.

import { refusalAr } from '../i18n/refusals';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AideRefusal, askAide, type AideKind } from '../core/aides';
import { tNow } from '../core/useAids';
import { C, F, S } from '../design/theme';

interface Props {
  kind: AideKind;
  label: string;
  text: string;
  /** Qui relit et valide : « le groupe », « Amina »… */
  who: string;
  onProposal: (proposal: string) => void;
  /** La langue visée (traduction). */
  lang?: 'fr' | 'ar';
}

export function AideButton({ kind, label, text, who, onProposal, lang }: Props) {
  const [msg, setMsg] = useState('');
  const run = async () => {
    try {
      setMsg('…');
      const r = await askAide({ kind, text, lang });
      // Hors ligne, une traduction ne s'invente pas : on la laisse écrire.
      if (r.offline && kind === 'translate') {
        setMsg(tNow('Sans connexion, pas de traduction : écris-la toi-même.', 'بلا اتصال لا توجد ترجمة: اكتبيها بنفسكِ.', 'Pas d’Internet. Écris toi-même.'));
        return;
      }
      onProposal(r.proposal);
      setMsg(tNow(
        `${r.offline ? 'Exemple hors ligne (sans IA)' : 'Proposition'}. ${who} relit, change si besoin, puis valide.`,
        `${r.offline ? 'مثال دون اتصال (بلا ذكاء اصطناعي)' : 'اقتراح'}. ${who}: مراجعة، وتعديل إن لزم، ثمّ موافقة.`,
        `${r.offline ? 'Un exemple' : 'Une idée'}. ${who} relit, puis dit oui.`,
      ));
    } catch (e) {
      setMsg(e instanceof AideRefusal ? tNow(e.message, refusalAr(e.message)) : tNow("L'aide n'a pas répondu. Rien n'a changé.", 'لم تُجب المساعدة. لم يتغيّر شيء.'));
    }
  };
  return (
    <View style={st.wrap}>
      <Pressable accessibilityRole="button" onPress={run} style={st.btn}>
        <Text style={st.txt}>✨ {label}</Text>
      </Pressable>
      {msg ? <Text style={st.msg} accessibilityLiveRegion="polite">{msg}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { gap: 4, alignSelf: 'stretch' },
  btn: { alignSelf: 'flex-start', minHeight: S.touch, justifyContent: 'center', paddingHorizontal: 16, borderRadius: S.radiusPill, backgroundColor: C.surface2, borderWidth: 1, borderStyle: 'dashed', borderColor: C.violet },
  txt: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  msg: { fontFamily: F.body, fontSize: 13, color: C.muted },
});
