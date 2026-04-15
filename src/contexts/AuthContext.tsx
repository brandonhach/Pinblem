import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Session } from '@supabase/supabase-js';

const PING_INTERVAL_MS = 60_000;

type AuthContextType = {
	session: Session;
	user: Session['user'] | null;
	loading: boolean;
	profile: { avatar_url: string; username: string; location: string | null } | null;
};

const AuthContext = createContext<AuthContextType>({
	session: null,
	loading: true,
	user: null,
	profile: null,
});


export const AuthProvider = ({ children }) => {
	const [session, setSession] = useState(null);
	const [loading, setLoading] = useState(true);
	const [profile, setProfile] = useState(null);
	const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setLoading(false);
		});

		const { data: listener } = supabase.auth.onAuthStateChange(
			(_event, session) => {
				setSession(session);
			},
		);

		return () => listener.subscription.unsubscribe();
	}, []);

	  useEffect(() => {
			const loadProfile = async () => {
				if (!session?.user?.id) return;

				const { data, error } = await supabase
					.from('users')
					.select('avatar_url, username, location')
					.eq('id', session.user.id)
					.single();
				
				if (!error) {
					setProfile(data);
				}
			};

			loadProfile();
	}, [session]);

	// Presence: keep last_seen_at fresh while the user has the app open
	useEffect(() => {
		const userId = session?.user?.id;
		if (pingInterval.current) clearInterval(pingInterval.current);
		if (!userId) return;

		const ping = () => {
			supabase
				.from('users')
				.update({ last_seen_at: new Date().toISOString() })
				.eq('id', userId);
		};

		ping();
		pingInterval.current = setInterval(ping, PING_INTERVAL_MS);

		const onVisibility = () => {
			if (document.visibilityState === 'visible') ping();
		};
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			if (pingInterval.current) clearInterval(pingInterval.current);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	}, [session]);

	return (
		<AuthContext.Provider
			value={{ session, loading, user: session?.user, profile }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
