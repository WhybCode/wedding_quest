type TetrominoCell = readonly [number, number];

const TETROMINO_SHAPES = [
  { color: "var(--bordo)", cells: [[0, 0], [0, 1], [1, 0], [1, 1]] as TetrominoCell[] },
  { color: "var(--gold)", cells: [[0, 1], [0, 2], [1, 0], [1, 1]] as TetrominoCell[] },
  { color: "var(--turquoise)", cells: [[0, 0], [1, 0], [2, 0], [0, 1]] as TetrominoCell[] },
  { color: "var(--blush-vivid)", cells: [[0, 1], [1, 0], [1, 1], [1, 2]] as TetrominoCell[] },
  { color: "var(--blush-vivid)", cells: [[0, 0], [1, 0], [2, 0], [3, 0]] as TetrominoCell[] },
  { color: "var(--gold)", cells: [[0, 0], [1, 0], [2, 0], [2, 1]] as TetrominoCell[] },
] as const;

type Placement = {
  shape: number;
  side: "left" | "right";
  depth: number;
  rotate: number;
  opacity: number;
  top?: string;
  bottom?: string;
};

function hash01(n: number, salt: number) {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const DEPTH_LANES = [0.05, 0.24, 0.46, 0.68, 0.9] as const;

type ZoneSpec = { start: number; end: number; count: number };

const VERTICAL_ZONES: ZoneSpec[] = [
  { start: 0, end: 24, count: 18 },
  { start: 24, end: 58, count: 20 },
  { start: 58, end: 97, count: 14 },
];

function buildPlacements(): Placement[] {
  const out: Placement[] = [];
  let idx = 0;

  for (const zone of VERTICAL_ZONES) {
    for (let j = 0; j < zone.count; j++) {
      const span = zone.end - zone.start;
      const baseTop =
        zone.count === 1
          ? zone.start + span * 0.5
          : zone.start + (j / (zone.count - 1)) * span;
      const jitter = (hash01(idx, 1) - 0.5) * Math.min(1.6, span / zone.count * 0.35);
      const top = Math.max(0, Math.min(97.5, baseTop + jitter));
      const side: "left" | "right" = idx % 2 === 0 ? "left" : "right";
      const depth = DEPTH_LANES[(idx + Math.floor(j / 2)) % DEPTH_LANES.length];

      out.push({
        shape: idx % TETROMINO_SHAPES.length,
        top: `${top}%`,
        side,
        depth,
        rotate: Math.round(hash01(idx, 2) * 48 - 24 + (idx % 3) * 16),
        opacity: 0.34 + hash01(idx, 3) * 0.18,
      });

      idx += 1;
    }
  }

  return out;
}

const TETRIS_BG_PLACEMENTS = buildPlacements();

function TetrominoPiece({
  color,
  cells,
  className = "",
}: {
  color: string;
  cells: readonly TetrominoCell[];
  className?: string;
}) {
  const cols = cells.map(([, c]) => c);
  const rows = cells.map(([r]) => r);
  const minC = Math.min(...cols);
  const maxC = Math.max(...cols);
  const minR = Math.min(...rows);
  const maxR = Math.max(...rows);
  const gridCols = maxC - minC + 1;
  const gridRows = maxR - minR + 1;

  return (
    <div
      className={`tetris-bg-grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${gridCols}, var(--tetris-bg-cell))`,
        gridTemplateRows: `repeat(${gridRows}, var(--tetris-bg-cell))`,
      }}
      aria-hidden
    >
      {cells.map(([r, c], i) => (
        <div
          key={i}
          className="tetris-bg-cell"
          style={{
            gridColumn: c - minC + 1,
            gridRow: r - minR + 1,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

export function TetrisBackground() {
  return (
    <div className="tetris-bg" aria-hidden>
      {TETRIS_BG_PLACEMENTS.map((piece, i) => {
        const shape = TETROMINO_SHAPES[piece.shape];
        const fromBottom = piece.bottom != null;
        return (
          <div
            key={i}
            className={`tetris-bg-piece tetris-bg-piece--${piece.side}${fromBottom ? " tetris-bg-piece--from-bottom" : ""}`}
            style={{
              ...(fromBottom ? { bottom: piece.bottom } : { top: piece.top }),
              ["--piece-depth" as string]: piece.depth,
              transform: `rotate(${piece.rotate}deg)`,
              opacity: piece.opacity,
            }}
          >
            <TetrominoPiece color={shape.color} cells={shape.cells} />
          </div>
        );
      })}
    </div>
  );
}
