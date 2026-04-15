import { useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const PING_INTERVAL_MS = 60_000; // ping every 60 s

/**
 * Keeps the current user's last_seen_at fresh while they have the app open.
 * - Pings immediately on mount
 * - Pings every 60 s
 * - Pings again whenever the tab regains focus (covers phone lock / tab switching)
 *
 * Mount this once at the app root (AuthContext / App). It's a no-op when
 * the user is not logged in.
 */
export function usePresence() {
	const { user } = useAuth();

	useEffect(() => {
		if (!user) return;

		const ping = () => {
			supabase
				.from('users')
				.update({ last_seen_at: new Date().toISOString() })
				.eq('id', user.id);
		};

		ping();
		const interval = setInterval(ping, PING_INTERVAL_MS);

		const onVisibility = () => {
			if (document.visibilityState === 'visible') ping();
		};
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	}, [user]);
}
