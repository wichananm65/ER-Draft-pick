'use client';

import React from 'react';
import { Copy, Check, Eye } from 'lucide-react';
import type { Side } from '@/app/types';
import { useTranslation } from '@/lib/i18n';
import LangSelector from './LangSelector';

interface HeaderProps {
  roomCode: string;
  userSide: Side;
  onExit: () => void;
}

export default function Header({ roomCode, userSide, onExit }: HeaderProps) {
  const [copied, setCopied] = React.useState(false);
  const { t } = useTranslation();

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold text-white">{t('room_code_label')}</h2>
        <code className="bg-gray-900 text-blue-400 px-4 py-2 rounded text-lg font-mono">{roomCode}</code>
        <button
          onClick={copyRoomCode}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors"
          title={t('copy_room_code')}
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <LangSelector />
        {userSide === 'spectator' && (
          <span className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
            <Eye size={16} className="mr-2" />
            {t('spectator_mode')}
          </span>
        )}
        {userSide !== 'spectator' && (
          <span className={`${userSide === 'left' ? 'bg-blue-600' : 'bg-red-600'} text-white px-4 py-2 rounded-full text-sm font-semibold`}>
            {userSide === 'left' ? t('left_team_label') : t('right_team_label')}
          </span>
        )}
        <button
          onClick={onExit}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
        >
          {t('exit')}
        </button>
      </div>
    </div>
  );
}
