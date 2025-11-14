'use client';

import React from 'react';
import type { Phase } from '@/lib/gameData';
import type { Side } from '@/app/types';

interface PhaseInfoProps {
  currentPhaseData: Phase | null;
  actionCount: number;
  isGameOver: boolean;
  onReset: () => void;
  userSide: Side;
  startCountdown?: number | null;
  actionTimer?: number | null;
}

export default function PhaseInfo({
  currentPhaseData,
  actionCount,
  isGameOver,
  onReset,
  userSide,
  startCountdown,
  actionTimer
}: PhaseInfoProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 text-center">
      {!isGameOver && currentPhaseData ? (
        <>
          <h3 className="text-2xl font-bold text-white mb-2">
            {currentPhaseData.desc} ({actionCount}/{currentPhaseData.count})
          </h3>
          <p className="text-gray-400">
            {currentPhaseData.side === 'left' ? '🔵 ทีมซ้าย' : '🔴 ทีมขวา'} - 
            {currentPhaseData.action === 'ban' ? ' กำลังแบนตัวละคร' : ' กำลังเลือกตัวละคร'}
          </p>
          
          <div className="mt-3 flex flex-col items-center gap-2">
            {startCountdown != null ? (
              <div className="flex flex-col items-center">
                <div className="text-yellow-300 text-6xl font-extrabold">{startCountdown}</div>
                <div className="text-sm text-yellow-200">เริ่มใน</div>
              </div>
            ) : null}

            {actionTimer != null ? (
              <div className="w-full max-w-sm">
                <div className="text-green-300 text-5xl font-extrabold text-center">{actionTimer}s</div>
                <div className="h-2 bg-gray-700 rounded mt-2 overflow-hidden">
                  <div
                    className="h-2 bg-green-400"
                    style={{ width: `${Math.max(0, Math.min(100, Math.round((actionTimer / 60) * 100)))}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <h3 className="text-3xl font-bold text-green-400 mb-2">✓ การเลือกเสร็จสิ้น</h3>
          {userSide !== 'spectator' && (
            <button
              onClick={onReset}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              เริ่มใหม่
            </button>
          )}
        </>
      )}
    </div>
  );
}
