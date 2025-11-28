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

  const sortedHeroes = [...heroes].sort((a, b) => a.name.localeCompare(b.name));

  const filteredHeroes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedHeroes;
    return sortedHeroes.filter(h => h.name.toLowerCase().includes(q));
  }, [sortedHeroes, search]);

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

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 overflow-y-auto pr-2 flex-1 min-h-0">
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
              className={`relative rounded-lg font-semibold transition-all transform ${statusClass} ${clickable ? 'cursor-pointer' : 'cursor-default'} ${!clickable && status === 'available' ? 'opacity-60' : ''} w-25 h-40 flex items-center justify-center overflow-hidden`}
            >
              <img
                src={`/characters/${hero.name}.webp`}
                alt={hero.name}
                className="w-full h-full object-cover rounded-lg"
                style={{
                  filter: status === 'banned' ? 'grayscale(100%)' :
                          status === 'picked-left' ? 'sepia(100%) hue-rotate(210deg) saturate(2)' :
                          status === 'picked-right' ? 'sepia(100%) hue-rotate(0deg) saturate(2)' :
                          'none'
                }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-sm text-center py-0.5 rounded-b-lg">{hero.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
