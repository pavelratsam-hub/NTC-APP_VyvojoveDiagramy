# Aplikace pro tvorbu vývojových diagramů

Webová aplikace pro vizuální tvorbu vývojových diagramů s exportem do JSON, PNG a PDF.

## Instalace a spuštění

```bash
npm install
npm run dev
```

Aplikace se spustí na `http://localhost:5173`.

```bash
npm run build     # produkční build do dist/
npm run preview   # náhled produkčního buildu
```

## Funkce

### Tvary
| Typ | Popis | Použití |
|-----|-------|---------|
| **Akce** | Obdélník | Operace, příkaz, krok procesu |
| **Podmínka** | Kosočtverec | Rozhodování, větvení (Ano/Ne) |
| **Start/Konec** | Zaoblený obdélník | Začátek nebo konec procesu |
| **Oblast** | Obdélník (kontejner) | Vizuální seskupení tvarů |

### Spojnice
| Typ | Popis |
|-----|-------|
| **Step** | Lomená čára pod 90° (výchozí) |
| **Straight** | Rovná čára |

- Šipky na konci spojnic
- Label na spojnici (dvojklik pro editaci)
- Styl čáry: plná / čárkovaná

### Vytváření tvarů (click-to-place)
1. Klikni na nástroj v toolbaru (tlačítko se zvýrazní, kurzor se změní na crosshair)
2. **Klik na plátno** = tvar s výchozí velikostí na pozici kliknutí
3. **Tažení na plátně** = tvar s velikostí podle tažení (s vizuálním náhledem)
4. Nástroj se po vložení automaticky deaktivuje
5. ESC nebo opětovný klik na tlačítko zruší výběr nástroje

### Editace
- Dvojklik na tvar = editace textu
- Dvojklik na spojnici = editace labelu
- Shift+Enter = nový řádek v textu
- Enter = potvrdit editaci
- Změna velikosti tvarů tažením za rohy
- Barevné palety pro tvary
- Popis/poznámka u tvarů (ActionNode)

### Papír a mřížka
- Formáty: A4, A5, vlastní rozměry (mm)
- Orientace: na výšku / na šířku
- Vizuální hranice stránky (čárkovaný rámeček)
- Volitelná mřížka s přichytáváním (20px)
- Ve výchozím stavu skryté, zapnou se v toolbaru

### Export a import
- **Export PNG** - rastrový obrázek oblasti papíru
- **Export PDF** - PDF s korektními rozměry papíru
- **Export JSON** - kompletní uložení diagramu (tvary, spojnice, nastavení)
- **Import JSON** - načtení dříve exportovaného diagramu

### Autosave
Diagram se automaticky ukládá do `localStorage` (s debounce 500ms). Při příštím otevření se obnoví poslední stav.

## Klávesové zkratky

| Klávesa | Akce |
|---------|------|
| `Delete` / `Backspace` | Smazat vybrané prvky |
| `Ctrl+C` | Kopírovat vybrané tvary |
| `Ctrl+V` | Vložit kopie (posun +20px) |
| `Escape` | Zrušit aktivní nástroj / editaci |
| `Enter` | Potvrdit editaci textu |
| `Shift+Enter` | Nový řádek v textu |
| `Shift` + tažení rohů | Zachovat poměr stran při resize |
| Kolečko myši | Zoom |
| Tažení levým/prostředním tl. | Pan (posun plátna) |
| Shift + tažení | Výběr více prvků |

## Ovládání myší

| Akce | Ovládání |
|------|----------|
| Přesunout tvar | Táhnout myší |
| Propojit tvary | Táhnout z úchytu (kolečko na okraji) na úchyt jiného tvaru |
| Výběr oblasti | Shift + tažení na prázdném místě |
| Zoom | Kolečko myši |
| Pan | Levé/prostřední tlačítko na prázdném místě |

## Struktura projektu

```
src/
├── main.tsx                    # Entry point (ReactFlowProvider)
├── App.tsx                     # Hlavní komponenta (stav, logika, ReactFlow)
├── App.css                     # Layout, crosshair, drag preview
├── index.css                   # Globální styly + Tailwind
├── types/
│   └── diagram.ts              # TypeScript typy (Node, Edge, Paper, barvy)
├── components/
│   ├── Toolbar/
│   │   ├── Toolbar.tsx         # Panel nástrojů (tvary, nastavení, export)
│   │   └── Toolbar.css
│   ├── Nodes/
│   │   ├── ActionNode.tsx      # Obdélník
│   │   ├── DecisionNode.tsx    # Kosočtverec
│   │   ├── StartEndNode.tsx    # Zaoblený obdélník
│   │   ├── AreaNode.tsx        # Oblast/kontejner
│   │   ├── nodeTypes.ts        # Mapování typů
│   │   └── Nodes.css
│   ├── Edges/
│   │   ├── CustomEdge.tsx      # Rovná spojnice
│   │   ├── StepEdge.tsx        # Lomená spojnice (90°)
│   │   ├── edgeTypes.ts        # Mapování typů + výchozí nastavení
│   │   └── Edges.css
│   └── Paper/
│       ├── PaperBoundary.tsx   # Vizuální hranice papíru
│       └── Paper.css
└── hooks/
    └── useResizeModifiers.ts   # Hook pro Shift resize (zachování poměru stran)
```

## Technologie

| Knihovna | Verze | Účel |
|----------|-------|------|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Typový systém |
| Vite | 6.0 | Build tool + dev server |
| @xyflow/react | 12.3 | Diagramová knihovna (React Flow) |
| Tailwind CSS | 3.4 | Utility-first CSS |
| html-to-image | 1.11 | Export do PNG |
| jsPDF | 4.1 | Export do PDF |
