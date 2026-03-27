import { Heart, MapPin, Star, Clock, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Pin } from '@/data/mockData';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Spinner } from './ui/spinner';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { toast } from 'sonner';

interface ListingCardProps {
	pin: Pin;
	to?: string;
	onClick?: () => void;
	hideSave?: boolean;
}

const ListingCard = ({ pin, to, onClick, hideSave }: ListingCardProps) => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { favoritedIds, toggle } = useFavorites();
	const isSaved = favoritedIds.has(pin.id);     
	const [savingInProgress, setSavingInProgress] = useState(false);
	const [hovered, setHovered] = useState(false);

	const formatTimeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const hours = diff / (1000 * 60 * 60);
		if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ago`;
		if (hours < 24) return `${Math.floor(hours)}h ago`;
		if (hours < 48) return 'Yesterday';
		return `${Math.floor(hours / 24)}d ago`;
	};

	const conditionStyles: Record<string, string> = {
		new: 'bg-success-light text-success',
		'like-new': 'bg-accent text-accent-foreground',
		good: 'bg-warning-light text-warning',
		fair: 'bg-muted text-muted-foreground',
	};

  const handleSaveClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!user) {
			toast.error('Sign in to save listings');
			return;
		}
		if (savingInProgress) return;

		setSavingInProgress(true);
		toggle(pin.id); // optimistic update via context

		try {
			if (!isSaved) {
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
			toggle(pin.id); // revert on failure
			toast.error('Failed to update saved listing');
		} finally {
			setSavingInProgress(false);
		}
	};

	const handleActivate = () => {
		if (onClick) return onClick();
		if (to) return navigate(to);
	};

	const isTradeOnly = pin.listing_type === 'trade';

	return (
		<article
			onClick={handleActivate}
			onKeyDown={(e) => {
				if (!to || onClick) return;
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					navigate(to);
				}
			}}
			role={to && !onClick ? 'link' : undefined}
			tabIndex={to && !onClick ? 0 : undefined}
			className='group cursor-pointer card-tactile overflow-hidden h-full flex flex-col'>
			{/* Image */}
			<div className='relative aspect-square overflow-hidden bg-muted'>
				<img
					src={!hovered ? pin?.images[0] : pin.images[1] || pin?.images[0]}
					alt={pin.title}
					onMouseEnter={() => setHovered(true)}
					onMouseLeave={() => setHovered(false)}
					loading='lazy'
					className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
				/>

				{/* Save Button */}
				{!hideSave && (
					<button
						onClick={handleSaveClick}
						disabled={savingInProgress}
						className={cn(
							'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all',
							isSaved
								? 'bg-destructive text-destructive-foreground'
								: 'bg-card/90 backdrop-blur-sm text-muted-foreground hover:text-foreground',
						)}>
						<Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
					</button>
				)}

				{/* Trade Badge */}
				{isTradeOnly && (
					<div className='absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium'>
						Trade Only
					</div>
				)}

				{/* Condition Badge */}
				<div
					className={cn(
						'absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium capitalize',
						conditionStyles[pin.condition] ?? 'bg-muted text-muted-foreground',
					)}>
					{pin.condition.replace('-', ' ')}
				</div>
			</div>

			{/* Content */}
			<div className='p-3 flex-1 flex flex-col gap-2'>
				<h3 className='font-display text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors'>
					{pin.title}
				</h3>

				<div className='flex items-center justify-between'>
					<span className='text-base font-bold text-primary'>
						{isTradeOnly ? 'Trade' : `$${pin.price}`}
					</span>
					<div className='flex items-center gap-1 text-xs text-muted-foreground'>
						<MapPin className='h-3 w-3' />
						<span className='truncate max-w-[80px]'>{pin.location}</span>
					</div>
				</div>

				<div className='flex items-center gap-1 text-[10px] text-muted-foreground'>
					<Clock className='h-3 w-3' />
					<span>{formatTimeAgo(pin.created_at)}</span>
				</div>

				{/* Seller */}
				<Link
					to={`/profile/${pin.user_id}`}
					onClick={(e) => e.stopPropagation()}
					className='mt-auto flex items-center gap-2 pt-2 border-t border-border hover:opacity-80 transition-opacity'>
					<Avatar className='size-6'>
						<AvatarImage src={pin.avatar_url} />
						<AvatarFallback>
							<Spinner className='size-4' />
						</AvatarFallback>
					</Avatar>
					<span className='text-xs text-muted-foreground truncate flex-1 inline-flex items-center gap-1'>
						{pin.username}
						{pin.verified && (
							<span
								className='group/badge relative shrink-0'
								title='Verified'>
								<Shield className='h-3 w-3 text-primary' />
								<span className='absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover/badge:opacity-100 transition-opacity whitespace-nowrap pointer-events-none'>
									Verified
								</span>
							</span>
						)}
					</span>
					{pin.rating > 0 && (
						<div className='flex items-center gap-1 text-sm text-muted-foreground'>
							<Star className='h-3.5 w-3.5 fill-warning text-warning' />
							<span>{pin.rating}</span>
						</div>
					)}
				</Link>
			</div>
		</article>
	);
};

export default ListingCard;
