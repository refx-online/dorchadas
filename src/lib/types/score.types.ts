export type ModSetting = Record<string, any>;

export type ModJsonEntry = {
	acronym: string;
	settings: ModSetting;
};

export type MapScore = {
	map_md5: string;
	score: number;
	pp: number;
	acc: number;
	max_combo: number;
	mods: number | null;
	mods_json?: ModJsonEntry[];
	n300: number;
	n100: number;
	n50: number;
	nmiss: number;
	ngeki: number;
	nkatu: number;
	grade: string;
	status: number;
	mode: number;
	play_time: string;
	time_elapsed: number;
	userid: number;
	perfect: number;
	player_name: string;
	player_country: string;
	country?: string; // Deprecated
	clan_id: number;
	clan_name: string;
	clan_tag: string;
	id: number;
};

export type PlayerScore = {
	id: number;
	score: number;
	pp: number;
	acc: number;
	max_combo: number;
	mods: number | null;
	mods_json?: ModJsonEntry[];
	n300: number;
	n100: number;
	n50: number;
	nmiss: number;
	ngeki: number;
	nkatu: number;
	grade: string;
	status: number;
	mode: number;
	play_time: string;
	time_elapsed: number;
	perfect: number;
	pinned: number;
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

export type MapScores = {
	status: 'success' | string;
	scores: MapScore[];
};

export type PlayerScores = {
	status: 'success' | string;
	scores: PlayerScore[];
	player: {
		id: number;
		name: string;
		clan: {
			id: number;
			name: string;
			tag: string;
		};
	};
};

export type TopScore = {
	scoreid: number;
	userid: number;
	pp: number;
	mods: number;
	grade: string;
	set_id: number;
	title: string;
	version: string;
	artist: string;
	country: string;
	username: string;
	map_id: number;
	mods_json: ModJsonEntry[];
};

export type ScoreInfoResponse = {
	status: 'success' | string;
	score: {
		id: number;
		map_md5: string;
		score: number;
		xp_gained: number;
		pp: number;
		acc: number;
		max_combo: number;
		mods: number;
		n300: number;
		n100: number;
		n50: number;
		nmiss: number;
		ngeki: number;
		nkatu: number;
		grade: string;
		status: number;
		mode: number;
		play_time: string;
		time_elapsed: number;
		client_flags: number;
		userid: number;
		perfect: number;
		online_checksum: string;
		aim_value: number;
		ar_value: number;
		aim: number;
		arc: number;
		cs: number;
		tw: number;
		twval: number;
		hdr: number;
		pinned: number;
		mods_json?: ModJsonEntry[];
	};
};

export type ScoreInfo = {
	id: number;
	map_md5: string;
	score: number;
	xp_gained: number;
	pp: number;
	acc: number;
	max_combo: number;
	mods: number;
	n300: number;
	n100: number;
	n50: number;
	nmiss: number;
	ngeki: number;
	nkatu: number;
	grade: string;
	status: number;
	mode: number;
	play_time: string;
	time_elapsed: number;
	client_flags: number;
	userid: number;
	perfect: number;
	online_checksum: string;
	aim_value: number;
	ar_value: number;
	aim: number;
	arc: number;
	cs: number;
	tw: number;
	twval: number;
	hdr: number;
	pinned: number;
};
