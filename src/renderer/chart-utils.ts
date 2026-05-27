export const NUM_POINTS = 300;

function createRNG(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}

export function generateCurve(net: number, numPts: number, seed: number): Float64Array {
  const rng = createRNG(seed);
  const base = new Float64Array(numPts);
  const noise = new Float64Array(numPts);

  for (let i = 0; i < numPts; i++) {
    const t = i / (numPts - 1);
    let rhythm: number;
    if (net > 0) {
      if (t < 0.25) {
        rhythm = Math.pow(t / 0.25, 0.7) * 0.35;
      } else if (t < 0.7) {
        rhythm = 0.35 + (t - 0.25) / 0.45 * 0.5;
      } else {
        rhythm = 0.85 + Math.pow((t - 0.7) / 0.3, 1.6) * 0.15;
      }
      base[i] = net * rhythm;
    } else {
      if (t < 0.25) {
        rhythm = Math.pow(t / 0.25, 0.6) * 0.3;
      } else if (t < 0.65) {
        rhythm = 0.3 + (t - 0.25) / 0.4 * 0.55;
      } else {
        rhythm = 0.85 + Math.pow((t - 0.65) / 0.35, 1.4) * 0.15;
      }
      base[i] = net * rhythm;
    }
    noise[i] = (rng() - 0.5) * Math.abs(net) * 0.02;
  }

  const data = new Float64Array(numPts);
  let cumNoise = 0;
  for (let i = 0; i < numPts; i++) {
    cumNoise += noise[i];
    data[i] = base[i] + cumNoise * 0.03;
  }
  data[0] = 0;
  return data;
}

export function computeCurrentSectorValues(
  sectors: ReadonlyArray<{ net: number; name: string; rate: number; color: string }>,
  frame: number,
  totalFrames: number,
): Array<{ name: string; net: number; rate: number; color: string }> {
  const progress = totalFrames > 0 ? frame / totalFrames : 0;
  const currentIdx = Math.round(progress * (NUM_POINTS - 1));

  return sectors.map((s, i) => {
    const data = generateCurve(s.net, NUM_POINTS, i * 9999 + 42);
    const clampedIdx = Math.min(currentIdx, data.length - 1);
    return {
      name: s.name,
      net: data[clampedIdx],
      rate: s.rate,
      color: s.color,
    };
  });
}
