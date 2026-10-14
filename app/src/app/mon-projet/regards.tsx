// regards — écran à livrer au lot 4 (voir CDC, « Couverture complète de la V4 »).
import { Text } from 'react-native';

import { Screen } from '../../components/Chrome';
import { C, F } from '../../design/theme';

export default function Ecran() {
  return (
    <Screen side="pp" title="views" question="Qui peut m'aider à choisir ? Nous comparons nos regards.">
      <Text style={{ fontFamily: F.body, color: C.muted, fontSize: 16 }}>Écran en préparation (lot 4).</Text>
    </Screen>
  );
}
