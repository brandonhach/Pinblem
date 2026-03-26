import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ListingCard from '@/components/ListingCard';
import ListingDrawer from '@/components/ListingDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { categories, Pin } from '@/data/mockData';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'sonner';

const PAGE_SIZE = 24;

const Search = () => {
	const [pins, setPins] = useState<Pin[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [showFilters, setShowFilters] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [selectedListingType, setSelectedListingType] = useState('all');
	const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000]);
	const [sortBy, setSortBy] = useState('newest');
	const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
	const [selectedLocation, setSelectedLocation] = useState('all');
	const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const loadMoreRef = useRef<HTMLDivElement | null>(null);

	// --- Fetch all pins with seller info ---
	const fetchPins = useCallback(async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from('pins')
				.select(
					`
          *,
          users (
            username,
            avatar_url,
            verified,
            rating
          )
        `,
				)
				.order('created_at', { ascending: false });

			if (error) throw error;

			const mapped: Pin[] = (data ?? []).map((row) => ({
				...row,
				username: row.users?.username ?? 'Unknown',
        avatar_url: row.users?.avatar_url ?? '',
        verified: row.users?.verified ?? false,
        rating: row.users?.rating ?? 'N/A',
        // Map other fields as needed
        // Ensure created_at is a string if your Pin type expects that
			}));

			setPins(mapped);
		} catch (err) {
			console.error(err);
			toast.error('Failed to load listings');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchPins();
	}, [fetchPins]);

	// --- Unique locations derived from fetched pins ---
	const locationOptions = useMemo(() => {
		const locs = [...new Set(pins.map((p) => p.location))].sort();
		return ['all', ...locs];
	}, [pins]);

	// --- Client-side filtering & sorting ---
	const filteredPins = useMemo(() => {
		let result = [...pins];

		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(pin) =>
					pin.title.toLowerCase().includes(query) ||
					pin.username.toLowerCase().includes(query) ||
					pin.location.toLowerCase().includes(query),
			);
		}

		if (selectedCategory !== 'all') {
			result = result.filter((pin) => pin.category === selectedCategory);
		}

		if (selectedListingType !== 'all') {
			if (selectedListingType === 'trade') {
				result = result.filter((pin) => pin.listing_type === 'trade');
			} else if (selectedListingType === 'buy') {
				result = result.filter((pin) => pin.listing_type !== 'trade');
			}
		}

		result = result.filter(
			(pin) =>
				pin.listing_type === 'trade' ||
				(pin.price !== null &&
					pin.price >= priceRange[0] &&
					pin.price <= priceRange[1]),
		);

		if (selectedConditions.length > 0) {
			result = result.filter((pin) =>
				selectedConditions.includes(pin.condition),
			);
		}

		if (selectedLocation !== 'all') {
			result = result.filter((pin) => pin.location === selectedLocation);
		}

		switch (sortBy) {
			case 'price-low':
				result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
				break;
			case 'price-high':
				result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
				break;
			case 'newest':
			default:
				result.sort(
					(a, b) =>
						new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
				);
				break;
		}

		return result;
	}, [
		pins,
		searchQuery,
		selectedCategory,
		selectedListingType,
		priceRange,
		sortBy,
		selectedConditions,
		selectedLocation,
	]);

	const canLoadMore = visibleCount < filteredPins.length;
	const visiblePins = filteredPins.slice(0, visibleCount);

	// Reset pagination when filters change
	useEffect(() => {
		setVisibleCount(PAGE_SIZE);
	}, [
		searchQuery,
		selectedCategory,
		selectedListingType,
		priceRange,
		sortBy,
		selectedConditions,
		selectedLocation,
	]);

	// Infinite scroll
	useEffect(() => {
		const el = loadMoreRef.current;
		if (!el || !canLoadMore) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries[0]?.isIntersecting || isLoadingMore) return;
				setIsLoadingMore(true);
				window.setTimeout(() => {
					setVisibleCount((v) => Math.min(v + PAGE_SIZE, filteredPins.length));
					setIsLoadingMore(false);
				}, 450);
			},
			{ root: null, rootMargin: '400px', threshold: 0 },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [canLoadMore, isLoadingMore, filteredPins.length]);

	const toggleCondition = (condition: string) => {
		setSelectedConditions((prev) =>
			prev.includes(condition)
				? prev.filter((c) => c !== condition)
				: [...prev, condition],
		);
	};

	const clearFilters = () => {
		setSelectedCategory('all');
		setSelectedListingType('all');
		setPriceRange([0, 200]);
		setSortBy('newest');
		setSelectedConditions([]);
		setSelectedLocation('all');
		setVisibleCount(PAGE_SIZE);
	};

	const hasActiveFilters =
		selectedCategory !== 'all' ||
		selectedListingType !== 'all' ||
		priceRange[0] !== 0 ||
		priceRange[1] !== 200 ||
		selectedConditions.length > 0 ||
		selectedLocation !== 'all';

	const handleCardClick = (pin: Pin) => {
		setSelectedPin(pin);
		setIsDrawerOpen(true);
	};

	// --- Loading skeletons ---
	const SkeletonGrid = () => (
		<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch auto-rows-fr'>
			{Array.from({ length: 8 }).map((_, i) => (
				<div
					key={i}
					className='card-tactile overflow-hidden h-full flex flex-col'>
					<div className='aspect-square bg-muted'>
						<Skeleton className='h-full w-full rounded-none' />
					</div>
					<div className='p-3 flex-1 flex flex-col gap-2'>
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
	);

	return (
		<div className='min-h-screen bg-background'>
			<Navbar />

			{/* Search Bar */}
			<div className='sticky top-16 z-40 bg-background border-b border-border px-4 py-3'>
				<div className='container max-w-4xl'>
					<div className='flex gap-2'>
						<div className='relative flex-1'>
							<SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
							<Input
								type='text'
								placeholder='Search pins, sellers, locations...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className='pl-10 pr-10'
							/>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery('')}
									className='absolute right-3 top-1/2 -translate-y-1/2'>
									<X className='h-4 w-4 text-muted-foreground' />
								</button>
							)}
						</div>
						<Button
							variant={showFilters ? 'default' : 'outline'}
							size='icon'
							onClick={() => setShowFilters(!showFilters)}>
							<SlidersHorizontal className='h-4 w-4' />
						</Button>
					</div>

					<div className='flex items-center justify-between mt-3'>
						<span className='text-sm text-muted-foreground'>
							{isLoading ? 'Loading...' : `${filteredPins.length} results`}
						</span>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className='text-sm bg-card border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary'>
							<option value='newest'>Newest</option>
							<option value='price-low'>Price: Low to High</option>
							<option value='price-high'>Price: High to Low</option>
						</select>
					</div>
				</div>
			</div>

			{/* Filters Panel */}
			{showFilters && (
				<div className='border-b border-border bg-card px-4 py-4'>
					<div className='container max-w-4xl space-y-4'>
						<div>
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Category
							</label>
							<div className='flex flex-wrap gap-2'>
								{categories.map((cat) => (
									<Button
										key={cat.id}
										variant={
											selectedCategory === cat.id ? 'default' : 'outline'
										}
										size='sm'
										onClick={() => setSelectedCategory(cat.id)}
										className='gap-1'>
										<span>{cat.emoji}</span>
										<span>{cat.label}</span>
									</Button>
								))}
							</div>
						</div>

						<div>
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Listing Type
							</label>
							<div className='flex gap-2'>
								{[
									{ value: 'all', label: 'All' },
									{ value: 'buy', label: 'For Sale' },
									{ value: 'trade', label: 'Trade Only' },
								].map((type) => (
									<Button
										key={type.value}
										variant={
											selectedListingType === type.value ? 'default' : 'outline'
										}
										size='sm'
										onClick={() => setSelectedListingType(type.value)}>
										{type.label}
									</Button>
								))}
							</div>
						</div>

						<div>
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Price Range: ${priceRange[0]} — ${priceRange[1]}
							</label>
							<div className='flex items-center gap-4'>
								<input
									type='range'
									min='0'
									max='200'
									value={priceRange[0]}
									onChange={(e) =>
										setPriceRange([parseInt(e.target.value), priceRange[1]])
									}
									className='flex-1 accent-primary'
								/>
								<input
									type='range'
									min='0'
									max='200'
									value={priceRange[1]}
									onChange={(e) =>
										setPriceRange([priceRange[0], parseInt(e.target.value)])
									}
									className='flex-1 accent-primary'
								/>
							</div>
						</div>

						<div>
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Condition
							</label>
							<div className='flex flex-wrap gap-2'>
								{['new', 'like-new', 'good', 'fair'].map((condition) => (
									<Button
										key={condition}
										variant={
											selectedConditions.includes(condition)
												? 'default'
												: 'outline'
										}
										size='sm'
										onClick={() => toggleCondition(condition)}
										className='capitalize'>
										{condition.replace('-', ' ')}
									</Button>
								))}
							</div>
						</div>

						<div>
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Location
							</label>
							<div className='flex flex-wrap gap-2'>
								{locationOptions.map((loc) => (
									<Button
										key={loc}
										variant={selectedLocation === loc ? 'default' : 'outline'}
										size='sm'
										onClick={() => setSelectedLocation(loc)}>
										{loc === 'all' ? 'All' : loc}
									</Button>
								))}
							</div>
						</div>

						{hasActiveFilters && (
							<Button
								variant='ghost'
								size='sm'
								onClick={clearFilters}
								className='text-destructive'>
								Clear All Filters
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Results */}
			<main className='container px-4 py-4'>
				<div className='max-w-4xl mx-auto'>
					{isLoading ? (
						<SkeletonGrid />
					) : filteredPins.length > 0 ? (
						<>
							<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch auto-rows-fr'>
								{visiblePins.map((pin) => (
									<ListingCard
										key={pin.id}
										pin={pin}
										onClick={() => handleCardClick(pin)}
									/>
								))}
								{isLoadingMore &&
									Array.from({ length: 4 }).map((_, i) => (
										<div
											key={`sk-${i}`}
											className='card-tactile overflow-hidden h-full flex flex-col'>
											<div className='aspect-square bg-muted'>
												<Skeleton className='h-full w-full rounded-none' />
											</div>
											<div className='p-3 flex-1 flex flex-col gap-2'>
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
							<div
								ref={loadMoreRef}
								className='py-6 flex items-center justify-center'>
								{canLoadMore ? (
									isLoadingMore ? (
										<div className='flex items-center gap-3 text-sm text-muted-foreground'>
											<div className='w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin' />
											Loading more…
										</div>
									) : (
										<span className='text-xs text-muted-foreground'>
											Scroll to load more
										</span>
									)
								) : (
									<span className='text-xs text-muted-foreground'>
										End of results
									</span>
								)}
							</div>
						</>
					) : (
						<div className='text-center py-12'>
							<div className='text-4xl mb-4'>🔍</div>
							<h3 className='text-lg font-semibold text-foreground'>
								No pins found
							</h3>
							<p className='text-sm text-muted-foreground mt-1'>
								Try adjusting your filters or search terms
							</p>
							<Button
								size='sm'
								onClick={clearFilters}
								className='mt-4'>
								Clear Filters
							</Button>
						</div>
					)}
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

export default Search;
