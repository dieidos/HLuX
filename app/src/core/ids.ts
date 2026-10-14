// Des identifiants qui ne se répètent jamais : ni après un retrait (un compteur « nombre + 1 » réécrivait
// l'étape suivante par-dessus une autre), ni d'un profil à l'autre (deux invitations « inv-1 » se mêlaient).
export function freshId(prefix: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  for (let n = used.size + 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!used.has(id)) return id;
  }
}
