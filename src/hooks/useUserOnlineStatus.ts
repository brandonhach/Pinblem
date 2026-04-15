import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

/** A user is considered online if they pinged within the last 2 minutes. */
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export function isUserOnline(lastSeenAt: string | null | undefined): boolean {
	if (!lastSeenAt) return false;
	return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

/**
 * Fetches and subscribes to a user's last_seen_at in real-time.
 * Returns { online, lastSeenAt, loading }.
 */
export function useUserOnlineStatus(userId: string | null | undefined) {
	const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!userId) {
			setLoading(false);
			return;
		}

		supabase
			.from('users')
			.select('last_seen_at')
			.eq('id', userId)
			.single()
			.then(({ data }) => {
				setLastSeenAt(data?.last_seen_at ?? null);
				setLoading(false);
			});

		const channel = supabase
			.channel(`presence:${userId}`)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'users',
					filter: `id=eq.${userId}`,
				},
				(payload) => {
					setLastSeenAt(payload.new.last_seen_at ?? null);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [userId]);

	return { online: isUserOnline(lastSeenAt), lastSeenAt, loading };
}
