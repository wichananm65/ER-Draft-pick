
// Simple i18n helper (TH / EN)
import { useCallback, useEffect, useState } from 'react';

type Lang = 'th' | 'en';

const STORAGE_KEY = 'er_draft_lang';

// Deterministic server-side default to avoid SSR/client hydration mismatches
const defaultLang: Lang = 'en';

const translations: Record<Lang, Record<string, string>> = {
	th: {
		waiting_for_players: 'รอผู้เล่นพร้อม',
		ready: 'พร้อม',
		waiting_opponent: 'รอฝั่งตรงข้าม...',
		start_in: 'เริ่มใน',
		save_game: 'บันทึกเกมนี้',
		saved_games: 'ประวัติเกมที่บันทึกไว้',
		no_saved: 'ยังไม่มีการบันทึก',
		baning: 'กำลังแบนตัวละคร',
		picking: 'กำลังเลือกตัวละคร',
		seconds: 'วินาที',
		restart_game: 'เริ่มเกมใหม่',
		save_results: 'บันทึกผลเกมนี้',
		finished: 'การเลือกเสร็จสิ้น',
		last_action_none: 'ยังไม่มีการกระทำล่าสุด',
		pick: 'เลือก',
		ban: 'แบน',
		history_button: 'ประวัติเกม',
		unknown_hero: 'ไม่ทราบชื่อ',
		team_placeholder: 'กรอกชื่อทีม',
		team_blue: '🔵 ทีม (Blue)',
		team_red: '🔴 ทีม (Red)',
		game_round: 'เกมที่ {num} — {left} vs {right}',
		characters_label: 'ตัวละคร',
		search_placeholder: 'ค้นหาตัวละคร',
		create_room: 'สร้างห้องใหม่',
		you_are_blue: 'คุณจะเป็นผู้เล่น 🔵 (Blue)',
		or: 'หรือ',
		enter_code_placeholder: 'ใส่รหัสห้อง...',
		join: 'เข้าร่วม',
		spectate: 'ดู',
		create_room_failed: 'ไม่สามารถสร้างห้องได้ กรุณาลองใหม่อีกครั้ง',
		no_left_player: 'ห้องนี้ยังไม่มีผู้เล่นฝั่ง 🔵 กรุณาตรวจสอบรหัสห้อง',
		room_full: 'ห้องเต็มแล้ว! มีผู้เล่นครบ 2 คนแล้ว กรุณาเข้าเป็น Spectator แทน',
		join_failed: 'ไม่สามารถเข้าร่วมห้องได้ กรุณาตรวจสอบรหัสห้อง',
		room_missing: 'ห้องนี้ยังไม่มีผู้เล่น กรุณาตรวจสอบรหัสห้อง',
		cannot_spectate: 'ไม่สามารถเข้าดูห้องได้',
		cannot_watch: 'ไม่สามารถดูการแข่งขันได้ กรุณาตรวจสอบรหัสห้อง',
		room_code_label: 'รหัสห้อง:',
		copy_room_code: 'คัดลอกรหัสห้อง',
		language_th: 'ภาษาไทย',
		language_en: 'English',
		ban_2: 'แบน 2',
		pick_1: 'เลือก 1',
		pick_2: 'เลือก 2',
		spectator_mode: 'ผู้เข้าชม',
		left_team_label: 'ทีมซ้าย (Blue)',
		right_team_label: 'ทีมขวา (Red)',
		exit: 'ออก',
	},
	en: {
		waiting_for_players: 'Waiting for players',
		ready: 'Ready',
		waiting_opponent: 'Waiting for opponent...',
		start_in: 'Starts in',
		save_game: 'Save this game',
		saved_games: 'Saved rounds',
		no_saved: 'No saved rounds',
		baning: 'Banning a hero',
		picking: 'Picking a hero',
		seconds: 's',
		restart_game: 'Restart game',
		save_results: 'Save results',
		finished: 'Draft complete',
		last_action_none: 'No recent action',
		pick: 'Pick',
		ban: 'Ban',
		history_button: 'History',
		unknown_hero: 'Unknown',
		team_placeholder: 'Enter team name',
		team_blue: '🔵 Team (Blue)',
		team_red: '🔴 Team (Red)',
		game_round: 'Game {num} — {left} vs {right}',
		characters_label: 'Characters',
		search_placeholder: 'Search heroes',
		create_room: 'Create room',
		you_are_blue: 'You will be Player 🔵 (Blue)',
		or: 'or',
		enter_code_placeholder: 'Enter room code...',
		join: 'Join',
		spectate: 'Spectate',
		create_room_failed: 'Failed to create room, please try again',
		no_left_player: 'This room has no Blue player yet — please check the code',
		room_full: 'Room is full! Two players already — join as Spectator instead',
		join_failed: 'Failed to join room, please check the code',
		room_missing: 'This room has no players yet — please check code',
		cannot_spectate: "Can't enter as spectator",
		cannot_watch: "Can't watch match — check the room code",
		room_code_label: 'Room code:',
		copy_room_code: 'Copy room code',
		language_th: 'Thai',
		language_en: 'English',
		ban_2: 'Ban 2',
		pick_1: 'Pick 1',
		pick_2: 'Pick 2',
		spectator_mode: 'Spectator',
		left_team_label: 'Left team (Blue)',
		right_team_label: 'Right team (Red)',
		exit: 'Exit',
	},
};

export function getLang(): Lang {
	if (typeof window === 'undefined') return defaultLang;
	try {
		return (localStorage.getItem(STORAGE_KEY) as Lang) || defaultLang;
	} catch {
		return defaultLang;
	}
}

export function setLang(lang: Lang) {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, lang);
		try {
			window.dispatchEvent(new Event('er_lang_change'));
		} catch {
			// ignore in non-browser contexts
		}
	}
}

// Basic interpolation: replace {name} in strings with values
function interpolate(template: string, vars?: Record<string, string | number>) {
	if (!vars) return template;
	return template.replace(/\{([^}]+)\}/g, (_, key) => String(vars[key.trim()] ?? ''));
}

export function t(key: string, vars?: Record<string, string | number>, lang?: Lang) {
	const useLang = lang || getLang();
	const dict = translations[useLang] || translations.th;
	const txt = dict[key] ?? key;
	return interpolate(txt, vars);
}

// React hook for translations
export function useTranslation() {
	// Start with the deterministic server default to avoid hydration mismatch.
	// Sync the real stored preference after mount.
	const [lang, setLangState] = useState<Lang>(() => defaultLang);

	useEffect(() => {
		const onStorage = () => setLangState(getLang());
		// Listen to cross-tab storage events (other windows) and a custom event for same-window updates
		window.addEventListener('storage', onStorage);
		window.addEventListener('er_lang_change', onStorage);

		// Sync once after mount to pick up persisted preference without causing SSR mismatch
		onStorage();

		return () => {
			window.removeEventListener('storage', onStorage);
			window.removeEventListener('er_lang_change', onStorage);
		};
	}, []);

	const setLanguage = useCallback((l: Lang) => {
		setLang(l);
		setLangState(l);
	}, []);

	const translate = useCallback((key: string, vars?: Record<string, string | number>) => t(key, vars, lang), [lang]);

	return { t: translate, lang, setLang: setLanguage } as const;
}

export default t;

// export translation key type for safety
export type TranslationKey = keyof typeof translations['th'];

