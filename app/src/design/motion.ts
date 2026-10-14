// « Réduire les animations » (réglage du système) est respecté : pas de ressort, pas de fondu, pas de pulsation.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

let reduced = false;
AccessibilityInfo.isReduceMotionEnabled().then((v) => (reduced = v)).catch(() => undefined);
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => (reduced = v));

/** La valeur du moment, pour un geste qui se termine (sans abonnement). */
export const reduceMotionNow = () => reduced;

/** La valeur suivie, pour un composant qui anime. */
export function useReducedMotion(): boolean {
  const [v, setV] = useState(reduced);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setV).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setV);
    return () => sub.remove();
  }, []);
  return v;
}
