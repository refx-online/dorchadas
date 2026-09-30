// leaderboard taxonomy: two groups (vanilla, cheat) crossed with three
// variants (non-rx, rx, autopilot), each over the vanilla game modes.
// rx excludes mania, autopilot is std-only. keep in sync with the mode
// enums in forlorn (constants/mode.rs), bakenohana (shared/constants/mode.cr),
// recalculate (game_mode.rs) and mist (constants/gamemodes.ts).

export const GAMES = ['osu', 'taiko', 'catch', 'mania'] as const;

export const CATEGORIES = [
	'vanilla',
	'vanilla-rx',
	'vanilla-ap',
	'cheat',
	'cheat-rx',
	'cheat-ap'
] as const;

export type Category = (typeof CATEGORIES)[number];

export const MODE_OPTIONS: { value: number; label: string }[] = [
	{ value: 0, label: 'vanilla std' },
	{ value: 1, label: 'vanilla taiko' },
	{ value: 2, label: 'vanilla catch' },
	{ value: 3, label: 'vanilla mania' },
	{ value: 4, label: 'vanilla-rx std' },
	{ value: 5, label: 'vanilla-rx taiko' },
	{ value: 6, label: 'vanilla-rx catch' },
	{ value: 8, label: 'vanilla-ap std' },
	{ value: 12, label: 'cheat std' },
	{ value: 13, label: 'cheat taiko' },
	{ value: 14, label: 'cheat catch' },
	{ value: 15, label: 'cheat mania' },
	{ value: 21, label: 'cheat-rx std' },
	{ value: 22, label: 'cheat-rx taiko' },
	{ value: 23, label: 'cheat-rx catch' },
	{ value: 24, label: 'cheat-ap std' }
];

export const VALID_MODES = MODE_OPTIONS.map((o) => o.value);

const GAME_INDEX: Record<string, number> = { osu: 0, taiko: 1, catch: 2, mania: 3 };

// game + category to mode id, null when the combo is invalid.
export function encodeCategory(game: string, category: string): number | null {
	const base = GAME_INDEX[game];
	if (base === undefined) return null;
	switch (category) {
		case 'vanilla':
			return base;
		case 'vanilla-rx':
			return base === 3 ? null : base + 4;
		case 'vanilla-ap':
			return base === 0 ? 8 : null;
		case 'cheat':
			return 12 + base;
		case 'cheat-rx':
			return base === 3 ? null : 21 + base;
		case 'cheat-ap':
			return base === 0 ? 24 : null;
		default:
			return null;
	}
}

export function decodeCategory(id: number): { game: string; category: Category } | null {
	const games = ['osu', 'taiko', 'catch', 'mania'];
	if (id >= 0 && id <= 3) return { game: games[id], category: 'vanilla' };
	if (id >= 4 && id <= 6) return { game: games[id - 4], category: 'vanilla-rx' };
	if (id === 8) return { game: 'osu', category: 'vanilla-ap' };
	if (id >= 12 && id <= 15) return { game: games[id - 12], category: 'cheat' };
	if (id >= 21 && id <= 23) return { game: games[id - 21], category: 'cheat-rx' };
	if (id === 24) return { game: 'osu', category: 'cheat-ap' };
	return null;
}

// old ?type= values (vanilla/relax/autopilot/cheat/cheatcheat/touch)
// mapped onto the new categories so old links keep working.
export function normalizeLegacyType(type: string | null | undefined): Category {
	switch (type) {
		case 'relax':
			return 'vanilla-rx';
		case 'autopilot':
			return 'vanilla-ap';
		case 'cheat':
		case 'cheatcheat':
			return 'cheat';
		case 'touch':
		case 'vanilla':
		default:
			return 'vanilla';
	}
}

export function decodePreferredMode(mode: number): { mode: string; type: Category } {
	const decoded = decodeCategory(mode);
	if (!decoded) return { mode: 'osu', type: 'vanilla' };
	return { mode: decoded.game, type: decoded.category };
}

// What each leaderboard category actually means. Cheat/CheatRx/CheatAp
// are the in-client "Shaymi" ranks: plays made with the custom client's
// assist suite (aim assist/correction incl. Maple values, AR changer, CS
// changer, timewarp) instead of plain mods.
export const TYPE_DESCRIPTIONS: Record<string, string> = {
	vanilla: 'Standard play with no assists.',
	'vanilla-rx': 'Relax mod: clicks are automatic, aim is manual.',
	'vanilla-ap': 'Autopilot: aim is automatic, clicks are manual. osu!std only.',
	cheat: 'Shaymi: assisted plays (aim assist/correction, AR/CS changer, timewarp).',
	'cheat-rx': 'Shaymi with relax on top, ranked separately from Cheat.',
	'cheat-ap': 'Shaymi with autopilot on top, osu!std only.'
};
