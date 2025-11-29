"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import MenuContainer from '@/app/components/features/menu/MenuContainer';
import type { Side } from '@/app/types';

export default function MenuPage() {
  const router = useRouter();

  const handleCreateRoom = (code: string, side: Side) => {
    router.push(`/room/${code}?side=${side}`);
  };

  const handleJoinRoom = (code: string, side: Side) => {
    router.push(`/room/${code}?side=${side}`);
  };

  return <MenuContainer onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
}
