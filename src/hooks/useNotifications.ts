import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export type Notification = {
	id: string;
	type: string;
	title: string;
	message: string;
	read: boolean;
	link: string | null;
	created_at: string;
};

export function useNotifications() {
	const { user } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchNotifications = useCallback(async () => {
		if (!user) {
			setNotifications([]);
			setLoading(false);
			return;
		}
		const { data } = await supabase
			.from('notifications')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(30);
		setNotifications(data ?? []);
		setLoading(false);
	}, [user]);

	useEffect(() => {
		fetchNotifications();
		if (!user) return;

		const channel = supabase
			.channel(`notifications:${user.id}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'notifications',
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					setNotifications((prev) => [
						payload.new as Notification,
						...prev,
					]);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [user, fetchNotifications]);

	const markAllRead = useCallback(async () => {
		if (!user) return;
		const { error } = await supabase
			.from('notifications')
			.update({ read: true })
			.eq('user_id', user.id)
			.eq('read', false);
		if (!error) {
			setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
		}
	}, [user]);

	const unreadCount = notifications.filter((n) => !n.read).length;

	return { notifications, loading, unreadCount, markAllRead };
}
