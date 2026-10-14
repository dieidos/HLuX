// Le Projet d'Établissement s'ouvre dans une séance ; l'écran 07 (le sas) demande en plus un profil ouvert.
import { Redirect, Stack, usePathname } from 'expo-router';

import { useReducedMotion } from '../../design/motion';
import { useProject } from '../../core/useProject';

export default function NotreProjet() {
  const reduced = useReducedMotion();
  const pro = useProject((s) => s.pro);
  const person = useProject((s) => s.person);
  const path = usePathname();
  const personal = useProject((s) => s.setup?.kind === 'personal');
  // « Notre projet » est réservé aux membres de l'établissement : jamais sur le téléphone de la personne.
  if (personal || !pro || (path.endsWith('/sujets') && !person)) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: reduced ? 'none' : 'fade' }} />;
}
