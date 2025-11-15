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
  onSave?: () => void;
  startCountdown?: number | null;
  actionTimer?: number | null;
  readyToStartLeft?: boolean;
  readyToStartRight?: boolean;
  onReadyToStart?: () => void;
  isStarted?: boolean;
  restartReadyLeft?: boolean;
  restartReadyRight?: boolean;
  swapSides?: boolean;
}

export default function PhaseInfo({
  currentPhaseData,
  actionCount,
  isGameOver,
  onReset,
  userSide,
  startCountdown,
  actionTimer,
  onSave,
  readyToStartLeft = false,
  readyToStartRight = false,
  onReadyToStart,
  isStarted = false,
  restartReadyLeft = false,
  restartReadyRight = false
  , swapSides = false
}: PhaseInfoProps) {
  // Visual mapping: when swapped, the left visual slot represents logical right team
  const visualReadyToStartLeft = swapSides ? readyToStartRight : readyToStartLeft;
  const visualReadyToStartRight = swapSides ? readyToStartLeft : readyToStartRight;
  const visualRestartReadyLeft = swapSides ? restartReadyRight : restartReadyLeft;
  const visualRestartReadyRight = swapSides ? restartReadyLeft : restartReadyRight;

  const userIsVisuallyLeft = swapSides ? userSide === 'right' : userSide === 'left';
  const restartButtonColorClass = userIsVisuallyLeft ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700';
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 text-center">
      {!isStarted && startCountdown == null ? (
        <>
          <h3 className="text-2xl font-bold text-white mb-2">รอผู้เล่นพร้อม</h3>
          {userSide !== 'spectator' && (
            <button
              onClick={onReadyToStart}
              className={`px-6 py-2 rounded-lg transition-colors ${
                (userSide === 'left' && readyToStartLeft) || (userSide === 'right' && readyToStartRight)
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white mt-3`}
              disabled={(userSide === 'left' && readyToStartLeft) || (userSide === 'right' && readyToStartRight)}
            >
              {(userSide === 'left' && readyToStartLeft) || (userSide === 'right' && readyToStartRight)
                ? 'รอฝั่งตรงข้าม...'
                : 'พร้อม'}
            </button>
          )}
          {(visualReadyToStartLeft || visualReadyToStartRight) && (
            <div className="mt-3 text-sm text-gray-300">
              <div className="flex items-center justify-center gap-4">
                <span className={visualReadyToStartLeft ? 'text-green-400' : 'text-gray-500'}>
                  {visualReadyToStartLeft ? '✓' : '○'} 🔵
                </span>
                <span className={visualReadyToStartRight ? 'text-green-400' : 'text-gray-500'}>
                  {visualReadyToStartRight ? '✓' : '○'} 🔴
                </span>
              </div>
            </div>
          )}
        </>
      ) : !isGameOver && currentPhaseData ? (
        <>
          <h3 className="text-2xl font-bold text-white mb-2">
            {currentPhaseData.desc} ({actionCount}/{currentPhaseData.count})
          </h3>
          <p className="text-gray-400">
            {currentPhaseData.side === 'left' ? '🔵' : '🔴'} -
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

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={onSave}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
            >
              บันทึกเกมนี้
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-3xl font-bold text-green-400 mb-2">✓ การเลือกเสร็จสิ้น</h3>
          {startCountdown != null && (
            <div className="mt-2 flex flex-col items-center">
              <div className="text-yellow-300 text-5xl font-extrabold">{startCountdown}</div>
              <div className="text-sm text-yellow-200">เริ่มใน</div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-3 justify-center">
            <button
              onClick={onSave}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-lg"
            >
              บันทึกผลเกมนี้
            </button>
            {userSide !== 'spectator' && (
              <button
                onClick={onReset}
                className={`px-6 py-2 rounded-lg text-white ${
                  (userSide === 'left' && restartReadyLeft) || (userSide === 'right' && restartReadyRight)
                    ? 'bg-gray-500 cursor-not-allowed'
                    : restartButtonColorClass
                }`}
                disabled={(userSide === 'left' && restartReadyLeft) || (userSide === 'right' && restartReadyRight)}
              >
                {(userSide === 'left' && restartReadyLeft) || (userSide === 'right' && restartReadyRight)
                  ? 'รอฝั่งตรงข้าม...'
                  : 'เริ่มเกมใหม่'}
              </button>
            )}
          </div>
          {(visualRestartReadyLeft || visualRestartReadyRight) && (
            <div className="mt-3 text-sm text-gray-300">
              <div className="flex items-center justify-center gap-4">
                <span className={visualRestartReadyLeft ? 'text-green-400' : 'text-gray-500'}>
                  {visualRestartReadyLeft ? '✓' : '○'} 🔵
                </span>
                <span className={visualRestartReadyRight ? 'text-green-400' : 'text-gray-500'}>
                  {visualRestartReadyRight ? '✓' : '○'} 🔴
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
