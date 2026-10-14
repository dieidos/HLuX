// sujets — écran à livrer au lot 6 (voir CDC, « Couverture complète de la V4 »).
import { Text } from 'react-native';

import { Screen } from '../../components/Chrome';
import { C, F } from '../../design/theme';

export default function Ecran() {
  return (
    <Screen side="pe" title="subjects" question="Quels sujets travailler ? Seulement si la personne le veut.">
      <Text style={{ fontFamily: F.body, color: C.muted, fontSize: 16 }}>Écran en préparation (lot 6).</Text>
    </Screen>
  );
}
