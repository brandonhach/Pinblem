import {
	X,
	Heart,
	Share2,
	MapPin,
	Star,
	Eye,
	ChevronLeft,
	ChevronRight,
	Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { mockPins, type Pin } from '@/data/mockData';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Spinner } from './ui/spinner';

interface ListingDrawerProps {
	pin: Pin | null;
	isOpen: boolean;
	onClose: () => void;
}

const ListingDrawer = ({ pin, isOpen, onClose }: ListingDrawerProps) => {
	const { user } = useAuth();
	const [isSaved, setIsSaved] = useState(false);
	const [savingInProgress, setSavingInProgress] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [similarPins, setSimilarPins] = useState<Pin[]>([]);

	// Sync saved state when pin changes
	useEffect(() => {
		setIsSaved(pin?.isFavorite ?? false);
		setCurrentImageIndex(0);
		setSimilarPins([mockPins[1], mockPins[2], mockPins[3]]); // Mock similar pins for now
	}, [pin?.id]);

	// Fetch similar pins when drawer opens
	// useEffect(() => {
	// 	if (!pin || !isOpen) return;

	// 	const fetchSimilar = async () => {
	// 		const { data, error } = await supabase
	// 			.from('pins')
	// 			.select(`*, users ( username, avatar_url )`)
	// 			.eq('category', pin.category)
	// 			.neq('id', pin.id)
	// 			.limit(4);

	// 		if (error) {
	// 			console.error(error);
	// 			return;
	// 		}

	// 		const mapped: Pin[] = (data ?? []).map((row) => ({
	// 			...row,
	// 			seller: row.users?.username ?? 'Unknown',
	// 			avatar_url: row.users?.avatar_url ?? '',
	// 		}));

	// 		setSimilarPins(mapped);
	// 	};

	// 	fetchSimilar();
  // }, [pin?.id, isOpen]);


	if (!pin) return null;

	const isTradeOnly = pin.listing_type === 'trade';
	const images = pin.images ?? [];

	const conditionStyles: Record<string, string> = {
		new: 'bg-success-light text-success',
		'like-new': 'bg-accent text-accent-foreground',
		good: 'bg-warning-light text-warning',
		fair: 'bg-muted text-muted-foreground',
	};

	const handleSaveClick = async () => {
		if (!user) {
			toast.error('Sign in to save listings');
			return;
		}
		if (savingInProgress) return;

		setSavingInProgress(true);
		const next = !isSaved;
		setIsSaved(next);

		try {
			if (next) {
				const { error } = await supabase
					.from('user_favorites')
					.insert({ user_id: user.id, pin_id: pin.id });
				if (error) throw error;
			} else {
				const { error } = await supabase
					.from('user_favorites')
					.delete()
					.eq('user_id', user.id)
					.eq('pin_id', pin.id);
				if (error) throw error;
			}
		} catch (err) {
			console.error(err);
			setIsSaved(!next);
			toast.error('Failed to update saved listing');
		} finally {
			setSavingInProgress(false);
		}
	};

	const handleShare = async () => {
		try {
			await navigator.clipboard.writeText(
				`${window.location.origin}/pin/${pin.id}`,
			);
			toast.success('Link copied to clipboard');
		} catch {
			toast.error('Failed to copy link');
		}
	};

	return (
		<Sheet
			open={isOpen}
			onOpenChange={onClose}>
			<SheetContent
				side='right'
				className='w-full sm:w-[540px] sm:max-w-[540px] p-0 overflow-y-auto'>
				{/* Close Button */}
				<button
					onClick={onClose}
					className='absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors'>
					<X className='h-5 w-5' />
				</button>

				{/* Image Carousel */}
				<div className='relative aspect-square bg-muted'>
					{images.length > 0 ? (
						<img
							src={images[currentImageIndex]}
							alt={pin.title}
							className='w-full h-full object-cover'
						/>
					) : (
						<div className='w-full h-full flex items-center justify-center text-muted-foreground text-sm'>
							No image
						</div>
					)}

					{/* Carousel Navigation */}
					{images.length > 1 && (
						<>
							<button
								onClick={() =>
									setCurrentImageIndex((i) =>
										i > 0 ? i - 1 : images.length - 1,
									)
								}
								className='absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors'>
								<ChevronLeft className='h-5 w-5' />
							</button>
							<button
								onClick={() =>
									setCurrentImageIndex((i) =>
										i < images.length - 1 ? i + 1 : 0,
									)
								}
								className='absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors'>
								<ChevronRight className='h-5 w-5' />
							</button>
							<div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2'>
								{images.map((_, i) => (
									<button
										key={i}
										onClick={() => setCurrentImageIndex(i)}
										className={cn(
											'w-2 h-2 rounded-full transition-colors',
											i === currentImageIndex ? 'bg-primary' : 'bg-card/60',
										)}
									/>
								))}
							</div>
						</>
					)}

					{/* Actions */}
					<div className='absolute top-4 right-4 flex gap-2'>
						<button
							onClick={handleSaveClick}
							disabled={savingInProgress}
							className={cn(
								'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
								isSaved
									? 'bg-destructive text-destructive-foreground'
									: 'bg-card/90 backdrop-blur-sm text-foreground hover:bg-card',
							)}>
							<Heart className={cn('h-5 w-5', isSaved && 'fill-current')} />
						</button>
						<button
							onClick={handleShare}
							className='w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-card transition-colors'>
							<Share2 className='h-5 w-5' />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className='p-6 space-y-6'>
					{/* Header */}
					<div className='space-y-2'>
						<div className='flex items-start justify-between gap-4'>
							<h2 className='font-display text-xl font-semibold text-foreground'>
								{pin.title}
							</h2>
							<span
								className={cn(
									'px-3 py-1 rounded-full text-xs font-medium capitalize shrink-0',
									conditionStyles[pin.condition] ??
										'bg-muted text-muted-foreground',
								)}>
								{pin.condition.replace('-', ' ')}
							</span>
						</div>

						<div className='flex items-center gap-4'>
							<span className='text-2xl font-bold text-primary'>
								{isTradeOnly ? 'Trade Only' : `$${pin.price}`}
							</span>
							<div className='flex items-center gap-1 text-sm text-muted-foreground'>
								<MapPin className='h-4 w-4' />
								{pin.location}
							</div>
						</div>
					</div>

					{/* Description */}
					<div className='space-y-2'>
						<h3 className='font-medium text-foreground'>Description</h3>
						<p className='text-sm text-muted-foreground leading-relaxed'>
							{pin.description}
						</p>
					</div>

					{/* Seller Card */}
					<Link
						to={`/profile/${pin.user_id}`}
						onClick={onClose}
						className='block p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors'>
						<div className='flex items-center gap-3'>
							<Avatar className='w-12 h-12'>
								<AvatarImage src={pin.avatar_url} />
								<AvatarFallback>
									<Spinner className='size-4' />
								</AvatarFallback>
							</Avatar>
							<div className='flex-1 min-w-0'>
								<div className='flex items-center gap-2'>
									<span className='font-medium text-foreground'>
										{pin.username}
									</span>
									{pin.verified && (
										<span className='px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary inline-flex items-center gap-1'>
											<Shield className='h-3 w-3' /> Verified
										</span>
									)}
								</div>
								{pin.rating && (
									<div className='flex items-center gap-1 text-sm text-muted-foreground'>
										<Star className='h-3.5 w-3.5 fill-warning text-warning' />
										<span>{pin.rating} (156)&emsp;·&emsp;456 sales</span>
									</div>
								)}
							</div>
						</div>
					</Link>

					{/* CTA */}
					<Link to={`/pin/${pin.id}`}>
						<Button className='w-full h-12 text-base gap-2'>
							<Eye className='size-5' />
							View more
						</Button>
					</Link>

					{/* Similar Items */}
					{similarPins.length > 0 && (
						<div className='space-y-4 pt-4 border-t border-border'>
							<h3 className='font-display font-medium text-foreground'>
								Similar Items
							</h3>
							<div className='grid grid-cols-2 gap-3 items-stretch auto-rows-fr'>
								{similarPins.map((item) => {
									const itemIsTradeOnly = item.listing_type === 'trade';
									return (
										<Link
											key={item.id}
											to={`/pin/${item.id}`}
											onClick={onClose}
											className='group rounded-lg overflow-hidden border border-border bg-card hover:shadow-md transition-shadow'>
											<div className='relative aspect-square bg-muted'>
												<img
													src={item.images?.[0]}
													alt={item.title}
													loading='lazy'
													className='w-full h-full object-cover'
												/>
												{itemIsTradeOnly && (
													<div className='absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium'>
														Trade
													</div>
												)}
												<div
													className={cn(
														'absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
														conditionStyles[item.condition] ??
															'bg-muted text-muted-foreground',
													)}>
													{item.condition.replace('-', ' ')}
												</div>
											</div>
											<div className='p-2 space-y-1'>
												<p className='text-xs text-foreground line-clamp-2 group-hover:text-primary transition-colors'>
													{item.title}
												</p>
												<p className='text-sm font-semibold text-primary'>
													{itemIsTradeOnly ? 'Trade' : `$${item.price}`}
												</p>
												<div className='flex items-center gap-1 text-[10px] text-muted-foreground'>
													<MapPin className='h-3 w-3' />
													<span className='truncate'>{item.location}</span>
												</div>
											</div>
										</Link>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default ListingDrawer;
