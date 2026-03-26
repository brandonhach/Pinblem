import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SignedOutGuard from '@/components/SignedOutGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';


// ── Types ─────────────────────────────────────────────────────────────────────

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
};

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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

const Messages = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [newMessage, setNewMessage] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [loadingConvos, setLoadingConvos] = useState(true);
	const [loadingMessages, setLoadingMessages] = useState(false);
	const [sending, setSending] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const activeConvo = conversations.find((c) => c.id === activeConvoId) ?? null;

	// ── Fetch conversations ────────────────────────────────────────────────────

	const fetchConversations = useCallback(async () => {
		if (!user) return;
		setLoadingConvos(true);

		const { data, error } = await supabase
			.from('conversations')
			.select(
				`
        *,
        pin:pin_id (id, title, price, images, listing_type),
        messages (id, sender_id, content, timestamp)
      `,
			)
			.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
			.order('last_activity', { ascending: false });

		if (error) {
			console.error('fetchConversations:', error);
			setLoadingConvos(false);
			return;
		}

		// Gather other user IDs
		const otherIds = (data ?? []).map((c) =>
			c.buyer_id === user.id ? c.seller_id : c.buyer_id,
		);
		const uniqueIds = [...new Set(otherIds)];

		const { data: usersData } = await supabase
			.from('users')
			.select('id, username, avatar_url')
			.in('id', uniqueIds);

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

		// Auto-open conversation if redirected from PinDetail
		const openId = searchParams.get('convo');
		if (openId && mapped.find((c) => c.id === openId)) {
			setActiveConvoId(openId);
		}
	}, [user, searchParams]);

	useEffect(() => {
		fetchConversations();
	}, [fetchConversations]);

	// ── Fetch messages for active convo ───────────────────────────────────────

	const fetchMessages = useCallback(
		async (convoId: string) => {
			setLoadingMessages(true);
			const { data, error } = await supabase
				.from('messages')
				.select('*')
				.eq('conversation_id', convoId)
				.order('timestamp', { ascending: true });

			if (!error) setMessages(data ?? []);
			setLoadingMessages(false);
		},
		[user],
	);

	useEffect(() => {
		if (!activeConvoId) return;
		fetchMessages(activeConvoId);
	}, [activeConvoId, fetchMessages]);

	// ── Realtime subscription ─────────────────────────────────────────────────

	useEffect(() => {
		if (!activeConvoId || !user) return;

		const channel = supabase
			.channel(`messages:${activeConvoId}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'messages',
					filter: `conversation_id=eq.${activeConvoId}`,
				},
				(payload) => {
					const newMsg = payload.new as Message;
					setMessages((prev) => {
						if (prev.find((m) => m.id === newMsg.id)) return prev;
						return [...prev, newMsg];
					});
					// Update last_message preview in sidebar
					setConversations((prev) =>
						prev.map((c) =>
							c.id === activeConvoId
								? {
										...c,
										last_message: newMsg,
										last_activity: newMsg.timestamp,
									}
								: c,
						),
					);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [activeConvoId, user]);

	// ── Scroll to bottom ──────────────────────────────────────────────────────

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages.length]);

	// ── Send message ──────────────────────────────────────────────────────────

	const handleSend = async () => {
		if (!newMessage.trim() || !activeConvoId || !user || sending) return;
		setSending(true);
		const content = newMessage.trim();
		setNewMessage('');

		const { error } = await supabase.from('messages').insert({
			conversation_id: activeConvoId,
			sender_id: user.id,
			content
    });

		if (!error) {
			await supabase
				.from('conversations')
				.update({ last_activity: new Date().toISOString() })
				.eq('id', activeConvoId);
    } 

		setSending(false);
		inputRef.current?.focus();
	};

	// ── Filtered conversations ─────────────────────────────────────────────────

	const filtered = conversations.filter((c) =>
		c.other_user.username.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className='min-h-screen bg-background flex flex-col'>
			<Navbar />
			<SignedOutGuard message='Sign in to view your messages.'>
				<div
					className='flex-1 flex flex-col md:flex-row overflow-hidden'
					style={{ height: 'calc(100vh - 64px)' }}>
					{/* ── Conversation List ── */}
					<div
						className={cn(
							'w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col shrink-0',
							activeConvoId ? 'hidden md:flex' : 'flex',
						)}>
						<div className='p-4 border-b border-border'>
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

						<div className='flex-1 overflow-y-auto'>
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
												<span>
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
											<div className='flex items-center justify-between gap-2 mt-0.5'>
												<p>
													{convo.last_message
														? `${convo.last_message.sender_id === user?.id ? 'You: ' : ''}${convo.last_message.content}`
														: 'No messages yet'}
												</p>

											</div>
										</div>
									</button>
								))
							)}
						</div>
					</div>

					{/* ── Chat Area ── */}
					{activeConvoId && activeConvo ? (
						<div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
							{/* Chat Header */}
							<div className='sticky top-0 z-10 p-4 border-b border-border bg-card flex items-center gap-3 shrink-0'>
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
											<span className='relative flex h-2 w-2'>
												<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75' />
												<span className='relative inline-flex rounded-full h-2 w-2 bg-green-500' />
											</span>
											<span className='text-xs text-muted-foreground'>
												Active
											</span>
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

							{/* Messages */}
							<div className='flex-1 overflow-y-auto p-4 space-y-3'>
								{loadingMessages ? (
									<div className='flex items-center justify-center py-16'>
										<span className='h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent' />
									</div>
								) : messages.length === 0 ? (
									<p className='text-center text-sm text-muted-foreground py-16'>
										No messages yet. Say hi!
									</p>
								) : (
									messages.map((msg) => {
										const isOwn = msg.sender_id === user?.id;
										return (
											<div
												key={msg.id}
												className={cn(
													'flex',
													isOwn ? 'justify-end' : 'justify-start',
												)}>
												<div
													className={cn(
														'max-w-[75%] rounded-2xl px-4 py-2.5',
														isOwn
															? 'bg-primary text-primary-foreground rounded-br-md'
															: 'bg-card border border-border text-foreground rounded-bl-md',
													)}>
													<p className='text-sm'>{msg.content}</p>
													<p
														className={cn(
															'text-[10px] mt-1',
															isOwn
																? 'text-primary-foreground/70'
																: 'text-muted-foreground',
														)}>
														{formatMessageTime(msg.timestamp)}
													</p>
												</div>
											</div>
										);
									})
								)}
								<div ref={messagesEndRef} />
							</div>

							{/* Input */}
							<div className='sticky bottom-0 z-10 p-4 border-t border-border bg-card shrink-0'>
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
	);
};

export default Messages;
