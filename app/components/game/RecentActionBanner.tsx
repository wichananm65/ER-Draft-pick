 'use client';

import React from 'react';
import type { Hero } from '@/lib/gameData';
import type { Side } from '@/app/types';
import { useTranslation } from '@/lib/i18n';

interface LastAction {
  type: 'pick' | 'ban';
  side: Side;
  heroId: number;
  ts: number;
}

interface Props {
  lastAction: LastAction | null;
  heroes: Hero[];
}

export default function RecentActionBanner({ lastAction, heroes }: Props) {
  const { t } = useTranslation();
  if (!lastAction) {
    return (
      <div className="shrink-0 mt-0 mb-4 w-full flex justify-center">
        <div className="w-full max-w-[640px] px-4 py-2 rounded-2xl flex items-center justify-center">
          <div className="text-gray-400 text-sm">{t('last_action_none')}</div>
        </div>
      </div>
    );
  }

  const hero = heroes.find((h) => h.id === lastAction.heroId);
  const colorClass = lastAction.side === 'left' ? 'bg-blue-500' : 'bg-red-500';
  const verb = lastAction.type === 'pick' ? t('pick') : t('ban');

  return (
    <div className="shrink-0 mt-0 mb-4 w-full flex justify-center">
      <div className="w-full max-w-[640px] px-6 py-3 rounded-2xl flex items-center gap-4 bg-linear-to-br from-gray-800/60 to-gray-900/60 border border-gray-700 shadow-lg backdrop-blur-sm">
        <div className={`w-3.5 h-3.5 rounded-full ${colorClass} shrink-0`} />
        <div className="flex-1 text-center">
          <div className="text-sm text-gray-300 tracking-wide">{verb}</div>
          <div className="text-lg text-white font-semibold mt-0.5">{hero ? hero.name : t('unknown_hero')}</div>
        </div>
        <div className="text-xs text-gray-400 opacity-90">{new Date(lastAction.ts).toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
