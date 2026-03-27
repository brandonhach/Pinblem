import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import SignedOutGuard from '@/components/SignedOutGuard';
import ListingCard from '@/components/ListingCard';
import ListingDrawer from '@/components/ListingDrawer';
import { Button } from '@/components/ui/button';
import { type Pin } from '@/data/mockData';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const SavedItems = () => {
	const { user } = useAuth();
	const [savedPins, setSavedPins] = useState<Pin[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  interface FavoriteRow {
		pin_id: string;
		pins: Omit<Pin, 'username' | 'avatar_url' | 'verified' | 'rating'> & {
			users: {
				username: string;
				avatar_url: string;
				verified: boolean;
				rating: number;
			} | null;
		};
	}

	useEffect(() => {
		if (!user) return;

		const fetchFavorites = async () => {
			setLoading(true);

      const { data, error } = await supabase
      .from('user_favorites')
      .select('pin_id, pins(*, users(username, avatar_url, verified, rating))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

			if (error) {
				toast.error('Failed to load saved items');
				console.error(error);
      } else {
        const pins = (data as unknown as FavoriteRow[] ?? [])
					.map((row: FavoriteRow) => {
						const pin = row.pins;
						return {
							...pin,
							username: pin.users?.username ?? 'Unknown',
							avatar_url: pin.users?.avatar_url ?? '',
							verified: pin.users?.verified ?? false,
							rating: pin.users?.rating ?? 'N/A',
						};
					})
					.filter(Boolean) as Pin[];
          setSavedPins(pins);
        }
        setLoading(false);
      };
		fetchFavorites();
	}, [user]);

	const handleRemove = async (pinId: string) => {
		const { error } = await supabase
			.from('user_favorites')
			.delete()
			.eq('user_id', user?.id)
			.eq('pin_id', pinId);

		if (error) {
			toast.error('Failed to remove item');
			console.error(error);
			return;
		}

		setSavedPins((prev) => prev.filter((p) => p.id !== pinId));
		toast.success('Removed from saved items');
	};

	const handleCardClick = (pin: Pin) => {
		setSelectedPin(pin);
		setIsDrawerOpen(true);
	};

	return (
		<div className='min-h-screen bg-background'>
			<Navbar />
			<SignedOutGuard message='Sign in to view your saved items.'>
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

				<main className='container px-4 pb-8'>
					<div className='max-w-4xl mx-auto'>
						<div className='flex items-center gap-3 mb-6'>
							<Heart className='h-6 w-6 text-destructive fill-destructive' />
							<h1 className='font-display text-2xl font-bold text-foreground'>
								Saved Items
							</h1>
							{!loading && (
								<span className='text-sm text-muted-foreground'>
									({savedPins.length})
								</span>
							)}
						</div>

						{loading ? (
							<div className='card-tactile p-12 text-center text-muted-foreground text-sm'>
								Loading saved items...
							</div>
						) : savedPins.length === 0 ? (
							<div className='card-tactile p-12 text-center'>
								<div className='text-4xl mb-4'>💝</div>
								<h3 className='text-lg font-semibold text-foreground mb-2'>
									No saved items yet
								</h3>
								<p className='text-sm text-muted-foreground mb-4'>
									Tap the heart icon on any listing to save it here
								</p>
								<Link to='/search'>
									<Button>Browse Listings</Button>
								</Link>
							</div>
						) : (
							<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch auto-rows-fr'>
								{savedPins.map((pin) => (
									<div
										key={pin.id}
										className='relative group/saved h-full'>
										<ListingCard
											pin={pin}
											hideSave
											onClick={() => handleCardClick(pin)}
										/>
										<button
											onClick={() => handleRemove(pin.id)}
											className='absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center opacity-0 group-hover/saved:opacity-100 transition-opacity'>
											<Trash2 className='h-3.5 w-3.5' />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</main>

				<ListingDrawer
					pin={selectedPin}
					isOpen={isDrawerOpen}
					onClose={() => setIsDrawerOpen(false)}
				/>
			</SignedOutGuard>
		</div>
	);
};

export default SavedItems;
