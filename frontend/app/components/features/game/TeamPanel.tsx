'use client';

import React from 'react';
import type { Hero } from '@/lib/gameData';
import { useTranslation } from '@/lib/i18n';

interface TeamPanelProps {
  side: 'left' | 'right';
  bans: number[];
  picks: number[];
  name?: string;
  isEditable?: boolean;
  onNameChange?: (name: string) => void;
  // If true, visual rendering should flip colors/icons (used when global swapSides is active)
  isVisuallyLeft?: boolean;
  heroes: Hero[];
}

export default function TeamPanel({ side, bans, picks, name, isEditable = false, onNameChange, isVisuallyLeft, heroes }: TeamPanelProps) {
  const { t } = useTranslation();
  // Determine visual side: if `isVisuallyLeft` is provided use it, otherwise derive from logical `side`.
  const isLeft = typeof isVisuallyLeft === 'boolean' ? isVisuallyLeft : side === 'left';
  const borderColor = isLeft ? 'border-blue-600' : 'border-red-600';
  const teamColor = isLeft ? 'text-blue-400' : 'text-red-400';
  const defaultName = isLeft ? t('team_blue') : t('team_red');
  const teamName = name ? `${isLeft ? '🔵' : '🔴'} ${name}` : defaultName;
  // Add color transition helper class so color/border changes animate when swap occurs

  return (
    <div className={`bg-gray-800 border ${borderColor} rounded-lg p-4 team-panel-color-transition`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-xl font-bold ${teamColor}`}>{teamName}</h3>
        {isEditable ? (
            <input
            value={name ?? ''}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder={t('team_placeholder')}
            className="ml-2 bg-gray-700/50 border border-gray-600 text-sm text-white rounded px-2 py-1"
          />
        ) : null}
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">{t('ban')} ({bans.length}):</h4>
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
        <h4 className="text-sm font-semibold text-gray-400 mb-2">{t('pick')} ({picks.length}):</h4>
        <div className="flex flex-wrap gap-2 min-h-8">
          {picks.map((id) => {
            const hero = heroes.find(h => h.id === id);
            const pickClass = isLeft ? 'bg-blue-600 text-white' : 'bg-red-600 text-white';
            return (
              <div key={id} className={`${pickClass} px-3 py-1 rounded text-sm font-semibold team-panel-color-transition`}>
                {hero?.name}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
