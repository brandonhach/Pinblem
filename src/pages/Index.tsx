import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import ListingDrawer from '@/components/ListingDrawer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { categories } from '@/data/mockData';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Pin } from '@/data/mockData';

const Index = () => {
	const { user } = useAuth();
	const [pins, setPins] = useState<Pin[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	useEffect(() => {
		const fetchLatest = async () => {
			setIsLoading(true);
			try {
				const [{ data: pinsData, error }, { data: favData }] =
					await Promise.all([
						supabase
							.from('pins')
							.select(`*, users ( username, avatar_url, verified, rating )`)
							.order('created_at', { ascending: false })
							.limit(8),
						user
							? supabase
									.from('user_favorites')
									.select('pin_id')
									.eq('user_id', user.id)
							: Promise.resolve({ data: [] }),
					]);

				if (error) throw error;

				const favSet = new Set((favData ?? []).map((f: { pin_id: string }) => f.pin_id));

				const mapped: Pin[] = (pinsData ?? []).map((row) => ({
					...row,
					username: row.users?.username ?? 'Unknown',
					avatar_url: row.users?.avatar_url ?? '',
					verified: row.users?.verified ?? false,
					rating: row.users?.rating ?? 0,
					isFavorite: favSet.has(row.id),
				}));

				setPins(mapped);
			} catch (err) {
				console.error(err);
				toast.error('Failed to load listings');
			} finally {
				setIsLoading(false);
			}
		};

		fetchLatest();
	}, [user]);

	const handleCardClick = (pin: Pin) => {
		setSelectedPin(pin);
		setIsDrawerOpen(true);
	};

	return (
		<div className='min-h-screen bg-background'>
			<Navbar />

			{/* Hero */}
			<section className='relative overflow-hidden bg-gradient-to-br from-accent via-background to-primary/5 py-12 md:py-20'>
				<div className='container px-4 flex lg:flex-row flex-col items-center gap-10'>
					<div className='max-w-2xl pr-4'>
						<div className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6'>
							<Sparkles className='h-4 w-4' />
							<span>The premium pin marketplace</span>
						</div>
						<h1 className='font-display text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight'>
							Trade & Collect
							<br />
							<span className='text-primary'>Rare Pins</span>
						</h1>
						<p className='text-muted-foreground text-base md:text-lg mb-8 max-w-lg'>
							Join thousands of collectors buying, selling, and trading unique
							pins. No clutter, no ads — just pins.
						</p>
						<div className='flex flex-wrap gap-3'>
							<Link to='/search'>
								<Button
									size='lg'
									className='gap-2'>
									Browse Listings
									<ArrowRight className='h-4 w-4' />
								</Button>
							</Link>
							<Link to='/create'>
								<Button
									variant='outline'
									size='lg'>
									Start Selling
								</Button>
							</Link>
						</div>
					</div>
					<img
						src='/images/hero.png'
						alt='Hero'
						className='lg:w-[60rem] lg:h-[30rem] object-cover border rounded-xl'
					/>				
				</div>
				<div className='absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none' />
				<div className='absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-accent/50 blur-3xl pointer-events-none sm:block hidden' />
			</section>

			{/* Categories */}
			<section className='py-8 border-b border-border'>
				<div className='container px-4'>
					<div className='flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide'>
						{categories.map((cat) => (
							<Link
								key={cat.id}
								to={`/search?category=${cat.id}`}
								className='flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors whitespace-nowrap'>
								<span>{cat.emoji}</span>
								<span>{cat.label}</span>
							</Link>
						))}
					</div>
				</div>
			</section>

			{/* Latest Listings */}
			<main className='container px-4 py-8'>
				<div className='flex items-center justify-between mb-6'>
					<h2 className='font-display text-xl font-semibold text-foreground'>
						Latest Listings
					</h2>
					<Link
						to='/search'
						className='text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1'>
						View all
						<ArrowRight className='h-4 w-4' />
					</Link>
				</div>

				{isLoading ? (
					<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
						{Array.from({ length: 8 }).map((_, i) => (
							<div
								key={i}
								className='card-tactile overflow-hidden flex flex-col'>
								<Skeleton className='aspect-square w-full' />
								<div className='p-3 flex flex-col gap-2'>
									<Skeleton className='h-4 w-5/6' />
									<div className='flex items-center justify-between'>
										<Skeleton className='h-5 w-14' />
										<Skeleton className='h-4 w-16' />
									</div>
									<Skeleton className='h-3 w-20' />
									<Skeleton className='h-8 w-full mt-auto' />
								</div>
							</div>
						))}
					</div>
				) : pins.length > 0 ? (
					<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
						{pins.map((pin) => (
							<ListingCard
								key={pin.id}
								pin={pin}
								onClick={() => handleCardClick(pin)}
							/>
						))}
					</div>
				) : (
					<div className='text-center py-12'>
						<div className='text-4xl mb-4'>📌</div>
						<h3 className='text-lg font-semibold text-foreground'>
							No listings yet
						</h3>
						<p className='text-sm text-muted-foreground mt-1'>
							Be the first to post a pin!
						</p>
						<Link to='/create'>
							<Button
								size='sm'
								className='mt-4'>
								Create Listing
							</Button>
						</Link>
					</div>
				)}

				<div className='flex justify-center mt-10'>
					<Link to='/search'>
						<Button
							variant='outline'
							size='lg'>
							Browse All Pins
						</Button>
					</Link>
				</div>
			</main>

			<ListingDrawer
				pin={selectedPin}
				isOpen={isDrawerOpen}
				onClose={() => setIsDrawerOpen(false)}
			/>
		</div>
	);
};

export default Index;
