'use client';

import React, { useState } from 'react';
import type { Mode, Side } from '@/app/types';
import MenuContainer from '@/app/components/features/menu/MenuContainer';
import GameRoomContainer from '@/app/components/features/game/GameRoomContainer';

export default function Home() {
  const [mode, setMode] = useState<Mode>('menu');
  const [roomCode, setRoomCode] = useState('');
  const [userSide, setUserSide] = useState<Side>(null);

  const handleCreateRoom = (code: string, side: Side) => {
    setRoomCode(code);
    setUserSide(side);
    setMode('game');
  };

  const handleJoinRoom = (code: string, side: Side) => {
    setRoomCode(code);
    setUserSide(side);
    setMode('game');
  };

  const handleExitRoom = () => {
    setMode('menu');
    setRoomCode('');
    setUserSide(null);
  };

  if (mode === 'menu') {
    return (
      <MenuContainer
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  return (
    <GameRoomContainer
      roomCode={roomCode}
      userSide={userSide}
      onExit={handleExitRoom}
    />
  );
}