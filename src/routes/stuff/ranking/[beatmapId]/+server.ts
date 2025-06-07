import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getRedisClient } from '../../../../hooks.server';
import { getUserFromSession } from '$lib/user';
import { isStaff } from '$lib/privs';

const BEATMAP_STATUS_CHANNEL = 'beatmap:status:updates';

export const POST: RequestHandler = async ({ request, params, cookies }) => {
  try {
    const beatmapId = params.id;
    if (!beatmapId) {
      return json({ status: 'error', message: 'Beatmap ID is required' }, { status: 400 });
    }
    const sessionUser = await getUserFromSession(cookies.get('sessionToken'));
    const hasPermission = isStaff(sessionUser?.priv);

    if (!hasPermission) {
      return json({ 
        status: 'error', 
        message: 'Unauthorized: Staff permission required' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, targetStatus } = body;
    
    if (!action || targetStatus === undefined) {
      return json({ 
        status: 'error', 
        message: 'Action and targetStatus are required' 
      }, { status: 400 });
    }

    const redis = await getRedisClient();

    const beatmapData = await redis.get(`beatmap:${beatmapId}`);
    if (!beatmapData) {
      return json({ 
        status: 'error', 
        message: 'Beatmap not found' 
      }, { status: 404 });
    }
    
    const beatmap = JSON.parse(beatmapData);
    const oldStatus = beatmap.status;

    beatmap.status = targetStatus;
    beatmap.last_update = new Date().toISOString();

    await redis.set(`beatmap:${beatmapId}`, JSON.stringify(beatmap));
 
    const statusEvent = {
      beatmapId,
      title: beatmap.title,
      artist: beatmap.artist,
      creator: beatmap.creator,
      oldStatus,
      newStatus: targetStatus,
      action,
      timestamp: Date.now(),
      updatedBy: 'userId'
    };
    
    await redis.publish(BEATMAP_STATUS_CHANNEL, JSON.stringify(statusEvent));

    await redis.lPush('beatmap:status:history', JSON.stringify({
      ...statusEvent,
      id: beatmapId
    }));

    await redis.lTrim('beatmap:status:history', 0, 99);
    
    return json({
      status: 'success',
      message: `Beatmap ${beatmapId} has been ${action}ed successfully`,
      beatmap: {
        id: beatmapId,
        status: targetStatus
      }
    });
    
  } catch (error) {
    console.error('Error updating beatmap status:', error);
    return json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to update beatmap status'
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ request }) => {
  try {
    const hasPermission = await validateBATPermission(request);
    if (!hasPermission) {
      return json({ 
        status: 'error', 
        message: 'Unauthorized: Permission required to view history' 
      }, { status: 403 });
    }
    
    const redis = await getRedisClient();

    const historyData = await redis.lRange('beatmap:status:history', 0, 19);
    const history = historyData.map(entry => JSON.parse(entry));
    
    return json({
      status: 'success',
      history
    });
    
  } catch (error) {
    console.error('Error fetching status history:', error);
    return json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to fetch status history'
    }, { status: 500 });
  }
};