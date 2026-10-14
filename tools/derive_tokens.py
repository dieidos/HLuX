"""Dérive tokens/tokens.json en app/src/design/tokens.ts et vérifie les contrastes (WCAG AA).

Usage : python tools/derive_tokens.py [--check]
--check : échoue si le fichier dérivé n'est pas à jour, ou si un contraste est sous 4,5:1.
"""
import json, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "tokens" / "tokens.json"
OUT = ROOT / "app" / "src" / "design" / "tokens.ts"


def get(colors, path):
    node = colors
    for part in path.split("."):
        node = node[part]
    return node["value"] if isinstance(node, dict) else node


def lum(hex_):
    h = hex_.lstrip("#")
    def ch(i):
        v = int(h[i:i + 2], 16) / 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(0) + 0.7152 * ch(2) + 0.0722 * ch(4)


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def render(t):
    body = json.dumps({k: t[k] for k in ("color", "font", "size")}, indent=2, ensure_ascii=False)
    return ("// ⛔ FICHIER DÉRIVÉ — ne pas éditer. Source : tokens/tokens.json (tools/derive_tokens.py).\n"
            f"export const tokens = {body} as const;\n")


def main():
    t = json.loads(SRC.read_text(encoding="utf-8"))
    bad = []
    for fg, bg in t["contrast"]:
        r = ratio(get(t["color"], fg), get(t["color"], bg))
        if r < 4.5:
            bad.append(f"{fg} sur {bg} : {r:.2f}:1")
    if bad:
        print("Contrastes insuffisants (AA 4,5:1) :\n  " + "\n  ".join(bad))
        sys.exit(1)
    text = render(t)
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print("tokens.ts n'est pas à jour : lancer python tools/derive_tokens.py")
            sys.exit(1)
        print("tokens OK")
        return
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"écrit {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
