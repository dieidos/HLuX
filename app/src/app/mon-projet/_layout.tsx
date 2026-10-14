// Le Projet Personnalisé ne s'ouvre que dans une séance, sur le profil touché.
import { Redirect, Stack } from 'expo-router';

import { useReducedMotion } from '../../design/motion';
import { useProject } from '../../core/useProject';

export default function MonProjet() {
  const reduced = useReducedMotion();
  const open = useProject((s) => !!s.pro && !!s.person);
  if (!open) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade' }} />;
}
