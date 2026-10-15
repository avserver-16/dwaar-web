import { useMemo } from 'react';

// Copy drawn from the Dwaar README: hyperlocal communities, building-level
// discovery, 500 m / 1 km ranges, rooms, live chat, typing and presence.
// The placards are shown in uppercase via CSS, so write them naturally.
// Keep each under ~22 characters so they stay compact.
const WORDS = [
  // the idea
  'Open the door',
  'Hyperlocal',
  'Around you',
  'Close to home',
  'Local first',
  'Find your people',
  // proximity
  'Your building',
  'Same street',
  'Right next door',
  '500m radius',
  '1km radius',
  'Nearby rooms',
  // community
  'Your neighbours',
  'Your community',
  'Join the room',
  'Start a group',
  'Say hi locally',
  // live
  'Real-time chat',
  'Online now',
  'Typing…',
  'Private message',
  'Group chat',
  'Message history',
  'Share a photo',
  // the door
  'Knock knock',
  'Come on in',
];

// Small seeded PRNG so placards land in the same spots on every render
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// depth 1 = far (small, blurred, dim) ... depth 3 = near (larger, sharper)
const LAYERS = {
  1: { scale: [0.7, 0.85], blur: [2.5, 3.5], opacity: [0.16, 0.24], dur: [70, 95], drift: [14, 26] },
  2: { scale: [0.9, 1.05], blur: [1, 1.6], opacity: [0.26, 0.36], dur: [48, 66], drift: [24, 40] },
  3: { scale: [1.15, 1.35], blur: [0, 0.4], opacity: [0.42, 0.55], dur: [34, 48], drift: [34, 56] },
};

const between = (rand, [a, b]) => a + rand() * (b - a);

export default function FloatingWords({ count = 22, seed = 7 }) {
  const items = useMemo(() => {
    const rand = mulberry32(seed);
    const depths = [1, 1, 1, 1, 2, 2, 2, 3];
    return Array.from({ length: count }, (_, i) => {
      const depth = depths[Math.floor(rand() * depths.length)];
      const L = LAYERS[depth];
      const sign = () => (rand() > 0.5 ? 1 : -1);
      return {
        id: i,
        word: WORDS[i % WORDS.length],
        depth,
        style: {
          '--x': `${(rand() * 92 + 2).toFixed(1)}%`,
          '--y': `${(rand() * 88 + 4).toFixed(1)}%`,
          '--s': between(rand, L.scale).toFixed(2),
          '--blur': `${between(rand, L.blur).toFixed(1)}px`,
          '--op': between(rand, L.opacity).toFixed(2),
          '--dur': `${between(rand, L.dur).toFixed(1)}s`,
          '--delay': `${(-rand() * 60).toFixed(1)}s`,
          '--dx': `${(sign() * between(rand, L.drift)).toFixed(0)}px`,
          '--dy': `${(sign() * between(rand, L.drift)).toFixed(0)}px`,
          '--rot': `${(sign() * (rand() * 5 + 1)).toFixed(1)}deg`,
        },
      };
    });
  }, [count, seed]);

  return (
    <div className="floating-words" aria-hidden="true">
      {items.map(({ id, word, depth, style }) => (
        <span key={id} className={`word-placard depth-${depth}`} style={style}>
          <span className="placard-dot" />
          {word}
        </span>
      ))}
    </div>
  );
}