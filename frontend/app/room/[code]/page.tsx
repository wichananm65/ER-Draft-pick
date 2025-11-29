"use client";

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GameRoomContainer from '@/app/components/features/game/GameRoomContainer';
import type { Side } from '@/app/types';

interface RoomPageProps {
	params: { code: string };
}

export default function RoomPage({ params }: RoomPageProps) {
	const search = useSearchParams();
	const router = useRouter();
	const sideParam = (search?.get('side') as Side) || null;

	const handleExit = () => {
		router.push('/menu');
	};

	return (
		<GameRoomContainer roomCode={params.code} userSide={sideParam} onExit={handleExit} />
	);
}
