import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadMessages() {
	const { user } = useAuth();
	const [unreadCount, setUnreadCount] = useState(0);

	const fetchCount = useCallback(async () => {
		if (!user) {
			setUnreadCount(0);
			return;
		}

		const { data } = await supabase
			.from('conversations')
			.select(
				'id, buyer_id, seller_id, last_activity, last_read_buyer_at, last_read_seller_at',
			)
			.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

		if (!data) return;

		const count = data.filter((convo) => {
			const isBuyer = convo.buyer_id === user.id;
			const lastRead = isBuyer
				? convo.last_read_buyer_at
				: convo.last_read_seller_at;
			if (!lastRead) return true; // never opened
			return new Date(convo.last_activity) > new Date(lastRead);
		}).length;

		setUnreadCount(count);
	}, [user]);

	useEffect(() => {
		fetchCount();
		if (!user) return;

		// Re-compute whenever any conversation the user is part of changes
		const channel = supabase
			.channel(`unread-messages:${user.id}`)
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'conversations' },
				() => fetchCount(),
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user, fetchCount]);

	return unreadCount;
}
