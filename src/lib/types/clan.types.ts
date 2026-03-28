export type DBClan = {
	id: number;
	name: string;
	tag: string;
	owner: number;
	total_pp: number;
	users: number;
};

export type ClanMember = {
	id: number;
	name: string;
	country: string;
	rank: string;
	clan_priv?: number;
};

export type Clan = {
	id: number;
	name: string;
	tag: string;
	members: ClanMember[];
	owner: {
		id: number;
		name: string;
		country: string;
		rank: string;
	};
};
