'use client';

import React from 'react';
import { Copy, Check, Eye } from 'lucide-react';
import type { Side } from '@/app/types';

interface HeaderProps {
  roomCode: string;
  userSide: Side;
  onExit: () => void;
}

export default function Header({ roomCode, userSide, onExit }: HeaderProps) {
  const [copied, setCopied] = React.useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold text-white">รหัสห้อง:</h2>
        <code className="bg-gray-900 text-blue-400 px-4 py-2 rounded text-lg font-mono">{roomCode}</code>
        <button
          onClick={copyRoomCode}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
          title="คัดลอกรหัสห้อง"
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
      </div>

      <div className="flex items-center space-x-4">
        {userSide === 'spectator' && (
          <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
            <Eye size={16} className="mr-2" />
            โหมดดูการแข่งขัน
          </span>
        )}
        {userSide !== 'spectator' && (
          <span className={`${userSide === 'left' ? 'bg-blue-600' : 'bg-red-600'} text-white px-4 py-2 rounded-full text-sm font-semibold`}>
            {userSide === 'left' ? 'ทีมซ้าย (Blue)' : 'ทีมขวา (Red)'}
          </span>
        )}
        <button
          onClick={onExit}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
        >
          ออก
        </button>
      </div>
    </div>
  );
}
