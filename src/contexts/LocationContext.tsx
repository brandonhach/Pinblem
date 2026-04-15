import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export const ALL_LOCATIONS = 'All Locations';

type LocationContextType = {
	location: string;
	setLocation: (loc: string) => void;
};

const LocationContext = createContext<LocationContextType>({
	location: ALL_LOCATIONS,
	setLocation: () => {},
});

const LS_KEY = 'pinblem_location';

export const LocationProvider = ({ children }: { children: ReactNode }) => {
	const { user, profile } = useAuth();

	const [location, setLocationState] = useState<string>(() => {
		// Initialise from localStorage so it survives page refreshes
		return localStorage.getItem(LS_KEY) ?? ALL_LOCATIONS;
	});

	// Once the user's profile loads, use their saved location as the default
	// (only if the user hasn't already picked something different this session)
	useEffect(() => {
		if (profile?.location && location === ALL_LOCATIONS) {
			setLocationState(profile.location);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [profile?.location]);

	const setLocation = (loc: string) => {
		setLocationState(loc);
		localStorage.setItem(LS_KEY, loc);

		// Persist to the user's profile too
		if (user && loc !== ALL_LOCATIONS) {
			supabase
				.from('users')
				.update({ location: loc })
				.eq('id', user.id);
		}
	};

	return (
		<LocationContext.Provider value={{ location, setLocation }}>
			{children}
		</LocationContext.Provider>
	);
};

export const useLocation = () => useContext(LocationContext);
