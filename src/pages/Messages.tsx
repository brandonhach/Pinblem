import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SignedOutGuard from '@/components/SignedOutGuard';
import TradeOfferMessage from '@/components/TradeOfferMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOnlineStatus } from '@/hooks/useUserOnlineStatus';

type Participant = {
	id: string;
	username: string;
	avatar_url: string;
};

type Message = {
	id: string;
	conversation_id: string;
	sender_id: string;
	content: string;
	timestamp: string;
	type: 'message';
	pending?: boolean;
};

type TradeOffer = {
	id: string;
	conversation_id: string;
	pin_id: string;
	name: string;
	condition: string;
	description: string | null;
	photos_url: string[] | null;
	created_at: string;
	sender_id: string;
	type: 'offer';
};

type FeedItem = Message | TradeOffer;

type Conversation = {
	id: string;
	buyer_id: string;
	seller_id: string;
	pin_id: string | null;
	created_at: string;
	last_activity: string;
	other_user: Participant;
	pin?: {
		id: string;
		title: string;
		price: number | null;
		images: string[];
		listing_type: string;
	} | null;
	last_message?: Message | null;
};

// onstants

const PAGE_SIZE = 10;



const formatTime = (ts: string) => {
	const date = new Date(ts);
	const diffMs = Date.now() - date.getTime();
	const mins = Math.floor(diffMs / 60000);
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	if (hours < 48) return 'Yesterday';
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatMessageTime = (ts: string) =>
	new Date(ts).toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
	});

// Component

const Messages = () => {
	const { user } = useAuth();
	const [searchParams] = useSearchParams();

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
	const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [loadingConvos, setLoadingConvos] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [loadingOlder, setLoadingOlder] = useState(false);
	const [hasOlderMessages, setHasOlderMessages] = useState(false);
	const [sending, setSending] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const feedRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const shouldScrollToBottom = useRef(true);
	const prevScrollHeightRef = useRef<number>(0);

	// Stable refs so callbacks never need state as deps (prevents re-render loops)
	const feedItemsRef = useRef<FeedItem[]>([]);
	const hasOlderRef = useRef(false);
	const loadingOlderRef = useRef(false);
	const activeConvoIdRef = useRef<string | null>(null);
	const conversationsRef = useRef<Conversation[]>([]);

	useEffect(() => {
		feedItemsRef.current = feedItems;
	}, [feedItems]);
	useEffect(() => {
		hasOlderRef.current = hasOlderMessages;
	}, [hasOlderMessages]);
	useEffect(() => {
		loadingOlderRef.current = loadingOlder;
	}, [loadingOlder]);
	useEffect(() => {
		activeConvoIdRef.current = activeConvoId;
	}, [activeConvoId]);
	useEffect(() => {
		conversationsRef.current = conversations;
	}, [conversations]);

	const activeConvo = conversations.find((c) => c.id === activeConvoId) ?? null;

	const { online: otherUserOnline } = useUserOnlineStatus(
		activeConvo?.other_user.id,
	);

	// Fetch conversations (runs once on mount) 

	useEffect(() => {
		if (!user) return;
		let cancelled = false;

		const run = async () => {
			setLoadingConvos(true);

			const { data, error } = await supabase
				.from('conversations')
				.select(
					`*, pin:pin_id (id, title, price, images, listing_type), messages (id, sender_id, content, timestamp)`,
				)
				.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
				.order('last_activity', { ascending: false });

			if (cancelled) return;
			if (error) {
				console.error('fetchConversations:', error);
				setLoadingConvos(false);
				return;
			}

			const otherIds = (data ?? []).map((c) =>
				c.buyer_id === user.id ? c.seller_id : c.buyer_id,
			);
			const { data: usersData } = await supabase
				.from('users')
				.select('id, username, avatar_url')
				.in('id', [...new Set(otherIds)]);

			if (cancelled) return;
			const usersMap = Object.fromEntries(
				(usersData ?? []).map((u) => [u.id, u]),
			);

			const mapped: Conversation[] = (data ?? []).map((c) => {
				const otherId = c.buyer_id === user.id ? c.seller_id : c.buyer_id;
				const msgs: Message[] = c.messages ?? [];
				const sorted = [...msgs].sort(
					(a, b) =>
						new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
				);
				return {
					id: c.id,
					buyer_id: c.buyer_id,
					seller_id: c.seller_id,
					pin_id: c.pin_id,
					created_at: c.created_at,
					last_activity: c.last_activity,
					other_user: usersMap[otherId] ?? {
						id: otherId,
						username: 'Unknown',
						avatar_url: '',
					},
					pin: c.pin ?? null,
					last_message: sorted[sorted.length - 1] ?? null,
				};
			});

			setConversations(mapped);
			setLoadingConvos(false);

			const openId = searchParams.get('convo');
			if (openId && mapped.find((c) => c.id === openId))
				setActiveConvoId(openId);
		};

		run();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]); // intentionally omit searchParams — handled on first load only

	// Fetch initial feed when conversation switches

	useEffect(() => {
		if (!activeConvoId || !user) return;
		let cancelled = false;

		// Mark this conversation as read for the current user
		const convoForRead = conversationsRef.current.find(
			(c) => c.id === activeConvoId,
		);
		if (convoForRead) {
			const isBuyer = convoForRead.buyer_id === user.id;
			const now = new Date().toISOString();
			// Clear the unread message badge
			supabase
				.from('conversations')
				.update({
					[isBuyer ? 'last_read_buyer_at' : 'last_read_seller_at']: now,
				})
				.eq('id', activeConvoId);
			// Clear the bell notification for this conversation
			supabase
				.from('notifications')
				.update({ read: true })
				.eq('user_id', user.id)
				.eq('read', false)
				.eq('link', `/messages?convo=${activeConvoId}`);
		}

		const run = async () => {
			setLoadingMessages(true);
			setFeedItems([]);
			setHasOlderMessages(false);
			shouldScrollToBottom.current = true;

			const convo = conversationsRef.current.find(
				(c) => c.id === activeConvoId,
			);

			const [{ data: msgs }, { data: offers }] = await Promise.all([
				supabase
					.from('messages')
					.select('*')
					.eq('conversation_id', activeConvoId)
					.order('timestamp', { ascending: false })
					.limit(PAGE_SIZE),
				supabase
					.from('messages_offers')
					.select('*')
					.eq('conversation_id', activeConvoId)
					.order('created_at', { ascending: true }),
			]);

			if (cancelled) return;

			const messageFeed: Message[] = (msgs ?? [])
				.reverse()
				.map((m) => ({ ...m, type: 'message' as const }));
			const newHasOlder = (msgs ?? []).length === PAGE_SIZE;
			setHasOlderMessages(newHasOlder);
			hasOlderRef.current = newHasOlder;

			const offerFeed: TradeOffer[] = (offers ?? []).map((o) => ({
				...o,
				sender_id: convo?.buyer_id ?? '',
				type: 'offer' as const,
			}));

			const merged: FeedItem[] = [...messageFeed, ...offerFeed].sort((a, b) => {
				const aTime = a.type === 'message' ? a.timestamp : a.created_at;
				const bTime = b.type === 'message' ? b.timestamp : b.created_at;
				return new Date(aTime).getTime() - new Date(bTime).getTime();
			});

			setFeedItems(merged);
			setLoadingMessages(false);
		};

		run();
		return () => {
			cancelled = true;
		};
	}, [activeConvoId]); // only re-runs when selected conversation changes

	// Load older messages (reads everything via refs, no state deps) 

	const loadOlderMessages = useCallback(async () => {
		const convoId = activeConvoIdRef.current;
		if (!convoId || loadingOlderRef.current || !hasOlderRef.current) return;

		const oldest = feedItemsRef.current.find((i) => i.type === 'message') as
			| Message
			| undefined;
		if (!oldest) return;

		setLoadingOlder(true);
		loadingOlderRef.current = true;
		prevScrollHeightRef.current = feedRef.current?.scrollHeight ?? 0;
		shouldScrollToBottom.current = false;

		const { data: msgs } = await supabase
			.from('messages')
			.select('*')
			.eq('conversation_id', convoId)
			.lt('timestamp', oldest.timestamp)
			.order('timestamp', { ascending: false })
			.limit(PAGE_SIZE);

		if (!msgs || msgs.length === 0) {
			setHasOlderMessages(false);
			hasOlderRef.current = false;
			setLoadingOlder(false);
			loadingOlderRef.current = false;
			return;
		}

		const older: Message[] = msgs
			.reverse()
			.map((m) => ({ ...m, type: 'message' as const }));
		const newHasOlder = msgs.length === PAGE_SIZE;
		setHasOlderMessages(newHasOlder);
		hasOlderRef.current = newHasOlder;

		setFeedItems((prev) => {
			const existingIds = new Set(prev.map((i) => i.id));
			return [...older.filter((m) => !existingIds.has(m.id)), ...prev];
		});

		setLoadingOlder(false);
		loadingOlderRef.current = false;
	}, []); // stable — no deps, all state read via refs

	//  Restore scroll position after prepend 

	// Runs after every render; only acts when we were loading older messages
	useEffect(() => {
		if (
			!shouldScrollToBottom.current &&
			feedRef.current &&
			prevScrollHeightRef.current > 0
		) {
			feedRef.current.scrollTop +=
				feedRef.current.scrollHeight - prevScrollHeightRef.current;
			prevScrollHeightRef.current = 0;
		}
	});

	//  Scroll listener — registered once per conversation 

	useEffect(() => {
		const el = feedRef.current;
		if (!el) return;

		const onScroll = () => {
			if (
				el.scrollTop < 80 &&
				hasOlderRef.current &&
				!loadingOlderRef.current
			) {
				loadOlderMessages();
			}
		};

		el.addEventListener('scroll', onScroll, { passive: true });
		return () => el.removeEventListener('scroll', onScroll);
	}, [activeConvoId, loadOlderMessages]); // re-register only when conversation changes

	// Auto scroll to bottom on new messages 

	useEffect(() => {
		if (shouldScrollToBottom.current) {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [feedItems]);

	// Realtime subscription

	useEffect(() => {
		if (!activeConvoId || !user) return;

		const channel = supabase
			.channel(`feed:${activeConvoId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `conversation_id=eq.${activeConvoId}`,
				},
				(payload) => {
					const incoming: Message = {
						...(payload.new as Message),
						type: 'message',
					};

					setFeedItems((prev) => {
						// Already in feed as confirmed message — skip
						if (
							prev.find((m) => m.id === incoming.id && !(m as Message).pending)
						)
							return prev;

						// Swap out the matching pending bubble (same sender + content)
						const withoutPending = prev.filter(
							(m) =>
								!(
									m.type === 'message' &&
									(m as Message).pending &&
									m.sender_id === incoming.sender_id &&
									(m as Message).content === incoming.content
								),
						);

						if (withoutPending.find((m) => m.id === incoming.id))
							return withoutPending;
						return [...withoutPending, incoming];
					});

					shouldScrollToBottom.current = true;

					setConversations((prev) =>
						prev.map((c) =>
							c.id === activeConvoId
								? {
										...c,
										last_message: incoming,
										last_activity: incoming.timestamp,
									}
								: c,
						),
					);
				},
			)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages_offers',
					filter: `conversation_id=eq.${activeConvoId}`,
				},
				(payload) => {
					const convo = conversationsRef.current.find(
						(c) => c.id === activeConvoId,
					);
					const newOffer: TradeOffer = {
						...(payload.new as any),
						sender_id: convo?.buyer_id ?? '',
						type: 'offer',
					};
					setFeedItems((prev) => {
						if (prev.find((m) => m.id === newOffer.id)) return prev;
						return [...prev, newOffer];
					});
					shouldScrollToBottom.current = true;
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [activeConvoId, user]); // intentionally no `conversations` dep — reads via ref

	// Send message (optimistic) 

	const handleSend = async () => {
		if (!newMessage.trim() || !activeConvoId || !user || sending) return;

		const content = newMessage.trim();
		setNewMessage('');
		setSending(true);

		// Show message immediately
		const tempId = `temp-${Date.now()}`;
		const tempMsg: Message = {
			id: tempId,
			conversation_id: activeConvoId,
			sender_id: user.id,
			content,
			timestamp: new Date().toISOString(),
			type: 'message',
			pending: true,
		};

		shouldScrollToBottom.current = true;
		setFeedItems((prev) => [...prev, tempMsg]);

		const { error } = await supabase.from('messages').insert({
			conversation_id: activeConvoId,
			sender_id: user.id,
			content,
		});

		if (error) {
			console.error('handleSend:', error);
			setFeedItems((prev) => prev.filter((m) => m.id !== tempId));
		} else {
			// Fire and forget — realtime will confirm and swap out the pending item
			const now = new Date().toISOString();
			const convo = conversationsRef.current.find(
				(c) => c.id === activeConvoId,
			);
			const isBuyer = convo?.buyer_id === user.id;
			supabase
				.from('conversations')
				.update({
					last_activity: now,
					[isBuyer ? 'last_read_buyer_at' : 'last_read_seller_at']: now,
				})
				.eq('id', activeConvoId);
		}

		setSending(false);
		inputRef.current?.focus();
	};

	//Filtered conversations 

	const filtered = conversations.filter((c) =>
		c.other_user.username.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Render

	return (
		// Lock the entire page to the viewport — no body scroll
		<div
			className='flex flex-col bg-background'
			style={{ height: '100dvh' }}>
			<Navbar />

			{/*
			 * Wrap SignedOutGuard in a div that explicitly fills remaining space.
			 * SignedOutGuard itself likely renders an opaque div — giving it a
			 * flex parent with min-h-0 means it can't escape its bounds.
			 */}
			<div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
				<SignedOutGuard message='Sign in to view your messages.'>
					{/* Two-column shell — fills the flex parent exactly */}
					<div className='flex flex-row h-full overflow-hidden'>
						{/* ── Conversation List ── */}
						<div
							className={cn(
								'w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col shrink-0 overflow-hidden',
								activeConvoId ? 'hidden md:flex' : 'flex',
							)}>
							{/* Search header — fixed height */}
							<div className='p-4 border-b border-border shrink-0'>
								<h1 className='font-display text-lg font-bold text-foreground mb-3'>
									Messages
								</h1>
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
									<Input
										placeholder='Search conversations...'
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className='pl-10'
									/>
								</div>
							</div>

							{/* Scrollable list */}
							<div className='flex-1 min-h-0 overflow-y-auto'>
								{loadingConvos ? (
									<div className='flex items-center justify-center py-16'>
										<span className='h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent' />
									</div>
								) : filtered.length === 0 ? (
									<p className='text-center text-sm text-muted-foreground py-16'>
										No conversations yet.
									</p>
								) : (
									filtered.map((convo) => (
										<button
											key={convo.id}
											onClick={() => setActiveConvoId(convo.id)}
											className={cn(
												'w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border',
												activeConvoId === convo.id && 'bg-accent/30',
											)}>
											<Avatar className='w-11 h-11 shrink-0'>
												<AvatarImage src={convo.other_user.avatar_url} />
												<AvatarFallback>
													{convo.other_user.username[0]?.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className='flex-1 min-w-0'>
												<div className='flex items-center justify-between gap-2'>
													<span className='font-medium text-sm text-foreground truncate'>
														{convo.other_user.username}
													</span>
													<span className='text-[10px] text-muted-foreground shrink-0'>
														{formatTime(convo.last_activity)}
													</span>
												</div>
												{convo.pin && (
													<div className='text-[10px] text-primary truncate'>
														Re: {convo.pin.title}
													</div>
												)}
												<p className='text-xs text-muted-foreground truncate mt-0.5'>
													{convo.last_message
														? `${convo.last_message.sender_id === user?.id ? 'You: ' : ''}${convo.last_message.content}`
														: 'No messages yet'}
												</p>
											</div>
										</button>
									))
								)}
							</div>
						</div>

						{/* ── Chat Area ── */}
						{activeConvoId && activeConvo ? (
							/*
							 * This column is a flex container with three rows:
							 *   1. Header  — shrink-0 (fixed)
							 *   2. Feed    — flex-1 min-h-0 overflow-y-auto (scrollable)
							 *   3. Input   — shrink-0 (fixed, always visible at bottom)
							 */
							<div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
								{/* Row 1 — Header */}
								<div className='p-4 border-b border-border bg-card flex items-center gap-3 shrink-0'>
									<Button
										variant='ghost'
										size='icon'
										className='md:hidden shrink-0'
										onClick={() => setActiveConvoId(null)}>
										<ArrowLeft className='h-5 w-5' />
									</Button>
									<Link
										to={`/profile/${activeConvo.other_user.id}`}
										className='flex items-center gap-3 flex-1 min-w-0'>
										<Avatar className='w-10 h-10 shrink-0'>
											<AvatarImage src={activeConvo.other_user.avatar_url} />
											<AvatarFallback>
												{activeConvo.other_user.username[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className='min-w-0'>
											<div className='font-medium text-foreground text-sm'>
												{activeConvo.other_user.username}
											</div>
											<div className='flex items-center gap-1.5'>
												{otherUserOnline ? (
													<>
														<span className='relative flex h-2 w-2'>
															<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75' />
															<span className='relative inline-flex rounded-full h-2 w-2 bg-green-500' />
														</span>
														<span className='text-xs text-muted-foreground'>
															Online
														</span>
													</>
												) : (
													<>
														<span className='relative flex h-2 w-2'>
															<span className='relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/40' />
														</span>
														<span className='text-xs text-muted-foreground'>
															Offline
														</span>
													</>
												)}
											</div>
										</div>
									</Link>
									{activeConvo.pin && (
										<Link
											to={`/pin/${activeConvo.pin.id}`}
											className='hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors shrink-0'>
											{activeConvo.pin.images?.[0] && (
												<img
													src={activeConvo.pin.images[0]}
													alt=''
													className='w-8 h-8 rounded object-cover'
												/>
											)}
											<div className='text-xs'>
												<div className='text-foreground font-medium truncate max-w-[120px]'>
													{activeConvo.pin.title}
												</div>
												<div className='text-primary font-semibold'>
													{activeConvo.pin.listing_type === 'trade'
														? 'Trade'
														: `$${activeConvo.pin.price}`}
												</div>
											</div>
										</Link>
									)}
								</div>

								{/* Row 2 — Scrollable feed */}
								<div
									ref={feedRef}
									className='flex-1 min-h-0 overflow-y-auto p-4 space-y-3'>
									{hasOlderMessages && (
										<div className='flex justify-center py-2'>
											{loadingOlder ? (
												<span className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
											) : (
												<button
													onClick={loadOlderMessages}
													className='text-xs text-muted-foreground hover:text-foreground transition-colors'>
													Load older messages
												</button>
											)}
										</div>
									)}

									{loadingMessages ? (
										<div className='flex items-center justify-center py-16'>
											<span className='h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent' />
										</div>
									) : feedItems.length === 0 ? (
										<p className='text-center text-sm text-muted-foreground py-16'>
											No messages yet. Say hi!
										</p>
									) : (
										feedItems.map((item) => {
											const isOwn = item.sender_id === user?.id;
											if (item.type === 'offer') {
												return (
													<TradeOfferMessage
														key={`offer-${item.id}`}
														offer={item}
														isOwn={isOwn}
													/>
												);
											}
											return (
												<div
													key={item.id}
													className={cn(
														'flex transition-opacity',
														isOwn ? 'justify-end' : 'justify-start',
														item.pending && 'opacity-60',
													)}>
													<div
														className={cn(
															'max-w-[75%] rounded-2xl px-4 py-2.5',
															isOwn
																? 'bg-primary text-primary-foreground rounded-br-md'
																: 'bg-card border border-border text-foreground rounded-bl-md',
														)}>
														<p className='text-sm'>{item.content}</p>
														<p
															className={cn(
																'text-[10px] mt-1',
																isOwn
																	? 'text-primary-foreground/70'
																	: 'text-muted-foreground',
															)}>
															{item.pending
																? 'Sending…'
																: formatMessageTime(item.timestamp)}
														</p>
													</div>
												</div>
											);
										})
									)}
									<div ref={messagesEndRef} />
								</div>

								{/* Row 3 — Input bar, always pinned at the bottom */}
								<div className='p-4 border-t border-border bg-card shrink-0'>
									<div className='flex gap-2'>
										<Input
											ref={inputRef}
											placeholder='Type a message...'
											value={newMessage}
											onChange={(e) => setNewMessage(e.target.value)}
											onKeyDown={(e) =>
												e.key === 'Enter' && !e.shiftKey && handleSend()
											}
											className='flex-1'
										/>
										<Button
											onClick={handleSend}
											disabled={!newMessage.trim() || sending}
											size='icon'>
											{sending ? (
												<span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
											) : (
												<Send className='h-4 w-4' />
											)}
										</Button>
									</div>
								</div>
							</div>
						) : (
							<div className='hidden md:flex flex-1 items-center justify-center'>
								<div className='text-center'>
									<div className='text-5xl mb-4'>💬</div>
									<h2 className='font-display text-lg font-semibold text-foreground mb-1'>
										Your Messages
									</h2>
									<p className='text-sm text-muted-foreground'>
										Select a conversation to start chatting
									</p>
								</div>
							</div>
						)}
					</div>
				</SignedOutGuard>
			</div>
		</div>
	);
};

export default Messages;
