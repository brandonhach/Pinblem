import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

interface FavoritesContextType {
	favoritedIds: Set<string>;
	toggle: (pinId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
	favoritedIds: new Set(),
	toggle: () => {},
});

export const FavoritesProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { user } = useAuth();
	const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (!user) {
			setFavoritedIds(new Set());
			return;
		}

		supabase
			.from('user_favorites')
			.select('pin_id')
			.eq('user_id', user.id)
			.then(({ data }) => {
				setFavoritedIds(new Set((data ?? []).map((r) => r.pin_id)));
			});
	}, [user]);

	const toggle = (pinId: string) => {
		setFavoritedIds((prev) => {
            const next = new Set(prev);
            if (next.has(pinId)) {
                next.delete(pinId);
            } else {
                next.add(pinId);
            }
            return next;
		});
	};

	return (
		<FavoritesContext.Provider value={{ favoritedIds, toggle }}>
			{children}
		</FavoritesContext.Provider>
	);
};

export const useFavorites = () => useContext(FavoritesContext);
