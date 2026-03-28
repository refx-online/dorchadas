export type MapInfo = {
	status: 'success' | string;
	map: {
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

export type PlayerMostPlayed = {
	status: 'success' | string;
	maps: {
		md5: string;
		id: number;
		set_id: number;
		status: number;
		artist: string;
		title: string;
		version: string;
		creator: string;
		plays: number;
	}[];
};
