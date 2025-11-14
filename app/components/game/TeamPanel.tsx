'use client';

import React from 'react';
import { heroes } from '@/lib/gameData';

interface TeamPanelProps {
  side: 'left' | 'right';
  bans: number[];
  picks: number[];
}

export default function TeamPanel({ side, bans, picks }: TeamPanelProps) {
  const isLeft = side === 'left';
  const borderColor = isLeft ? 'border-blue-600' : 'border-red-600';
  const teamColor = isLeft ? 'text-blue-400' : 'text-red-400';
  const teamName = isLeft ? '🔵 ทีมซ้าย (Blue)' : '🔴 ทีมขวา (Red)';

  return (
    <div className={`bg-gray-800 border ${borderColor} rounded-lg p-4`}>
      <h3 className={`text-xl font-bold ${teamColor} mb-4`}>{teamName}</h3>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">แบน ({bans.length}):</h4>
        <div className="flex flex-wrap gap-2 min-h-8">
          {bans.map((id) => {
            const hero = heroes.find(h => h.id === id);
            return (
              <div key={id} className="bg-gray-700/60 border border-gray-600 px-3 py-1 rounded text-white text-sm">
                {hero?.name}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-400 mb-2">เลือก ({picks.length}):</h4>
        <div className="flex flex-wrap gap-2 min-h-8">
          {picks.map((id) => {
            const hero = heroes.find(h => h.id === id);
            const pickClass = isLeft ? 'bg-blue-600 text-white' : 'bg-red-600 text-white';
            return (
              <div key={id} className={`${pickClass} px-3 py-1 rounded text-sm font-semibold`}>
                {hero?.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
