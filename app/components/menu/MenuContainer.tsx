'use client';

import React, { useState } from 'react';
import { Users, Eye, AlertCircle } from 'lucide-react';
import { checkRoomCapacity, registerPlayer, initializeRoom, registerSpectator } from '@/lib/api/storage';
import type { Side } from '@/app/types';

interface MenuContainerProps {
  onCreateRoom: (code: string, side: Side) => void;
  onJoinRoom: (code: string, side: Side) => void;
}

export default function MenuContainer({ onCreateRoom, onJoinRoom }: MenuContainerProps) {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    const code = generateRoomCode();

    try {
      await initializeRoom(code);
      await registerPlayer(code, 'left');
      onCreateRoom(code, 'left');
    } catch {
      setError('ไม่สามารถสร้างห้องได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!inputCode.trim()) return;

    setLoading(true);
    const code = inputCode.toUpperCase();

    try {
      const capacity = await checkRoomCapacity(code);

      if (!capacity.hasLeft) {
        setError('ห้องนี้ยังไม่มีผู้เล่นฝั่ง 🔵 กรุณาตรวจสอบรหัสห้อง');
        setLoading(false);
        return;
      }

      if (capacity.hasRight) {
        setError('ห้องเต็มแล้ว! มีผู้เล่นครบ 2 คนแล้ว กรุณาเข้าเป็น Spectator แทน');
        setLoading(false);
        return;
      }

      await registerPlayer(code, 'right');
      setError('');
      onJoinRoom(code, 'right');
    } catch {
      setError('ไม่สามารถเข้าร่วมห้องได้ กรุณาตรวจสอบรหัสห้อง');
    } finally {
      setLoading(false);
    }
  };

  const handleSpectateRoom = async () => {
    if (!inputCode.trim()) return;

    setLoading(true);
    const code = inputCode.toUpperCase();

    try {
      const capacity = await checkRoomCapacity(code);

      if (!capacity.hasLeft) {
        setError('ห้องนี้ยังไม่มีผู้เล่น กรุณาตรวจสอบรหัสห้อง');
        setLoading(false);
        return;
      }

      const ok = await registerSpectator(code);
      if (!ok) {
        setError('ไม่สามารถเข้าดูห้องได้');
        setLoading(false);
        return;
      }
      setError('');
      onJoinRoom(code, 'spectator');
    } catch {
      setError('ไม่สามารถดูการแข่งขันได้ กรุณาตรวจสอบรหัสห้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 space-y-6">
          <h1 className="text-4xl font-bold text-center text-white mb-8">ER Pick Ban</h1>

          {/* Create Room */}
          <div>
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Users size={20} />
              สร้างห้องใหม่
            </button>
            <p className="text-xs text-gray-400 mt-2">คุณจะเป็นผู้เล่น 🔵 (Blue)</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">หรือ</span>
            </div>
          </div>

          {/* Join/Spectate Room */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="ใส่รหัสห้อง..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-500"
            />

            <div className="flex gap-2">
              <button
                onClick={handleJoinRoom}
                disabled={loading || !inputCode.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                เข้าร่วม
              </button>
              <button
                onClick={handleSpectateRoom}
                disabled={loading || !inputCode.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={18} />
                ดู
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-3 flex gap-2">
              <AlertCircle size={20} className="text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
