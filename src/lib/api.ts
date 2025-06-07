import { apiUrl } from './env';
import type {
	Clan,
	getScoreInfo,
	MapInfo,
	MapScores,
	PlayerCounts,
	PlayerMostPlayed,
	PlayerScores,
	PlayerStatus,
	ppProfileHistory,
	rankProfileHistory,
	peakrankProfileHistory,
	User
} from './types';

export const getClan = async (clanId: number): Promise<Clan | undefined> => {
	try {
		const requestedClanData = await fetch(`${apiUrl}/v1/get_clan?id=${clanId}`);
		if (!requestedClanData.ok) return undefined;
		return (await requestedClanData.json()) as Clan;
	} catch {
		return undefined;
	}
};

export const getBeatmap = async (beatmapId: number): Promise<MapInfo | undefined> => {
	try {
		const requestedMapData = await fetch(`${apiUrl}/v1/get_map_info?id=${beatmapId}`);
		if (!requestedMapData.ok) return undefined;
		return (await requestedMapData.json()) as MapInfo;
	} catch {
		return undefined;
	}
};

export const getScoresInfo = async (
	scoreId: number
): Promise<getScoreInfo | undefined> => {
	try {
		const requestedPlayerData = await fetch(`${apiUrl}/v1/get_score_info?id=${scoreId}`);
		if (!requestedPlayerData.ok) return undefined;
		return (await requestedPlayerData.json()) as getScoreInfo;
	} catch {
		return undefined;
	}
};

export const getBeatmapMd5 = async (hash: string): Promise<MapInfo | undefined> => {
	try {
		const requestedMapData = await fetch(`${apiUrl}/v1/get_map_info?md5=${hash}`);
		if (!requestedMapData.ok) return undefined;
		return (await requestedMapData.json()) as MapInfo;
	} catch {
		return undefined;
	}
};

export const getBeatmapScores = async (opts: {
	beatmapMd5: string;
	mode: number;
	scope: 'best' | 'recent';
}): Promise<MapScores | undefined> => {
	try {
		const requestedMapData = await fetch(
			`${apiUrl}/v1/get_map_scores?md5=${opts.beatmapMd5}&mode=${opts.mode}&limit=50&scope=${opts.scope}`
		);
		if (!requestedMapData.ok) return undefined;
		return (await requestedMapData.json()) as MapScores;
	} catch {
		return undefined;
	}
};

export const getPlayerScores = async (opts: {
	userId: number;
	mode: number;
	limit: number;
	offset: number;
	includeLoved?: boolean;
	includeFailed?: boolean;
	scope: 'best' | 'recent' | 'first' | 'pinned';
}): Promise<PlayerScores | undefined> => {
	try {
		const requestedMapData = await fetch(
			`${apiUrl}/v1/get_player_scores?id=${opts.userId}&mode=${opts.mode}&limit=${opts.limit}&offset=${opts.offset}&include_failed=${
				opts.includeFailed ?? true
			}&include_loved=${opts.includeLoved ?? false}&scope=${opts.scope}`
		);
		if (!requestedMapData.ok) return undefined;
		return (await requestedMapData.json()) as PlayerScores;
	} catch {
		return undefined;
	}
};

export const getPlayerMostPlayed = async (opts: {
	userId: number;
	mode: number;
	limit: number;
}): Promise<PlayerMostPlayed | undefined> => {
	try {
		const requestedMapData = await fetch(
			`${apiUrl}/v1/get_player_most_played?id=${opts.userId}&mode=${opts.mode}&limit=${opts.limit}`
		);
		if (!requestedMapData.ok) return undefined;
		return (await requestedMapData.json()) as PlayerMostPlayed;
	} catch {
		return undefined;
	}
};

export const getPlayerCounts = async (): Promise<PlayerCounts | undefined> => {
	try {
		const requestedPlayerData = await fetch(`${apiUrl}/v1/get_player_count`);
		if (!requestedPlayerData.ok) return undefined;
		return (await requestedPlayerData.json()) as PlayerCounts;
	} catch {
		return undefined;
	}
};

export const getPlayerStatus = async (uid: number): Promise<PlayerStatus | undefined> => {
	try {
		const requestedPlayerData = await fetch(`${apiUrl}/v1/get_player_status?id=${uid}`);
		if (!requestedPlayerData.ok) return undefined;
		return (await requestedPlayerData.json()) as PlayerStatus;
	} catch {
		return undefined;
	}
};

export const getPlayer = async (
	uid: number | string,
	scope: 'all' | 'info' | 'stats'
): Promise<User | undefined> => {
	try {
		if (typeof uid === 'number' || /^\d+$/.test(uid)) {
			const byId = await fetch(`${apiUrl}/v1/get_player_info?id=${uid}&scope=${scope}`);
			if (byId.ok) return (await byId.json()) as User;
		}

		const byName = await fetch(`${apiUrl}/v1/get_player_info?name=${encodeURIComponent(uid)}&scope=${scope}`);
		if (byName.ok) return (await byName.json()) as User;

		return undefined;
	} catch {
		return undefined;
	}
};

export const pinScore = async (
	scoreid: number, 
	isPinned: boolean, 
	currentUserId: number, 
	userId: number
) => {
    try {
        const response = await fetch('/stuff/pin-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ scoreid, isPinned, currentUserId, userId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to pin/unpin score');
        }

        return await response.json();
    } catch (error) {
        console.error('Error pinning/unpinning score:', error);
        throw error;
    }
};

export async function sendDiscordWebhookLog(logType: string, message: string, avatarUrl?: string) {
    try {
        const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_LOG_URL;
        if (!webhookUrl) {
            console.error('Discord webhook URL is not set');
            return;
        }

        const payload: Record<string, any> = {
            content: message,
            username: logType
        };

        if (avatarUrl) {
            payload.avatar_url = avatarUrl;
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Failed to send Discord webhook', await response.text());
        }
    } catch (error) {
        console.error('Error sending Discord webhook:', error);
    }
}

type ProfileHistoryResponse = ppProfileHistory | rankProfileHistory | peakrankProfileHistory;

export const getPPProfileHistory = async (
	scope: 'pp' | 'rank' | 'peak',
	uid: number | undefined,
	mode: number
): Promise<ProfileHistoryResponse | undefined> => {
	if (!uid) return undefined;

	try {
		const requestedPlayerData = await fetch(
			`${apiUrl}/v1/get_player_history?scope=${scope}&id=${uid}&mode=${mode}`
		);

		if (!requestedPlayerData.ok) return undefined;

		const data = await requestedPlayerData.json();

		switch (scope) {
			case 'pp':
				return data as ppProfileHistory;
			case 'rank':
				return data as rankProfileHistory;
			case 'peak':
				return data as peakrankProfileHistory;
			default:
				return undefined;
		}
	} catch (error) {
		console.error('Error fetching profile history:', error);
		return undefined;
	}
};