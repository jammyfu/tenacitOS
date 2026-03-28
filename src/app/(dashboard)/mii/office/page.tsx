'use client';

import { useState, useEffect, useRef } from 'react';
import { MiiAvatar } from '@/components/mii/MiiAvatar';
import type { MiiCharacter } from '@/lib/mii-types';

/* ── palette ── */
const C = {
  floorA:  '#1a1a2e',
  floorB:  '#16213e',
  wall:    '#0f3460',
  wallTop: '#1a4a7a',
  deskTop: '#2a2a4a',
  deskR:   '#1e1e38',
  deskF:   '#222244',
  monBack: '#111122',
  monScr:  '#00ffcc',
  monGlow: 'rgba(0,255,204,0.15)',
  plant:   '#2d5a27',
  plantPot:'#8b4513',
  coffee:  '#3d2b1f',
  steam:   'rgba(200,200,200,0.4)',
};

/* ── isometric helpers ── */
const CELL = 90;   // cell width
const H    = 52;   // cell height (≈ CELL * tan30)

function iso(col: number, row: number) {
  return {
    x: (col - row) * (CELL / 2),
    y: (col + row) * (H   / 2),
  };
}

/* ── desk tile ── */
function Desk({ col, row, hasChar, online }: { col:number; row:number; hasChar:boolean; online?:boolean }) {
  const { x, y } = iso(col, row);
  const w = CELL, h = H, bh = 22; // box height

  // 3 faces: top, right, front
  const top   = `${x},${y-bh} ${x+w/2},${y-bh+h/2} ${x},${y-bh+h} ${x-w/2},${y-bh+h/2}`;
  const right  = `${x+w/2},${y-bh+h/2} ${x},${y-bh+h} ${x},${y} ${x+w/2},${y+h/2}`;
  const front  = `${x-w/2},${y-bh+h/2} ${x},${y-bh+h} ${x},${y} ${x-w/2},${y+h/2}`;

  // monitor on top face, offset slightly
  const mx = x, my = y - bh - 4;
  const monW = 18, monH = 13;
  const monTop  = `${mx},${my-monH} ${mx+monW/2},${my-monH+H/4} ${mx},${my-monH+H/2} ${mx-monW/2},${my-monH+H/4}`;
  const monFront= `${mx-monW/2},${my-monH+H/4} ${mx},${my-monH+H/2} ${mx},${my+H/4} ${mx-monW/2},${my+H/4-H/4}`;

  const dotColor = online === true ? '#00ff88' : online === false ? '#ff8800' : '#555';

  return (
    <g>
      {/* desk body */}
      <polygon points={top}   fill={C.deskTop} stroke="#333" strokeWidth="0.5"/>
      <polygon points={right}  fill={C.deskR}  stroke="#333" strokeWidth="0.5"/>
      <polygon points={front}  fill={C.deskF}  stroke="#333" strokeWidth="0.5"/>
      {/* monitor back */}
      <polygon points={monTop}   fill={C.monBack} stroke="#444" strokeWidth="0.5"/>
      <polygon points={monFront} fill={C.monBack} stroke="#444" strokeWidth="0.5"/>
      {/* screen glow */}
      {hasChar && <polygon points={monTop} fill={C.monGlow}/>}
      {/* status dot */}
      {hasChar && <circle cx={x + 14} cy={y - bh + 4} r={3} fill={dotColor}/>}
    </g>
  );
}

/* ── plant decoration ── */
function Plant({ col, row }: { col:number; row:number }) {
  const { x, y } = iso(col, row);
  return (
    <g>
      <ellipse cx={x} cy={y - 8} rx={14} ry={8}  fill={C.plantPot}/>
      <ellipse cx={x} cy={y - 28} rx={16} ry={18} fill={C.plant}/>
      <ellipse cx={x-8} cy={y-34} rx={10} ry={12} fill={C.plant}/>
      <ellipse cx={x+8} cy={y-34} rx={10} ry={12} fill={C.plant}/>
    </g>
  );
}

/* ── coffee machine ── */
function Coffee({ col, row }: { col:number; row:number }) {
  const { x, y } = iso(col, row);
  return (
    <g>
      <rect x={x-14} y={y-40} width={28} height={36} rx={3} fill={C.coffee}/>
      <rect x={x-8}  y={y-36} width={16} height={10} rx={2} fill="#1a0f0a"/>
      {/* steam */}
      <path d={`M${x-4},${y-42} q4,-6 0,-12`} stroke={C.steam} strokeWidth="2" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>
      </path>
      <path d={`M${x+4},${y-44} q4,-6 0,-12`} stroke={C.steam} strokeWidth="2" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite"/>
      </path>
    </g>
  );
}

/* ── floor tile ── */
function Floor({ col, row }: { col:number; row:number }) {
  const { x, y } = iso(col, row);
  const pts = `${x},${y} ${x+CELL/2},${y+H/2} ${x},${y+H} ${x-CELL/2},${y+H/2}`;
  const shade = (col + row) % 2 === 0 ? C.floorA : C.floorB;
  return <polygon points={pts} fill={shade} stroke="#0a0a1a" strokeWidth="0.3"/>;
}

/* ── desk layout: 12 slots ── */
const DESK_SLOTS = [
  {col:1,row:1},{col:2,row:1},{col:3,row:1},
  {col:5,row:1},{col:6,row:1},{col:7,row:1},
  {col:1,row:4},{col:2,row:4},{col:3,row:4},
  {col:5,row:4},{col:6,row:4},{col:7,row:4},
];

/* ── main scene ── */
export default function OfficePage() {
  const [chars, setChars]   = useState<MiiCharacter[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const COLS = 9, ROWS = 6;

  useEffect(() => {
    fetch('/api/mii').then(r => r.json()).then(d => setChars(d.characters ?? []));
  }, []);

  // SVG viewport
  const svgW = (COLS + ROWS) * (CELL / 2) + CELL;
  const svgH = (COLS + ROWS) * (H   / 2) + 200;
  const ox = ROWS * (CELL / 2) + CELL / 2;  // origin x (left-right center)
  const oy = 60;                              // origin y top padding

  // painter's algorithm: sort by col+row
  type Tile = { key: string; z: number; el: React.ReactNode };
  const tiles: Tile[] = [];

  // floor
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      tiles.push({ key:`f${c}${r}`, z: c+r, el: <Floor key={`f${c}${r}`} col={c} row={r}/> });
    }
  }

  // back wall (simple rect behind all tiles)
  const wallLeft  = iso(0, 0);
  const wallRight = iso(COLS, 0);
  // We'll draw the wall as an SVG rect behind everything — add at z=-1

  // decorations
  tiles.push({ key:'plant0', z: 0+0+0.1, el: <Plant key="plant0" col={0} row={0}/> });
  tiles.push({ key:'plant1', z: COLS-1+0+0.1, el: <Plant key="plant1" col={COLS-1} row={0}/> });
  tiles.push({ key:'coffee', z: 0+ROWS-1+0.1, el: <Coffee key="coffee" col={0} row={ROWS-1}/> });

  // desks + characters
  DESK_SLOTS.forEach((slot, i) => {
    const char = chars[i];
    const online = char ? char.personality === 'energetic' || char.personality === 'cheerful' : undefined;
    tiles.push({
      key: `desk${i}`,
      z: slot.col + slot.row,
      el: (
        <g key={`desk${i}`} onClick={() => setSelected(selected === i ? null : i)} style={{cursor:'pointer'}}>
          <Desk col={slot.col} row={slot.row} hasChar={!!char} online={online}/>
          {char && char.appearance && (() => {
            const { x, y } = iso(slot.col, slot.row);
            return (
              <foreignObject x={x - 19} y={y - 80} width={38} height={38}>
                <div style={{
                  animation: online ? 'floatBob 2s ease-in-out infinite' : 'none',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  width: 38, height: 38,
                  border: selected === i ? '2px solid #00ffcc' : '2px solid transparent',
                  boxSizing: 'border-box',
                }}>
                  <MiiAvatar character={char} size={34}/>
                </div>
              </foreignObject>
            );
          })()}
        </g>
      )
    });
  });

  tiles.sort((a, b) => a.z - b.z);

  const selectedChar = selected !== null ? chars[selected] : null;

  return (
    <div style={{ background:'#050510', minHeight:'100vh', padding:'24px', fontFamily:'monospace' }}>
      <style>{`
        @keyframes floatBob {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes steamRise {
          0%   { opacity:0.8; transform:translateY(0); }
          100% { opacity:0;   transform:translateY(-12px); }
        }
      `}</style>

      <h1 style={{color:'#00ffcc', margin:'0 0 8px', fontSize:22}}>🏢 3D Office — Mii 工位全览</h1>
      <p style={{color:'#667', margin:'0 0 24px', fontSize:13}}>
        {chars.length} 名员工 · 点击人物查看详情
      </p>

      <div style={{
        perspective:'1200px',
        perspectiveOrigin:'50% 30%',
        overflowX:'auto',
        minHeight:'calc(100vh - 140px)',
      }}>
        <svg
          width="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display:'block', margin:'0 auto', transform:'rotateX(6deg)' }}
        >
          <defs>
            <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={C.wallTop}/>
              <stop offset="100%" stopColor={C.wall}/>
            </linearGradient>
          </defs>
          {/* back wall */}
          <rect x={0} y={0}  height={oy + (COLS+ROWS)*(H/2)*0.3}
            fill="url(#wallGrad)" opacity={0.6}/>

          <g transform={`translate(${ox},${oy})`}>
            {tiles.map(t => t.el)}
          </g>
        </svg>
      </div>

      {/* Info card */}
      {selectedChar && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background:'#0f0f2a', border:'1px solid #00ffcc44', borderRadius:12,
          padding:'16px 24px', display:'flex', gap:16, alignItems:'center',
          boxShadow:'0 0 32px rgba(0,255,204,0.15)', zIndex:100, minWidth:320,
        }}>
          <MiiAvatar character={selectedChar} size={56}/>
          <div>
            <div style={{color:'#00ffcc', fontWeight:'bold', fontSize:18}}>{selectedChar.name}</div>
            <div style={{color:'#aaa', fontSize:13, margin:'2px 0'}}>{selectedChar.role}</div>
            {selectedChar.catchphrase && (
              <div style={{color:'#667', fontSize:12, fontStyle:'italic'}}>"{selectedChar.catchphrase}"</div>
            )}
            <div style={{marginTop:8, display:'flex', gap:6, flexWrap:'wrap'}}>
              {selectedChar.personality && (
                <span style={{background:'#1a3a2a', color:'#00cc88', padding:'2px 8px', borderRadius:12, fontSize:11}}>
                  {selectedChar.personality}
                </span>
              )}
              <span style={{background:'#2a1a3a', color:'#cc88ff', padding:'2px 8px', borderRadius:12, fontSize:11}}>
                lv.{selectedChar.level ?? 1}
              </span>
            </div>
          </div>
          <button onClick={() => setSelected(null)}
            style={{position:'absolute', top:8, right:12, background:'none', border:'none',
              color:'#667', cursor:'pointer', fontSize:18}}>×</button>
        </div>
      )}

      {/* Legend */}
      <div style={{position:'fixed', bottom:24, right:24, background:'#0f0f2a88',
        border:'1px solid #333', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#667'}}>
        <div style={{marginBottom:4, color:'#aaa'}}>状态图例</div>
        {[['#00ff88','在线'],['#ff8800','离开'],['#555','离线']].map(([c,l])=>(
          <div key={l} style={{display:'flex', alignItems:'center', gap:6, marginBottom:2}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:c}}/>
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
