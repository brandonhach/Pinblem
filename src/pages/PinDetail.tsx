import { useParams, Link, useNavigate } from 'react-router-dom';
import {
	ArrowLeft,
	Heart,
	Share2,
	MapPin,
	Star,
	Shield,
	MessageCircle,
	RefreshCw,
	ShoppingCart,
	Send,
  SquarePen,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import TradeProposalDialog from '@/components/TradeProposalDialog';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/utils/supabaseClient';
import { Pin } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';

// Helper to map a raw Supabase row to Pin
const mapRow = (row): Pin => ({
	...row,
	username: row.users?.username ?? 'Unknown',
	avatar_url: row.users?.avatar_url ?? '',
	verified: row.users?.verified ?? false,
	rating: row.users?.rating ?? 0,
});

const SELECT_FIELDS = `*, users (username, avatar_url, verified, rating)`;

const PinDetail = () => {
	const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
	const navigate = useNavigate();

	const [pin, setPin] = useState<Pin | null>(null);
	const [similarPins, setSimilarPins] = useState<Pin[]>([]);
	const [sellerPins, setSellerPins] = useState<Pin[]>([]);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [liked, setLiked] = useState(false);
	const [isTradeOpen, setIsTradeOpen] = useState(false);
	const [isTradeLoading, setIsTradeLoading] = useState(false);
	const [messageDrawerOpen, setMessageDrawerOpen] = useState(false);
	const [firstMessage, setFirstMessage] = useState('');
	const [selectedImage, setSelectedImage] = useState<string | null>(null);
	const [lightboxOpen, setLightboxOpen] = useState(false);

	// ── Fetch pin + related data ──────────────────────────────────────────────
	useEffect(() => {
		if (!id) return;

		const fetchAll = async () => {
			setLoading(true);
			setNotFound(false);

			// Main pin
			const { data, error } = await supabase
				.from('pins')
				.select(SELECT_FIELDS)
				.eq('id', id)
				.single();

			if (error || !data) {
				console.error(error);
				setNotFound(true);
				setLoading(false);
				return;
			}

			const mapped = mapRow(data);
			setPin(mapped);
			setLiked(mapped.isFavorite ?? false);

			// Similar pins (same category, different id)
			const { data: similar } = await supabase
				.from('pins')
				.select(SELECT_FIELDS)
				.eq('category', data.category)
				.neq('id', id)
				.limit(4);

			setSimilarPins((similar ?? []).map(mapRow));

			// More from seller
			const { data: fromSeller } = await supabase
				.from('pins')
				.select(SELECT_FIELDS)
				.eq('user_id', data.user_id)
				.neq('id', id)
				.limit(4);

			setSellerPins((fromSeller ?? []).map(mapRow));

			setLoading(false);
		};

		fetchAll();
	}, [id]);

	// ── Handlers ──────────────────────────────────────────────────────────────
	// Replace handleSendFirstMessage in PinDetail.tsx with this:

	const handleSendFirstMessage = async () => {
		if (!firstMessage.trim() || !pin || !user) return;

		// 1. Check if a conversation already exists between these two users for this pin
    const { data: existing, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', pin.user_id)
      .eq('pin_id', pin.id)
      .maybeSingle();

    if (existingError) throw existingError;

    let convoId: string;

    if (existing) {
      convoId = existing.id;
    } else {
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          buyer_id: user.id,
          seller_id: pin.user_id,
          pin_id: pin.id,
          last_activity: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (convoError || !newConvo) {
        toast({
          title: 'Error',
          description: 'Could not start conversation.',
          variant: 'destructive',
        });
        return;
      }

      convoId = newConvo.id;
    }

		// 3. Insert the first message
		const { error: msgError } = await supabase.from('messages').insert({
			conversation_id: convoId,
			sender_id: user.id,
			content: firstMessage.trim(),
		});

		if (msgError) {
			toast({
				title: 'Error',
				description: 'Could not send message.',
				variant: 'destructive',
			});
			return;
		}

		// 4. Update last_activity
		await supabase
			.from('conversations')
			.update({ last_activity: new Date().toISOString() })
			.eq('id', convoId);

		setMessageDrawerOpen(false);
		setFirstMessage('');

		// 5. Redirect to /messages with the conversation open
		navigate(`/messages?convo=${convoId}`);
	};

	const handleProposeTrade = async () => {
		setIsTradeLoading(true);
		await new Promise((r) => setTimeout(r, 800));
		setIsTradeLoading(false);
		setIsTradeOpen(true);
	};

	const handleBuyNow = () => {
		if (!pin) return;
		toast({
			title: 'Order placed!',
			description: `You bought "${pin.title}" for $${pin.price}.`,
		});
	};

	// ── Loading / error states ────────────────────────────────────────────────
	if (loading) {
		return (
			<div className='min-h-screen bg-background'>
				<Navbar />
				<div className='flex items-center justify-center py-32'>
					<span className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
				</div>
			</div>
		);
	}

	if (notFound || !pin) {
		return (
			<div className='min-h-screen bg-background'>
				<Navbar />
				<div className='flex flex-col items-center justify-center py-32 gap-4'>
					<p className='text-muted-foreground text-lg'>Pin not found.</p>
					<Button
						variant='outline'
						onClick={() => navigate('/')}>
						Go Home
					</Button>
				</div>
			</div>
		);
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	const conditionStyles: Record<string, string> = {
		new: 'bg-success-light text-success',
		'like-new': 'bg-accent text-accent-foreground',
		good: 'bg-warning-light text-warning',
		fair: 'bg-muted text-muted-foreground',
	};

	const primaryImage = selectedImage ?? pin.images?.[0] ?? '';

	return (
		<div className='min-h-screen bg-background'>
			<Navbar />

			{/* Back Button */}
			<div className='container px-4 py-3'>
				<Link to='/'>
					<Button
						variant='ghost'
						size='sm'
						className='gap-2'>
						<ArrowLeft className='h-4 w-4' />
						Back
					</Button>
				</Link>
			</div>

			<main className='container px-4 pb-6'>
				<div className='max-w-4xl mx-auto'>
					<div className='grid md:grid-cols-2 gap-6'>
						{/* ── Image Section ── */}
						<div className='space-y-3'>
							{/* Main image */}
							<div
								className='relative aspect-square bg-muted rounded-xl overflow-hidden cursor-zoom-in'
								onClick={() => primaryImage && setLightboxOpen(true)}>
								{primaryImage ? (
									<img
										src={primaryImage}
										alt={pin.title}
										className='w-full h-full object-cover'
									/>
								) : (
									<div className='w-full h-full flex items-center justify-center text-muted-foreground text-sm'>
										No image
									</div>
								)}

								{/* Action buttons */}
								<div className='absolute top-3 right-3 flex gap-2'>
									<button
										className='w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors'
										onClick={(e) => {
											e.stopPropagation();
											setLiked(!liked);
										}}>
										<Heart
											className={cn(
												'h-4 w-4',
												liked
													? 'fill-destructive text-destructive'
													: 'text-muted-foreground',
											)}
										/>
									</button>
									<button
										className='w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors'
										onClick={(e) => e.stopPropagation()}>
										<Share2 className='h-4 w-4 text-muted-foreground' />
									</button>
								</div>

								{/* Badges */}
								{pin.isTradeOnly && (
									<div className='absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium'>
										Trade Only
									</div>
								)}
								<div
									className={cn(
										'absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
										conditionStyles[pin.condition],
									)}>
									{pin.condition.replace('-', ' ')}
								</div>
							</div>

							{/* Thumbnail strip */}
							{pin.images?.length > 1 && (
								<div className='flex gap-2 overflow-x-auto pb-1'>
									{pin.images.map((img, idx) => (
										<img
											key={idx}
											src={img}
											alt={`${pin.title} ${idx + 1}`}
											onClick={() => setSelectedImage(img)}
											className={cn(
												'w-16 h-16 rounded-lg object-cover shrink-0 border-2 transition-colors cursor-pointer',
												primaryImage === img
													? 'border-primary'
													: 'border-transparent hover:border-primary',
											)}
										/>
									))}
								</div>
							)}
						</div>

						{/* Lightbox modal */}
						{lightboxOpen && (
							<div
								className='fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4'
								onClick={() => setLightboxOpen(false)}>
								<button
									className='absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white'
									onClick={() => setLightboxOpen(false)}>
									✕
								</button>
								<img
									src={primaryImage}
									alt={pin.title}
									className='max-w-full max-h-[90vh] object-contain rounded-lg'
									onClick={(e) => e.stopPropagation()}
								/>
							</div>
						)}

						{/* ── Details Section ── */}
						<div className='space-y-4'>
							<div>
								<h1 className='font-display text-xl md:text-2xl font-bold text-foreground'>
									{pin.title}
								</h1>
								<div className='flex items-center gap-2 mt-2'>
									<span className='text-2xl font-bold text-primary'>
										{pin.isTradeOnly ? 'Trade Only' : `$${pin.price}`}
									</span>
									<span className='px-2.5 py-1 rounded-full border border-border text-xs font-medium capitalize text-foreground'>
										{pin.listing_type}
									</span>
								</div>
							</div>

							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<MapPin className='h-4 w-4' />
								<span>{pin.location}</span>
							</div>

							{/* Seller Card */}
							<Link
								to={`/profile/${pin.user_id}`}
								className='block card-tactile p-4'>
								<div className='flex items-center gap-3'>
									<Avatar className='size-12'>
										<AvatarImage src={pin.avatar_url} />
										<AvatarFallback>
											<Spinner className='size-4' />
										</AvatarFallback>
									</Avatar>
									<div className='flex-1'>
										<div className='flex items-center gap-2'>
											<span className='font-medium text-foreground'>
												{pin.username}
											</span>
											{pin.verified && (
												<span className='group/badge relative'>
													<Shield className='h-4 w-4 text-primary' />
													<span className='absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none'>
														Verified
													</span>
												</span>
											)}
										</div>
										<div className='flex items-center gap-1 mt-1'>
											{pin.rating && (
												<div className='flex items-center gap-1 text-sm text-muted-foreground'>
													<Star className='h-3.5 w-3.5 fill-warning text-warning' />
													<span>{pin.rating} (156)&emsp;·&emsp;456 sales</span>
												</div>
											)}
										</div>
									</div>
								</div>
							</Link>

							{/* Description */}
							<div>
								<h3 className='font-display font-semibold text-foreground mb-2'>
									Description
								</h3>
								<p className='text-sm text-muted-foreground'>
									{pin.description}
								</p>
							</div>

							{/* Action Buttons */}
							{user.id === pin.user_id ? (
								<>
									<Button
										variant='default'
										className='w-full gap-2'
										onClick={() => setMessageDrawerOpen(true)}>
										<SquarePen className="size-4"/>
										Edit listing
									</Button>
								</>
							) : (
								<>
									<div className='flex gap-3 pt-4'>
										{pin.isTradeOnly ? (
											<Button
												className='flex-1 gap-2'
												onClick={handleProposeTrade}
												disabled={isTradeLoading}>
												{isTradeLoading ? (
													<>
														<span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
														Loading…
													</>
												) : (
													<>
														<RefreshCw className='h-4 w-4' />
														Propose Trade
													</>
												)}
											</Button>
										) : (
											<>
												<Button
													className='flex-1 gap-2'
													onClick={handleBuyNow}>
													<ShoppingCart className='h-4 w-4' />
													Buy Now
												</Button>
												<Button
													variant='outline'
													className='gap-2'
													onClick={handleProposeTrade}
													disabled={isTradeLoading}>
													{isTradeLoading ? (
														<>
															<span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
															Loading…
														</>
													) : (
														<>
															<RefreshCw className='h-4 w-4' />
															Offer Trade
														</>
													)}
												</Button>
											</>
										)}
									</div>

									<Button
										variant='ghost'
										className='w-full gap-2'
										onClick={() => setMessageDrawerOpen(true)}>
										<MessageCircle className='h-4 w-4' />
										Message Seller
									</Button>
								</>
							)}
						</div>
					</div>

					{/* ── Similar Items ── */}
					{similarPins.length > 0 && (
						<section className='mt-8'>
							<h2 className='font-display text-lg font-semibold text-foreground mb-4'>
								Similar Items
							</h2>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch auto-rows-fr'>
								{similarPins.map((p) => (
									<ListingCard
										key={p.id}
										pin={p}
										to={`/pin/${p.id}`}
									/>
								))}
							</div>
						</section>
					)}

					{/* ── More from Seller ── */}
					{sellerPins.length > 0 && (
						<section className='mt-8'>
							<div className='flex items-center justify-between mb-4'>
								<h2 className='font-display text-lg font-semibold text-foreground'>
									More from {pin.username}
								</h2>
								<Link to={`/profile/${pin.user_id}`}>
									<Button
										variant='ghost'
										size='sm'
										className='text-primary'>
										View All
									</Button>
								</Link>
							</div>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch auto-rows-fr'>
								{sellerPins.map((p) => (
									<ListingCard
										key={p.id}
										pin={p}
										to={`/pin/${p.id}`}
									/>
								))}
							</div>
						</section>
					)}
				</div>
			</main>

			{/* ── Trade Dialog ── */}
			<TradeProposalDialog
				open={isTradeOpen}
				onOpenChange={setIsTradeOpen}
				listingTitle={pin.title}
			/>

			{/* ── Message Seller Drawer ── */}
			<Drawer
				open={messageDrawerOpen}
				onOpenChange={setMessageDrawerOpen}>
				<DrawerContent>
					<div className='p-5 pb-8 max-w-lg mx-auto w-full'>
						{/* Seller header */}
						<div className='flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/60'>
							{pin.avatar_url ? (
								<img
									src={pin.avatar_url}
									alt={pin.username}
									className='w-11 h-11 rounded-full object-cover shrink-0'
								/>
							) : (
								<div className='w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0'>
									{pin.username?.[0]?.toUpperCase() ?? '?'}
								</div>
							)}
							<div className='flex-1 min-w-0'>
								<div className='font-medium text-foreground text-sm'>
									{pin.username}
								</div>
								<div className='flex items-center gap-1.5 mt-0.5'>
									<span className='relative flex h-2.5 w-2.5'>
										<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75' />
										<span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500' />
									</span>
									<span className='text-xs text-muted-foreground'>Active</span>
								</div>
							</div>
						</div>

						{/* Pin context */}
						<div className='flex items-center gap-2 mb-4 p-2 rounded-lg bg-muted/40 border border-border'>
							{primaryImage && (
								<img
									src={primaryImage}
									alt=''
									className='w-10 h-10 rounded-lg object-cover shrink-0'
								/>
							)}
							<div className='min-w-0 flex-1'>
								<div className='text-xs font-medium text-foreground truncate'>
									{pin.title}
								</div>
								<div className='text-xs text-primary font-semibold'>
									{pin.isTradeOnly ? 'Trade Only' : `$${pin.price}`}
								</div>
							</div>
						</div>

						{/* Message input */}
						<Textarea
							placeholder={`Hi ${pin.username}, I'm interested in "${pin.title}"...`}
							value={firstMessage}
							onChange={(e) => setFirstMessage(e.target.value)}
							className='min-h-[100px] mb-3 resize-none'
							autoFocus
						/>
						<Button
							onClick={handleSendFirstMessage}
							disabled={!firstMessage.trim()}
							className='w-full gap-2'>
							<Send className='h-4 w-4' />
							Send Message
						</Button>
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
};;

export default PinDetail;
