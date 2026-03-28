export type UserData = {
	id: number;
	username: string;
	priv: number;
	clanId?: number;
};

export type UserLoginData = {
	username: string;
	password: string;
};

export type DBUser = {
	id: number;
	name: string;
	safe_name: string;
	email: string;
	priv: number;
	pw_bcrypt: string;
	country: string;
	silence_end: number;
	donor_end: number;
	creation_time: number;
	latest_activity: number;
	clan_id: number;
	clan_priv: number;
	userpage_content: string;
	preferred_metric: string;
};

export type LBUser = {
	a_count: number;
	acc: number;
	clan_id: number;
	clan_name: string;
	clan_tag: string;
	country: string;
	max_combo: number;
	name: string;
	player_id: number;
	plays: number;
	playtime: number;
	pp: number;
	xp: number;
	rscore: number;
	s_count: number;
	sh_count: number;
	tscore: number;
	x_count: number;
	xh_count: number;
	latest_activity: number;
};

export type UserModeStats = {
	tscore: number;
	rscore: number;
	pp: number;
	xp: number;
	plays: number;
	playtime: number;
	acc: number;
	max_combo: number;
	xh_count: number;
	x_count: number;
	sh_count: number;
	s_count: number;
	a_count: number;
	replay_views: number;
	rank: number;
	country_rank: number;
};

export type User = {
	status: 'success' | string;
	player?: {
		info: {
			id: number;
			name: string;
			safe_name: string;
			creation_time: number;
			latest_activity: number;
			priv: number;
			clan_id: number;
			country: string;
			preferred_mode: number;
			userpage_content: string;
		};
		stats: {
			[mode: number]: UserModeStats;
		};
	};
};

export interface UserRelationship {
	followers: number;
	relationshipStatus: 'none' | 'follower' | 'known' | 'mutual';
}

export interface UsersLog {
	id: number;
	user_id: number;
	type: 'submit' | 'update' | 'rank' | 'lost';
	type_id: number;
	rank_val: number;
	timestamp: number;
}
