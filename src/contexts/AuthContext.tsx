import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
	session: Session;
	user: Session['user'] | null;
	loading: boolean;
	profile: { avatar_url: string; username: string } | null;
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
					.select('avatar_url, username')
					.eq('id', session.user.id)
					.single();
				
				if (!error) {
					setProfile(data);
				}
			};

			loadProfile();
		}, [session]);

	return (
		<AuthContext.Provider
			value={{ session, loading, user: session?.user, profile }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
