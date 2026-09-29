// shared gamemode helpers (mirrors getModeIndex in u/[userId]/+page.server.ts
// and updateModeInt in +page.svelte — keep the three in sync).

export const MODE_OPTIONS: { value: number; label: string }[] = [
	{ value: 0, label: 'osu!std' },
	{ value: 1, label: 'osu!taiko' },
	{ value: 2, label: 'osu!catch' },
	{ value: 3, label: 'osu!mania' },
	{ value: 4, label: 'relax std' },
	{ value: 5, label: 'relax taiko' },
	{ value: 6, label: 'relax catch' },
	{ value: 8, label: 'autopilot std' },
	{ value: 12, label: 'cheat std' },
	{ value: 16, label: 'cheatcheat std' },
	{ value: 20, label: 'touch std' }
];

export const VALID_MODES = MODE_OPTIONS.map((o) => o.value);

export function decodePreferredMode(mode: number): { mode: string; type: string } {
	switch (mode) {
		case 12:
			return { mode: 'osu', type: 'cheat' };
		case 16:
			return { mode: 'osu', type: 'cheatcheat' };
		case 20:
			return { mode: 'osu', type: 'touch' };
	}

	let type = 'vanilla';
	let base = mode;
	if (base >= 8) {
		type = 'autopilot';
		base -= 8;
	} else if (base >= 4) {
		type = 'relax';
		base -= 4;
	}

	const modeName = ['osu', 'taiko', 'catch', 'mania'][base] ?? 'osu';
	return { mode: modeName, type };
}
