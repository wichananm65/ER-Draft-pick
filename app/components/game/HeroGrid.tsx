'use client';

import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Hero } from '@/lib/gameData';
import type { HeroStatus } from '@/app/types';

interface HeroGridProps {
  heroes: Hero[];
  getHeroStatus: (heroId: number) => HeroStatus;
  onHeroClick: (heroId: number) => void;
  isClickable: (heroId: number) => boolean;
}

export default function HeroGrid({ heroes, getHeroStatus, onHeroClick, isClickable }: HeroGridProps) {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const filteredHeroes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return heroes;
    return heroes.filter(h => h.name.toLowerCase().includes(q));
  }, [heroes, search]);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col h-full overflow-hidden">
      <h3 className="text-xl font-bold text-white mb-4 text-center shrink-0">{t('characters_label')}</h3>

      <div className="mb-3 shrink-0">
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 flex-1 min-h-0">
        {filteredHeroes.map((hero) => {
          const status = getHeroStatus(hero.id);
          const clickable = isClickable(hero.id);

          let statusClass = 'bg-green-600 hover:scale-105';
          if (status === 'banned') statusClass = 'bg-gray-700 opacity-50 cursor-not-allowed';
          if (status === 'picked-left') statusClass = 'bg-blue-600 ring-2 ring-blue-400';
          if (status === 'picked-right') statusClass = 'bg-red-600 ring-2 ring-red-400';

          return (
            <button
              key={hero.id}
              onClick={() => onHeroClick(hero.id)}
              disabled={!clickable}
              className={`relative p-4 rounded-lg font-semibold transition-all transform ${statusClass} ${clickable ? 'cursor-pointer' : 'cursor-default'} ${!clickable && status === 'available' ? 'opacity-60' : ''}`}
            >
              <span className="text-white">{hero.name}</span>
              {status === 'banned' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-200 text-2xl font-bold">✗</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
