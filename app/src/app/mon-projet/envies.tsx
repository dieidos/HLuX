// envies — écran à livrer au lot 3 (voir CDC, « Couverture complète de la V4 »).
import { Text } from 'react-native';

import { Screen } from '../../components/Chrome';
import { C, F } from '../../design/theme';

export default function Ecran() {
  return (
    <Screen side="pp" title="wishes" question="Qu'est-ce que j'aimerais ? J'imagine des possibles.">
      <Text style={{ fontFamily: F.body, color: C.muted, fontSize: 16 }}>Écran en préparation (lot 3).</Text>
    </Screen>
  );
}
