import { useParams, Link, useNavigate } from 'react-router-dom';
import {
	ArrowLeft,
	MapPin,
	Calendar,
	Star,
	Shield,
	Clock,
	MessageCircle,
	PenLine,
	Send,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import ListingDrawer from '@/components/ListingDrawer';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { type Pin, mockReviews } from '@/data/mockData';
import ReviewFormDialog from '@/components/ReviewFormDialog';
import { supabase } from '@/utils/supabaseClient';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SELECT_FIELDS = `*, users (username, avatar_url, verified, rating)`;

const mapRow = (row): Pin => ({
	...row,
	username: row.users?.username ?? 'Unknown',
	avatar_url: row.users?.avatar_url ?? '',
	verified: row.users?.verified ?? false,
	rating: row.users?.rating ?? 0,
});

interface UserProfile {
	id: string;
	username: string;
	avatar_url: string;
	verified: boolean;
	location: string;
	bio: string;
	created_at: string;
	response_time: string;
	rating: number;
	total_reviews: number;
	total_sales: number;
}

const Profile = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [sellerPins, setSellerPins] = useState<Pin[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isReviewOpen, setIsReviewOpen] = useState(false);

	// Message drawer
	const [messageDrawerOpen, setMessageDrawerOpen] = useState(false);
	const [firstMessage, setFirstMessage] = useState('');

	const isOwnProfile = user?.id === id;

	// Fetch profile + listings 
	useEffect(() => {
		if (!id) return;

		const load = async () => {
			setLoading(true);
			setError(null);

			const { data: profileData, error: profileError } = await supabase
				.from('users')
				.select('*')
				.eq('id', id)
				.single();

			if (profileError || !profileData) {
				setError(
					'This user may not exist or there was an error loading the profile.',
				);
				setLoading(false);
				return;
			}

			setProfile(profileData);

			const { data: pinsData } = await supabase
				.from('pins')
				.select(SELECT_FIELDS)
				.eq('user_id', id)
				.order('created_at', { ascending: false });

			setSellerPins((pinsData ?? []).map(mapRow));
			setLoading(false);
		};

		load();
	}, [id]);

	
	const handleSendFirstMessage = async () => {
		if (!user) {
			navigate('/login');
			return;
		}
		if (!firstMessage.trim() || !profile) return;

		try {
			const { data: existing } = await supabase
				.from('conversations')
				.select('id')
				.eq('buyer_id', user.id)
				.eq('seller_id', profile.id)
				.is('pin_id', null)
				.maybeSingle();

			let convoId: string;

			if (existing) {
				convoId = existing.id;
			} else {
				const { data: newConvo, error: convoError } = await supabase
					.from('conversations')
					.insert({
						buyer_id: user.id,
						seller_id: profile.id,
						last_activity: new Date().toISOString(),
					})
					.select('id')
					.single();

				if (convoError || !newConvo) {
					toast.error('Could not start conversation.');
					return;
				}
				convoId = newConvo.id;
			}

			const { error: msgError } = await supabase.from('messages').insert({
				conversation_id: convoId,
				sender_id: user.id,
				content: firstMessage.trim(),
			});

			if (msgError) {
				toast.error('Could not send message.');
				return;
			}

			await supabase
				.from('conversations')
				.update({ last_activity: new Date().toISOString() })
				.eq('id', convoId);

			setMessageDrawerOpen(false);
			setFirstMessage('');
			navigate(`/messages?convo=${convoId}`);
		} catch (err) {
			console.error(err);
			toast.error('Something went wrong.');
		}
	};

	const renderStars = (rating: number) =>
		Array.from({ length: 5 }, (_, i) => (
			<Star
				key={i}
				className={`h-4 w-4 ${
					i < Math.floor(rating)
						? 'fill-warning text-warning'
						: 'text-muted-foreground'
				}`}
			/>
		));

	
	if (loading) {
		return (
			<div className='min-h-screen bg-background'>
				<Navbar />
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
				<div className='container px-4 py-12 flex justify-center'>
					<Spinner className='size-6' />
				</div>
			</div>
		);
	}

	if (error || !profile) {
		return (
			<div className='min-h-screen bg-background'>
				<Navbar />
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
				<div className='container px-4 py-3 text-muted-foreground text-sm'>
					{error ?? 'Profile not found.'}
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-background'>
			<Navbar />

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

			{/*  Profile Header  */}
			<section className='px-4 pb-6'>
				<div className='container max-w-4xl'>
					<div className='card-tactile p-6'>
						<div className='flex items-start gap-4'>
							<Avatar className='size-24'>
								<AvatarImage src={profile.avatar_url} />
								<AvatarFallback>
									<Spinner className='size-4' />
								</AvatarFallback>
							</Avatar>
							<div className='flex-1 min-w-0'>
								<div className='flex items-center gap-2 flex-wrap'>
									<h1 className='font-display text-xl font-bold text-foreground'>
										{profile.username}
									</h1>
									{profile.verified && (
										<span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium'>
											<Shield className='h-3 w-3' />
											Verified
										</span>
									)}
								</div>

								<div className='flex items-center gap-2 mt-1'>
									<div className='flex'>{renderStars(profile.rating ?? 0)}</div>
									<span className='text-sm font-medium text-foreground'>
										{profile.rating ?? '—'}
									</span>
									<span className='text-xs text-muted-foreground'>
										({profile.total_reviews ?? 0} reviews)
									</span>
								</div>

								<div className='flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground'>
									{profile.location && (
										<span className='flex items-center gap-1'>
											<MapPin className='h-3 w-3' />
											{profile.location}
										</span>
									)}
									<span className='flex items-center gap-1'>
										<Calendar className='h-3 w-3' />
										Joined {profile.created_at.split('T')[0]}
									</span>
								</div>
							</div>
						</div>

						{profile.bio && (
							<p className='text-sm text-muted-foreground mt-4'>
								{profile.bio}
							</p>
						)}

						<div className='grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border'>
							<div className='text-center'>
								<div className='text-2xl font-bold text-foreground'>
									{profile.total_sales ?? 0}
								</div>
								<div className='text-xs text-muted-foreground'>Sales</div>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-foreground'>
									{profile.total_reviews ?? 0}
								</div>
								<div className='text-xs text-muted-foreground'>Reviews</div>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-foreground'>
									{profile.rating ?? '—'}
								</div>
								<div className='text-xs text-muted-foreground'>Rating</div>
							</div>
						</div>

						<div className='flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-border'>
							{profile.response_time && (
								<div className='flex items-center gap-2 text-sm text-muted-foreground'>
									<Clock className='h-4 w-4' />
									Typical response time:&nbsp;
									{profile.response_time} hrs
								</div>
							)}
							{!isOwnProfile && (
								<div className='flex gap-2 sm:ml-auto'>
									<Button
										size='sm'
										variant='outline'
										className='gap-2'
										onClick={() => setIsReviewOpen(true)}>
										<PenLine className='h-4 w-4' />
										Write Review
									</Button>
									<Button
										size='sm'
										className='gap-2'
										onClick={() => {
											if (!user) {
												navigate('/login');
												return;
											}
											setMessageDrawerOpen(true);
										}}>
										<MessageCircle className='h-4 w-4' />
										Message
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			</section>

			{/*  Reviews (mock)  */}
			<section className='px-4 pb-6'>
				<div className='container max-w-4xl'>
					<h2 className='font-display text-lg font-semibold text-foreground mb-4'>
						Recent Reviews
					</h2>
					<div className='space-y-3'>
						{mockReviews.map((review) => (
							<div
								key={review.id}
								className='card-tactile p-4'>
								<div className='flex items-start gap-3'>
									<Link
										to={`/profile/${review.reviewerId}`}
										className='shrink-0'>
										<div className='w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-lg'>
											{review.reviewerAvatar}
										</div>
									</Link>
									<div className='flex-1 min-w-0'>
										<div className='flex items-center justify-between'>
											<Link
												to={`/profile/${review.reviewerId}`}
												className='font-medium text-foreground hover:text-primary transition-colors'>
												{review.reviewer}
											</Link>
											<span className='text-xs text-muted-foreground'>
												{review.date}
											</span>
										</div>
										<div className='flex mt-1'>
											{renderStars(review.rating)}
										</div>
										<p className='text-sm text-muted-foreground mt-2'>
											{review.comment}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/*  Listings  */}
			<section className='px-4 pb-6'>
				<div className='container max-w-4xl'>
					<h2 className='font-display text-lg font-semibold text-foreground mb-4'>
						{profile.username}'s Listings ({sellerPins.length})
					</h2>
					{sellerPins.length > 0 ? (
						<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
							{sellerPins.map((pin) => (
								<ListingCard
									key={pin.id}
									pin={pin}
									onClick={() => {
										setSelectedPin(pin);
										setIsDrawerOpen(true);
									}}
								/>
							))}
						</div>
					) : (
						<div className='card-tactile p-8 text-center'>
							<p className='text-muted-foreground'>No listings yet</p>
						</div>
					)}
				</div>
			</section>

			{/*  Listing Drawer  */}
			<ListingDrawer
				pin={selectedPin}
				isOpen={isDrawerOpen}
				onClose={() => setIsDrawerOpen(false)}
			/>

			{/*  Review Dialog  */}
			<ReviewFormDialog
				open={isReviewOpen}
				onOpenChange={setIsReviewOpen}
				sellerName={profile.username}
			/>

			{/*  Message Drawer  */}
			<Drawer
				open={messageDrawerOpen}
				onOpenChange={setMessageDrawerOpen}>
				<DrawerContent>
					<div className='p-5 pb-8 max-w-lg mx-auto w-full'>
						{/* Seller header */}
						<div className='flex items-center gap-3 mb-4 p-3 rounded-xl bg-muted/60'>
							{profile.avatar_url ? (
								<img
									src={profile.avatar_url}
									alt={profile.username}
									className='w-11 h-11 rounded-full object-cover shrink-0'
								/>
							) : (
								<div className='w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0'>
									{profile.username?.[0]?.toUpperCase() ?? '?'}
								</div>
							)}
							<div className='flex-1 min-w-0'>
								<div className='font-medium text-foreground text-sm truncate'>
									{profile.username}
								</div>
								<div className='flex items-center gap-1.5 mt-0.5'>
									<span className='relative flex h-2.5 w-2.5 shrink-0'>
										<span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75' />
										<span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500' />
									</span>
									<span className='text-xs text-muted-foreground'>Awaiting to send</span>
								</div>
							</div>
						</div>

						{/* Message input */}
						<Textarea
							placeholder={`Hi ${profile.username}, I wanted to reach out...`}
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
};

export default Profile;
