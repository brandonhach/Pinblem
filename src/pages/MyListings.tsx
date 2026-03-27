import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
	ArrowLeft,
	ArrowUpCircle,
	Edit,
	Trash2,
	MapPin,
	Calendar,
	Upload,
	X,
	ImagePlus,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navbar from '@/components/Navbar';
import SignedOutGuard from '@/components/SignedOutGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Pin, categories } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// ── Schema (mirrors CreateListing) ──────────────────────────────────────────
const listingSchema = z.object({
	title: z.string().min(5, 'Title must be at least 5 characters').max(100),
	description: z
		.string()
		.min(20, 'Description must be at least 20 characters')
		.max(1000),
	category: z.string().min(1, 'Please select a category'),
	condition: z.enum(['new', 'like-new', 'good', 'fair'], {
		required_error: 'Please select a condition',
	}),
	listingType: z.enum(['sell', 'trade', 'both'], {
		required_error: 'Please select a listing type',
	}),
	price: z.string().optional(),
	location: z.string().min(2, 'Please enter your location').max(100),
});

type ListingFormData = z.infer<typeof listingSchema>;

type ImageEntry =
	| { type: 'existing'; url: string }
	| { type: 'new'; preview: string; file: File };

// ── Component ────────────────────────────────────────────────────────────────
const MyListings = () => {
	const { user } = useAuth();
	const [listings, setListings] = useState<Pin[]>([]);
	const [loading, setLoading] = useState(true);

	// Edit drawer state
	const [editTarget, setEditTarget] = useState<Pin | null>(null);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [imageEntries, setImageEntries] = useState<ImageEntry[]>([]);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ListingFormData>({ resolver: zodResolver(listingSchema) });

	const listingType = watch('listingType');

	// ── Fetch listings ─────────────────────────────────────────────────────────
	useEffect(() => {
		if (!user) return;
		const fetchListings = async () => {
			setLoading(true);
			const { data, error } = await supabase
				.from('pins')
				.select('*')
				.eq('user_id', user.id)
				.order('bumped_at', { ascending: false, nullsFirst: false })
				.order('created_at', { ascending: false });
			if (error) toast.error('Failed to load listings');
			else setListings(data ?? []);
			setLoading(false);
		};
		fetchListings();
	}, [user]);

	// ── Open edit drawer ───────────────────────────────────────────────────────
	const openEdit = (listing: Pin) => {
		setEditTarget(listing);
		reset({
			title: listing.title,
			description: listing.description,
			category: listing.category,
			condition: listing.condition,
			listingType: listing.listing_type,
			price: listing.price != null ? String(listing.price) : '',
			location: listing.location,
		});
		setImageEntries(listing.images.map((url) => ({ type: 'existing', url })));
		setDrawerOpen(true);
	};

	// ── Image helpers ──────────────────────────────────────────────────────────
	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;
		Array.from(files).forEach((file) => {
			if (imageEntries.length >= 5) {
				toast.error('Maximum 5 images allowed');
				return;
			}
			if (!file.type.startsWith('image/')) {
				toast.error('Images only');
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				toast.error(`${file.name} exceeds 5MB`);
				return;
			}
			setImageEntries((prev) => [
				...prev,
				{ type: 'new', preview: URL.createObjectURL(file), file },
			]);
		});
		e.target.value = '';
	};

	const removeImage = (index: number) => {
		setImageEntries((prev) => {
			const entry = prev[index];
			if (entry.type === 'new') URL.revokeObjectURL(entry.preview);
			return prev.filter((_, i) => i !== index);
		});
	};

	const getPreview = (entry: ImageEntry) =>
		entry.type === 'existing' ? entry.url : entry.preview;

	// ── Save edits ─────────────────────────────────────────────────────────────
	const onSave = async (data: ListingFormData) => {
		if (!editTarget || !user) return;
		if (imageEntries.length === 0) {
			toast.error('At least one image required');
			return;
		}

		try {
			const finalUrls: string[] = [];

			for (const entry of imageEntries) {
				if (entry.type === 'existing') {
					finalUrls.push(entry.url);
					continue;
				}
				const ext = entry.file.name.split('.').pop();
				const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
				const { error: upErr } = await supabase.storage
					.from('listings')
					.upload(filePath, entry.file, { upsert: false });
				if (upErr) throw upErr;
				const { data: urlData } = supabase.storage
					.from('listings')
					.getPublicUrl(filePath);
				finalUrls.push(urlData.publicUrl);
			}

			const payload = {
				title: data.title,
				description: data.description,
				category: data.category,
				condition: data.condition,
				listing_type: data.listingType,
				price:
					data.listingType !== 'trade' && data.price
						? parseFloat(data.price)
						: null,
				location: data.location,
				images: finalUrls,
			};

			const { error } = await supabase
				.from('pins')
				.update(payload)
				.eq('id', editTarget.id)
				.eq('user_id', user.id);
			if (error) throw error;

			setListings((prev) =>
				prev.map((p) =>
					p.id === editTarget.id ? ({ ...p, ...payload } as Pin) : p,
				),
			);
			toast.success('Listing updated!');
			setDrawerOpen(false);
		} catch (err) {
			console.error(err);
			toast.error('Failed to save changes.');
		}
	};

	// ── Bump ───────────────────────────────────────────────────────────────────
	const handleBump = async (pinId: string) => {
		const bumpedAt = new Date().toISOString();
		const { error } = await supabase
			.from('pins')
			.update({ bumped_at: bumpedAt })
			.eq('id', pinId)
			.eq('user_id', user?.id);
		if (error) {
			toast.error('Failed to bump listing');
			return;
		}
		setListings((prev) => {
			const updated = prev.map((p) =>
				p.id === pinId ? { ...p, bumped_at: bumpedAt } : p,
			);
			return updated.sort((a, b) => {
				const aT = a.bumped_at ?? a.created_at;
				const bT = b.bumped_at ?? b.created_at;
				return new Date(bT).getTime() - new Date(aT).getTime();
			});
		});
		toast.success('Listing bumped! 🚀');
	};

	// ── Delete ─────────────────────────────────────────────────────────────────
	const handleDelete = async (pinId: string) => {
		const { error } = await supabase
			.from('pins')
			.delete()
			.eq('id', pinId)
			.eq('user_id', user?.id);
		if (error) {
			toast.error('Failed to delete listing');
			return;
		}
		setListings((prev) => prev.filter((p) => p.id !== pinId));
		toast.success('Listing deleted');
	};

	const formatDate = (dateStr: string) =>
		new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});

	const conditionStyles: Record<string, string> = {
		new: 'bg-success-light text-success',
		'like-new': 'bg-accent text-accent-foreground',
		good: 'bg-warning-light text-warning',
		fair: 'bg-muted text-muted-foreground',
	};

	// ── Render ─────────────────────────────────────────────────────────────────
	return (
		<div className='min-h-screen bg-background'>
			<Navbar />
			<SignedOutGuard message='Sign in to view and manage your listings.'>
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
						<div className='flex items-center justify-between mb-6'>
							<h1 className='font-display text-2xl font-bold text-foreground'>
								My Listings
							</h1>
							<Link to='/create'>
								<Button className='gap-2'>
									<Edit className='h-4 w-4' />
									New Listing
								</Button>
							</Link>
						</div>

						{loading ? (
							<div className='card-tactile p-12 text-center text-muted-foreground text-sm'>
								Loading your listings...
							</div>
						) : listings.length === 0 ? (
							<div className='card-tactile p-12 text-center'>
								<div className='text-4xl mb-4'>📌</div>
								<h3 className='text-lg font-semibold text-foreground mb-2'>
									No listings yet
								</h3>
								<p className='text-sm text-muted-foreground mb-4'>
									Start selling your pins!
								</p>
								<Link to='/create'>
									<Button>Create Your First Listing</Button>
								</Link>
							</div>
						) : (
							<div className='space-y-4'>
								{listings.map((listing) => (
									<div
										key={listing.id}
										className='card-tactile overflow-hidden'>
										<div className='flex flex-col sm:flex-row'>
											<Link
												to={`/pin/${listing.id}`}
												className='sm:w-40 shrink-0'>
												<div className='aspect-video sm:aspect-square bg-muted overflow-hidden'>
													<img
														src={listing.images[0]}
														alt={listing.title}
														className='w-full h-full object-cover hover:scale-105 transition-transform'
													/>
												</div>
											</Link>

											<div className='flex-1 p-4 flex flex-col gap-3'>
												<div className='flex items-start justify-between gap-2'>
													<div>
														<Link to={`/pin/${listing.id}`}>
															<h3 className='font-display font-semibold text-foreground hover:text-primary transition-colors line-clamp-1'>
																{listing.title}
															</h3>
														</Link>
														<span className='text-lg font-bold text-primary'>
															{listing.listing_type === 'trade'
																? 'Trade Only'
																: listing.price != null
																	? `$${listing.price}`
																	: '—'}
														</span>
													</div>
													<span
														className={cn(
															'px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0',
															conditionStyles[listing.condition],
														)}>
														{listing.condition.replace('-', ' ')}
													</span>
												</div>

												<div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
													<span className='flex items-center gap-1'>
														<Calendar className='h-3 w-3' />
														Listed {formatDate(listing.created_at)}
													</span>
													<span className='flex items-center gap-1'>
														<MapPin className='h-3 w-3' />
														{listing.location}
													</span>
												</div>

												{listing.bumped_at && (
													<div className='flex items-center gap-1 text-xs text-primary font-medium'>
														<ArrowUpCircle className='h-3 w-3' />
														Bumped {formatDate(listing.bumped_at)}
													</div>
												)}

												<div className='flex flex-wrap gap-2 mt-auto pt-2 border-t border-border'>
													<Button
														size='sm'
														variant='outline'
														className='gap-1.5 text-primary border-primary/30 hover:bg-primary/10'
														onClick={() => handleBump(listing.id)}>
														<ArrowUpCircle className='h-3.5 w-3.5' />
														Bump
													</Button>
													<Button
														size='sm'
														variant='outline'
														className='gap-1.5'
														onClick={() => openEdit(listing)}>
														<Edit className='h-3.5 w-3.5' />
														Edit
													</Button>
													<Button
														size='sm'
														variant='outline'
														className='gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10'
														onClick={() => handleDelete(listing.id)}>
														<Trash2 className='h-3.5 w-3.5' />
														Delete
													</Button>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</main>

				{/* ── Edit Drawer ───────────────────────────────────────────────────── */}
				<Drawer
					open={drawerOpen}
					onOpenChange={setDrawerOpen}>
					<DrawerContent>
						<div className='p-5 pb-10 max-w-2xl mx-auto w-full max-h-[85dvh] lg:max-h-[95dvh] overflow-y-auto'>
							{/* Listing context header */}
							<div className='flex items-center gap-3 mb-5 p-3 rounded-xl bg-muted/60'>
								{editTarget?.images[0] && (
									<img
										src={editTarget.images[0]}
										alt={editTarget.title}
										className='w-11 h-11 rounded-lg object-cover shrink-0'
									/>
								)}
								<div className='flex-1 min-w-0'>
									<div className='font-medium text-foreground text-sm truncate'>
										{editTarget?.title}
									</div>
									<div className='text-xs text-muted-foreground mt-0.5'>
										Editing listing
									</div>
								</div>
							</div>

							<form
								onSubmit={handleSubmit(onSave)}
								className='space-y-5'>
								{/* Photos */}
								<div>
									<label className='text-sm font-medium text-foreground mb-2 block'>
										Photos ({imageEntries.length}/5)
									</label>
									<div className='grid grid-cols-4 gap-2'>
										{imageEntries.map((entry, index) => (
											<div
												key={index}
												className='relative aspect-square rounded-xl overflow-hidden bg-muted'>
												<img
													src={getPreview(entry)}
													alt=''
													className='w-full h-full object-cover'
												/>
												<button
													type='button'
													onClick={() => removeImage(index)}
													className='absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center'>
													<X className='h-2.5 w-2.5' />
												</button>
											</div>
										))}
										{imageEntries.length < 5 && (
											<label className='aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-card'>
												<ImagePlus className='h-6 w-6 text-muted-foreground' />
												<span className='text-xs text-muted-foreground mt-1'>
													Add
												</span>
												<input
													type='file'
													accept='image/*'
													multiple
													onChange={handleImageUpload}
													className='hidden'
												/>
											</label>
										)}
									</div>
									{imageEntries.length === 0 && (
										<p className='text-xs text-destructive mt-1'>
											At least one photo is required
										</p>
									)}
								</div>

								{/* Title */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Title
									</label>
									<Input
										{...register('title')}
										placeholder='e.g., Mickey Mouse 50th Anniversary Pin'
									/>
									{errors.title && (
										<p className='text-xs text-destructive mt-1'>
											{errors.title.message}
										</p>
									)}
								</div>

								{/* Description */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Description
									</label>
									<Textarea
										{...register('description')}
										rows={3}
										placeholder='Describe your pin...'
									/>
									{errors.description && (
										<p className='text-xs text-destructive mt-1'>
											{errors.description.message}
										</p>
									)}
								</div>

								{/* Category */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Category
									</label>
									<Select
										onValueChange={(v) =>
											setValue('category', v, { shouldValidate: true })
										}
										defaultValue={watch('category')}>
										<SelectTrigger>
											<SelectValue placeholder='Select a category' />
										</SelectTrigger>
										<SelectContent>
											{categories
												.filter((c) => c.id !== 'all')
												.map((cat) => (
													<SelectItem
														key={cat.id}
														value={cat.id}>
														{cat.emoji} {cat.label}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
									{errors.category && (
										<p className='text-xs text-destructive mt-1'>
											{errors.category.message}
										</p>
									)}
								</div>

								{/* Condition */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Condition
									</label>
									<div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
										{[
											{ value: 'new', label: 'New' },
											{ value: 'like-new', label: 'Like New' },
											{ value: 'good', label: 'Good' },
											{ value: 'fair', label: 'Fair' },
										].map((opt) => (
											<label
												key={opt.value}
												className='flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent'>
												<input
													{...register('condition')}
													type='radio'
													value={opt.value}
													className='accent-primary'
												/>
												<span className='text-sm text-foreground'>
													{opt.label}
												</span>
											</label>
										))}
									</div>
									{errors.condition && (
										<p className='text-xs text-destructive mt-1'>
											{errors.condition.message}
										</p>
									)}
								</div>

								{/* Listing Type */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Listing Type
									</label>
									<div className='grid grid-cols-3 gap-2'>
										{[
											{ value: 'sell', label: 'For Sale' },
											{ value: 'trade', label: 'Trade Only' },
											{ value: 'both', label: 'Sell or Trade' },
										].map((opt) => (
											<label
												key={opt.value}
												className='flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent'>
												<input
													{...register('listingType')}
													type='radio'
													value={opt.value}
													className='accent-primary'
												/>
												<span className='text-sm text-foreground'>
													{opt.label}
												</span>
											</label>
										))}
									</div>
									{errors.listingType && (
										<p className='text-xs text-destructive mt-1'>
											{errors.listingType.message}
										</p>
									)}
								</div>

								{/* Price */}
								{listingType !== 'trade' && (
									<div>
										<label className='text-sm font-medium text-foreground mb-1.5 block'>
											Price ($)
										</label>
										<Input
											{...register('price')}
											type='number'
											min='0'
											step='0.01'
											placeholder='0.00'
										/>
										{errors.price && (
											<p className='text-xs text-destructive mt-1'>
												{errors.price.message}
											</p>
										)}
									</div>
								)}

								{/* Location */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Location
									</label>
									<Input
										{...register('location')}
										placeholder='e.g., Orlando, FL'
									/>
									{errors.location && (
										<p className='text-xs text-destructive mt-1'>
											{errors.location.message}
										</p>
									)}
								</div>

								{/* Submit */}
								<Button
									type='submit'
									disabled={isSubmitting}
									className='w-full gap-2'>
									{isSubmitting ? (
										<span className='animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full' />
									) : (
										<>
											<Upload className='h-4 w-4' /> Save Changes
										</>
									)}
								</Button>
							</form>
						</div>
					</DrawerContent>
				</Drawer>
			</SignedOutGuard>
		</div>
	);
};

export default MyListings;
