// ======================================
// lib/gameData.ts
// ======================================
export interface Hero {
  id: number;
  name: string;
  color?: string;
}

export interface Phase {
  step: number;
  side: "left" | "right";
  action: "ban" | "pick";
  count: number;
  desc: string;
}

export async function getHeroes(): Promise<Hero[]> {
  const res = await fetch('https://open-api.bser.io/v2/data/Character', {
    headers: {
      'x-api-key': 'JoQtxoAOrJ7qmu4eigl81GKDF8lwmnL71jCMHzKh'
    }
  });
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.data.map((h: any) => ({ id: h.code, name: h.name }));
}

export const phases: Phase[] = [
  { step: 1, side: "left", action: "ban", count: 2, desc: "ban_2" },
  { step: 2, side: "right", action: "ban", count: 2, desc: "ban_2" },
  { step: 3, side: "left", action: "pick", count: 1, desc: "pick_1" },
  { step: 4, side: "right", action: "pick", count: 2, desc: "pick_2" },
  { step: 5, side: "left", action: "pick", count: 1, desc: "pick_1" },
  { step: 6, side: "left", action: "ban", count: 2, desc: "ban_2" },
  { step: 7, side: "right", action: "ban", count: 2, desc: "ban_2" },
  { step: 8, side: "right", action: "pick", count: 1, desc: "pick_1" },
  { step: 9, side: "left", action: "pick", count: 2, desc: "pick_2" },
  { step: 10, side: "right", action: "pick", count: 1, desc: "pick_1" },
];
