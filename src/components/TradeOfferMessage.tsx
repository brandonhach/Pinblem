import { useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TradeOffer {
	id: string;
	name: string;
	condition: string;
	description: string | null;
	photos_url: string[] | null;
	created_at: string;
}

interface TradeOfferMessageProps {
	offer: TradeOffer;
	isOwn: boolean; // true if current user sent this offer
}

const conditionStyles: Record<string, string> = {
	new: 'bg-success-light text-success',
	'like-new': 'bg-accent text-accent-foreground',
	good: 'bg-warning-light text-warning',
	fair: 'bg-muted text-muted-foreground',
};

const TradeOfferMessage = ({ offer, isOwn }: TradeOfferMessageProps) => {
	const [detailOpen, setDetailOpen] = useState(false);
	const [lightboxOpen, setLightboxOpen] = useState(false);
	const [lightboxIndex, setLightboxIndex] = useState(0);
	const [carouselIndex, setCarouselIndex] = useState(0);

	const photos = offer.photos_url ?? [];
	const hasPhotos = photos.length > 0;

	const openLightbox = (i: number) => {
		setLightboxIndex(i);
		setLightboxOpen(true);
	};

	return (
		<>
			{/* Trade Offer Bubble */}
			<div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
				<button
					onClick={() => setDetailOpen(true)}
					className={cn(
						'lg:max-w-[40%] max-w-[60%] text-left rounded-2xl overflow-hidden border transition-all hover:shadow-md active:scale-[0.98]',
						isOwn
							? 'bg-primary/10 border-primary/30 rounded-br-md'
							: 'bg-card border-border rounded-bl-md',
					)}>
					{/* Header */}
					<div
						className={cn(
							'flex items-center gap-2 px-4 py-2.5 border-b',
							isOwn
								? 'border-primary/20 bg-primary/10'
								: 'border-border bg-muted/40',
						)}>
						<div
							className={cn(
								'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
								isOwn
									? 'bg-primary text-primary-foreground'
									: 'bg-muted text-muted-foreground',
							)}>
							<RefreshCw className='h-3 w-3' />
						</div>
						<span className='text-xs font-semibold text-foreground uppercase tracking-wide'>
							Trade Offer
						</span>
						<span className='text-[10px] text-muted-foreground ml-auto'>
							Tap to view
						</span>
					</div>

					{/* Preview image */}
					{hasPhotos && (
						<div className='relative aspect-video w-full bg-muted overflow-hidden'>
							<img
								src={photos[0]}
								alt={offer.name}
								className='w-full h-full object-cover'
							/>
							{photos.length > 1 && (
								<div className='absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full'>
									+{photos.length - 1} more
								</div>
							)}
						</div>
					)}

					{/* Body */}
					<div className='px-4 py-3 space-y-1.5'>
						<p className='font-semibold text-sm text-foreground line-clamp-1'>
							{offer.name}
						</p>
						<span
							className={cn(
								'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
								conditionStyles[offer.condition] ??
									'bg-muted text-muted-foreground',
							)}>
							{offer.condition.replace('-', ' ')}
						</span>
						{offer.description && (
							<p className='text-xs text-muted-foreground line-clamp-2'>
								{offer.description}
							</p>
						)}
					</div>
				</button>
			</div>

			{/* Detail Modal */}
			<Dialog
				open={detailOpen}
				onOpenChange={setDetailOpen}>
				<DialogContent className='sm:max-w-md max-h-[90vh] overflow-y-auto p-0'>
					{/* Header */}
					<div className='flex items-center gap-3 p-5 border-b border-border'>
						<div className='w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
							<RefreshCw className='h-4 w-4 text-primary' />
						</div>
						<div>
							<h2 className='font-display font-semibold text-foreground text-base'>
								Trade Offer
							</h2>
							<p className='text-xs text-muted-foreground'>
								{new Date(offer.created_at).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric',
									hour: 'numeric',
									minute: '2-digit',
								})}
							</p>
						</div>
					</div>

					{/* Image carousel */}
					{hasPhotos && (
						<div className='relative aspect-square bg-muted'>
							<img
								src={photos[carouselIndex]}
								alt={offer.name}
								className='w-full h-full object-cover cursor-zoom-in'
								onClick={() => openLightbox(carouselIndex)}
							/>
							{photos.length > 1 && (
								<>
									<button
										onClick={() =>
											setCarouselIndex((i) =>
												i > 0 ? i - 1 : photos.length - 1,
											)
										}
										className='absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors'>
										<ChevronLeft className='h-4 w-4' />
									</button>
									<button
										onClick={() =>
											setCarouselIndex((i) =>
												i < photos.length - 1 ? i + 1 : 0,
											)
										}
										className='absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors'>
										<ChevronRight className='h-4 w-4' />
									</button>
									{/* Dots */}
									<div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5'>
										{photos.map((_, i) => (
											<button
												key={i}
												onClick={() => setCarouselIndex(i)}
												className={cn(
													'w-1.5 h-1.5 rounded-full transition-colors',
													i === carouselIndex ? 'bg-white' : 'bg-white/40',
												)}
											/>
										))}
									</div>
								</>
							)}
						</div>
					)}

					{/* Thumbnail strip */}
					{photos.length > 1 && (
						<div className='flex gap-2 px-5 pt-3 overflow-x-auto'>
							{photos.map((src, i) => (
								<img
									key={i}
									src={src}
									alt=''
									onClick={() => setCarouselIndex(i)}
									className={cn(
										'w-14 h-14 rounded-lg object-cover shrink-0 border-2 cursor-pointer transition-colors',
										i === carouselIndex
											? 'border-primary'
											: 'border-transparent hover:border-primary/50',
									)}
								/>
							))}
						</div>
					)}

					{/* Details */}
					<div className='p-5 space-y-4'>
						<div className='flex items-start justify-between gap-3'>
							<h3 className='font-display font-semibold text-foreground text-lg leading-tight'>
								{offer.name}
							</h3>
							<span
								className={cn(
									'px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0',
									conditionStyles[offer.condition] ??
										'bg-muted text-muted-foreground',
								)}>
								{offer.condition.replace('-', ' ')}
							</span>
						</div>

						{offer.description && (
							<div>
								<p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1'>
									Description
								</p>
								<p className='text-sm text-foreground leading-relaxed'>
									{offer.description}
								</p>
							</div>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/*  Lightbox  */}
			{lightboxOpen && (
				<div
					className='fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4'
					onClick={() => setLightboxOpen(false)}>
					<button
						className='absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors'
						onClick={() => setLightboxOpen(false)}>
						<X className='h-4 w-4' />
					</button>
					{photos.length > 1 && (
						<>
							<button
								className='absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors'
								onClick={(e) => {
									e.stopPropagation();
									setLightboxIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
								}}>
								<ChevronLeft className='h-5 w-5' />
							</button>
							<button
								className='absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors'
								onClick={(e) => {
									e.stopPropagation();
									setLightboxIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
								}}>
								<ChevronRight className='h-5 w-5' />
							</button>
						</>
					)}
					<img
						src={photos[lightboxIndex]}
						alt=''
						className='max-w-full max-h-[90vh] object-contain rounded-lg'
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</>
	);
};

export default TradeOfferMessage;
