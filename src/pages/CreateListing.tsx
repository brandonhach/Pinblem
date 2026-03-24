import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, ImagePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navbar from '@/components/Navbar';
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
import { categories } from '@/data/mockData';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const listingSchema = z.object({
	title: z
		.string()
		.min(5, 'Title must be at least 5 characters')
		.max(100, 'Title must be less than 100 characters'),
	description: z
		.string()
		.min(20, 'Description must be at least 20 characters')
		.max(1000, 'Description must be less than 1000 characters'),
	category: z.string().min(1, 'Please select a category'),
	condition: z.enum(['new', 'like-new', 'good', 'fair'], {
		required_error: 'Please select a condition',
	}),
	listingType: z.enum(['sell', 'trade', 'both'], {
		required_error: 'Please select a listing type',
	}),
	price: z.string().optional(),
	location: z
		.string()
		.min(2, 'Please enter your location')
		.max(100, 'Location must be less than 100 characters'),
});

type ListingFormData = z.infer<typeof listingSchema>;

const CreateListing = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	// Each entry holds both the preview URL and the original File
	const [imageFiles, setImageFiles] = useState<
		{ preview: string; file: File }[]
	>([]);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<ListingFormData>({
		resolver: zodResolver(listingSchema),
		defaultValues: { listingType: 'sell' },
	});

	const listingType = watch('listingType');

	// --- Image select: preview only, no upload yet ---
	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;

		Array.from(files).forEach((file) => {
			if (imageFiles.length >= 5) {
				toast.error('Maximum 5 images allowed');
				return;
			}
			if (!file.type.startsWith('image/')) {
				toast.error('Please select image files only');
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				toast.error(`${file.name} exceeds 5MB`);
				return;
			}

			setImageFiles((prev) => [
				...prev,
				{ preview: URL.createObjectURL(file), file },
			]);
		});

		// Reset input so the same file can be re-selected if removed
		e.target.value = '';
	};

	const removeImage = (index: number) => {
		setImageFiles((prev) => {
			URL.revokeObjectURL(prev[index].preview); // free memory
			return prev.filter((_, i) => i !== index);
		});
	};

	// --- Submit: upload images then insert pin row ---
	const onSubmit = async (data: ListingFormData) => {
		if (imageFiles.length === 0) {
			toast.error('Please add at least one image');
			return;
		}

		if (!user) {
			toast.error('You must be signed in to create a listing');
			return;
		}

		try {
			// 1. Upload each image to Supabase Storage
			const uploadedUrls: string[] = [];

			for (const { file } of imageFiles) {
				const ext = file.name.split('.').pop();
				const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

				const { error: uploadError } = await supabase.storage
					.from('listings') // your bucket name
					.upload(filePath, file, { upsert: false });

				if (uploadError) throw uploadError;

				const { data: urlData } = supabase.storage
					.from('listings')
					.getPublicUrl(filePath);

				uploadedUrls.push(urlData.publicUrl);
			}

			// 2. Insert pin row
			const { error: insertError } = await supabase.from('pins').insert({
			  user_id: user.id,
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
				images: uploadedUrls, // store as text[] array in Postgres
			});

			if (insertError) throw insertError;

			toast.success('Listing created successfully!');
			navigate('/');
		} catch (err) {
			console.error(err);
			toast.error('Failed to create listing. Please try again.');
		}
	};

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

			<main className='container px-4 pb-6'>
				<div className='max-w-2xl mx-auto'>
					<h1 className='font-display text-2xl font-bold text-foreground mb-6'>
						Create New Listing
					</h1>

					<form
						onSubmit={handleSubmit(onSubmit)}
						className='space-y-6'>
						{/* Images */}
						<div>
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Photos ({imageFiles.length}/5)
							</label>
							<div className='grid grid-cols-3 gap-3'>
								{imageFiles.map(({ preview }, index) => (
									<div
										key={index}
										className='relative aspect-square rounded-xl overflow-hidden bg-muted'>
										<img
											src={preview}
											alt={`Upload ${index + 1}`}
											className='w-full h-full object-cover'
										/>
										<button
											type='button'
											onClick={() => removeImage(index)}
											className='absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center'>
											<X className='h-3 w-3' />
										</button>
									</div>
								))}
								{imageFiles.length < 5 && (
									<label className='aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-card'>
										<ImagePlus className='h-8 w-8 text-muted-foreground' />
										<span className='text-xs text-muted-foreground mt-2'>
											Add Photo
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
							{imageFiles.length === 0 && (
								<p className='text-xs text-destructive mt-1'>
									At least one photo is required
								</p>
							)}
						</div>

						{/* Title */}
						<div>
							<label className='text-sm font-medium text-foreground mb-2 block'>
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
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Description
							</label>
							<Textarea
								{...register('description')}
								placeholder='Describe your pin, including any details about its condition, rarity, or history...'
								rows={4}
							/>
							{errors.description && (
								<p className='text-xs text-destructive mt-1'>
									{errors.description.message}
								</p>
							)}
						</div>

						{/* Category */}
						<div>
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Category
							</label>
							<Select
								onValueChange={(value) =>
									setValue('category', value, { shouldValidate: true })
								}>
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
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Condition
							</label>
							<div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
								{[
									{ value: 'new', label: 'New' },
									{ value: 'like-new', label: 'Like New' },
									{ value: 'good', label: 'Good' },
									{ value: 'fair', label: 'Fair' },
								].map((option) => (
									<label
										key={option.value}
										className='flex items-center gap-2 p-3 rounded-xl border border-border bg-card cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent'>
										<input
											{...register('condition')}
											type='radio'
											value={option.value}
											className='accent-primary'
										/>
										<span className='text-sm text-foreground'>
											{option.label}
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
							<label className='text-sm font-medium text-foreground mb-2 block'>
								Listing Type
							</label>
							<div className='grid grid-cols-3 gap-2'>
								{[
									{ value: 'sell', label: 'For Sale' },
									{ value: 'trade', label: 'Trade Only' },
									{ value: 'both', label: 'Sell or Trade' },
								].map((option) => (
									<label
										key={option.value}
										className='flex items-center justify-center gap-2 p-3 rounded-xl border border-border bg-card cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent'>
										<input
											{...register('listingType')}
											type='radio'
											value={option.value}
											className='accent-primary'
										/>
										<span className='text-sm text-foreground'>
											{option.label}
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
								<label className='text-sm font-medium text-foreground mb-2 block'>
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
							<label className='text-sm font-medium text-foreground mb-2 block'>
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
									<Upload className='h-4 w-4' />
									Create Listing
								</>
							)}
						</Button>
					</form>
				</div>
			</main>
		</div>
	);
};

export default CreateListing;
