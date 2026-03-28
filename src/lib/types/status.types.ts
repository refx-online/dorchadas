import type { ModJsonEntry } from './score.types';

export type PlayerCounts = {
	counts: {
		online: number;
		total: number;
	};
};

export type PlayerStatus = {
	status: 'success' | string;
	player_status: {
		online: boolean;
		last_seen?: number;
		login_time?: number;
		status?: {
			action: number;
			info_text: string;
			mode: number;
			mods: number;
			beatmap: {
				md5: string;
				id: number;
				set_id: number;
				artist: string;
				title: string;
				version: string;
				creator: string;
				last_update: string;
				total_length: number;
				max_combo: number;
				status: number;
				plays: number;
				passes: number;
				mode: number;
				bpm: number;
				cs: number;
				od: number;
				ar: number;
				hp: number;
				diff: number;
			};
		};
	};
};

export type ppProfileHistory = {
	status: 'success' | string;
	data: {
		user_id: number;
		mode: number;
		captures: {
			captured_at: string;
			pp: number;
		}[];
	};
};

export type rankProfileHistory = {
	status: 'success' | string;
	data: {
		user_id: number;
		mode: number;
		captures: {
			captured_at: string;
			overall: number;
			country: number;
		}[];
	};
};

export type peakrankProfileHistory = {
	status: 'success' | string;
	data: {
		user_id: number;
		mode: number;
		captures: {
			captured_at: string;
			rank: number;
		}[];
	};
};
