'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';
import type { Hero } from '@/lib/gameData';

interface SavedRound {
  game: number;
  leftName: string;
  rightName: string;
  leftBans: number[];
  rightBans: number[];
  leftPicks: number[];
  rightPicks: number[];
  timestamp: number;
}

interface HistoryModalProps {
  showHistory: boolean;
  onClose: () => void;
  savedRounds: SavedRound[];
  heroes: Hero[];
}

export default function HistoryModal({ showHistory, onClose, savedRounds, heroes }: HistoryModalProps) {
  const { t } = useTranslation();

  if (!showHistory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-[92vw] max-w-4xl max-h-[82vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700">
          <div className="text-white font-semibold">{t('saved_games')}</div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-auto max-h-[72vh]">
          {savedRounds.length === 0 ? (
            <div className="text-gray-400 text-sm">{t('no_saved')}</div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedRounds.map((r, idx) => {
                const leftBansNames = r.leftBans
                  .map((id: number) => heroes.find((h) => h.id === id)?.name)
                  .filter(Boolean);
                const rightBansNames = r.rightBans
                  .map((id: number) => heroes.find((h) => h.id === id)?.name)
                  .filter(Boolean);
                const leftPicksNames = r.leftPicks
                  .map((id: number) => heroes.find((h) => h.id === id)?.name)
                  .filter(Boolean);
                const rightPicksNames = r.rightPicks
                  .map((id: number) => heroes.find((h) => h.id === id)?.name)
                  .filter(Boolean);
                return (
                  <div key={idx} className="bg-gray-800/70 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300 font-semibold">
                        {t('game_round', { num: r.game, left: r.leftName, right: r.rightName })}
                      </div>
                      {r.timestamp ? (
                        <div className="text-xs text-gray-500">
                          {new Date(r.timestamp).toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div className="bg-gray-900/50 rounded p-2">
                        <div className="text-xs text-gray-400">{`${t('ban')} (🔵)`}</div>
                        <div className="text-sm text-gray-200 wrap-break-word">
                          {leftBansNames.length ? leftBansNames.join(', ') : '-'}
                        </div>
                      </div>
                      <div className="bg-gray-900/50 rounded p-2">
                        <div className="text-xs text-gray-400">{`${t('ban')} (🔴)`}</div>
                        <div className="text-sm text-gray-200 wrap-break-word">
                          {rightBansNames.length ? rightBansNames.join(', ') : '-'}
                        </div>
                      </div>
                      <div className="bg-gray-900/50 rounded p-2">
                        <div className="text-xs text-gray-400">{`${t('pick')} (🔵)`}</div>
                        <div className="text-sm text-gray-200 wrap-break-word">
                          {leftPicksNames.length ? leftPicksNames.join(', ') : '-'}
                        </div>
                      </div>
                      <div className="bg-gray-900/50 rounded p-2">
                        <div className="text-xs text-gray-400">{`${t('pick')} (🔴)`}</div>
                        <div className="text-sm text-gray-200 wrap-break-word">
                          {rightPicksNames.length ? rightPicksNames.join(', ') : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}