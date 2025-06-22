import type { Mod } from './types';

export const mods: { [mod: string]: number } = {
	//diff decrease
	EZ: 1 << 1,
	NF: 1 << 0,
	HT: 1 << 8,

	// diff increase
	HR: 1 << 4,
	SD: 1 << 5,
	PF: 1 << 14,
	DT: 1 << 6,
	NC: 1 << 9,
	HD: 1 << 3,
	FL: 1 << 10,

	// other
	SO: 1 << 12,
	TD: 1 << 2,
	V2: 1 << 30,
	RX: 1 << 7,
	AP: 1 << 13
};

export const modNames: { [mod_short: string]: string } = {
	EZ: 'Easy',
	NF: 'No Fail',
	HT: 'Half Time',
	HR: 'Hard Rock',
	SD: 'Sudden Death',
	PF: 'Perfect',
	DT: 'Double Time',
	NC: 'Nightcore',
	HD: 'Hidden',
	FL: 'Flashlight',
	SO: 'Spun Out',
	TD: 'Touch Device',
	V2: 'ScoreV2',
	RX: 'Relax',
	AP: 'Autopilot'
};

export const parseModsInt = (
	modsInt: number | null,
	mods_json?: { acronym: string; settings: Record<string, any> }[]
) => {
	const activatedMods: Mod[] = [];

	if (mods_json?.length) {
		for (const entry of mods_json) {
			const short = entry.acronym;
			activatedMods.push({
				short_name: short,
				name: modNames[short] ?? short,
				settings: entry.settings
			});
		}
		return activatedMods;
	}

	// Check if either DT or SD is present, and if NC or PF is also present
	const hasNC = modsInt! & mods.NC;
	const hasPF = modsInt! & mods.PF;

	for (const mod in mods) {
		// Exclude DT or SD if NC or PF is present
		if (mod == 'DT' && hasNC) {
			continue;
		}
		if (mod == 'SD' && hasPF) {
			continue;
		}

		if (modsInt! & mods[mod]) {
			activatedMods.push({
				name: modNames[mod],
				short_name: mod
			});
		}
	}
	
	// since its stable
	activatedMods.push({
		name: "Classic",
		short_name: "CL"
	});
	
	return activatedMods;
};
