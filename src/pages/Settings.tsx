import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Bell, Shield, Eye, LogOut, Trash2, Upload, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import SignedOutGuard from "@/components/SignedOutGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from '@/components/ui/spinner';
import { toast } from "sonner";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const Settings = () => {
	const { user } = useAuth();
	const [avatarUrl, setAvatarUrl] = useState<string>('');
	const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
	const [avatarUploading, setAvatarUploading] = useState(false);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string>('');
	const [signingOut, setSigningOut] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [notifications, setNotifications] = useState({
		tradeOffers: true,
		messages: true,
		priceDrops: true,
		newListings: false,
		newsletter: false,
		pushEnabled: true,
	});

	const profileSchema = z.object({
		username: z
			.string()
			.min(3, 'Username must be at least 3 characters')
			.max(30, 'Username must be under 30 characters')
			.regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, and underscores'),
		bio: z
			.string()
			.max(160, 'Bio must be under 160 characters')
			.optional()
			.or(z.literal('')),
		location: z
			.string()
			.max(100, 'Location must be under 100 characters')
			.optional()
			.or(z.literal('')),
	});

	type ProfileFormValues = z.infer<typeof profileSchema>;

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: { username: '', bio: '', location: '' },
	});

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isDirty, isSubmitting },
	} = form;

	// --- Load profile and reset form with real values ---
	useEffect(() => {
		const loadProfile = async () => {
			const { data, error } = await supabase
				.from('users')
				.select('*')
				.eq('id', user.id)
				.single();

			if (error) {
				console.error('Error fetching user data:', error);
				return;
			}

			// reset() sets the form's "default values" so isDirty tracks against these
			reset({
				username: data.username ?? '',
				bio: data.bio ?? '',
				location: data.location ?? '',
			});

			setAvatarUrl(data.avatar_url ?? '');
		};

		if (user?.id) loadProfile();
	}, [user?.id, reset]);

	// --- Avatar upload to Supabase Storage ---
	// handleFileSelect — preview only, no upload
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file');
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image must be under 5MB');
			return;
		}

		setAvatarFile(file);
		setAvatarPreview(URL.createObjectURL(file)); // local blob URL, no network request
		setAvatarDialogOpen(false);
	};

	// onSubmit — upload only if a new file was selected
	const onSubmit = async (values: ProfileFormValues) => {
		let finalAvatarUrl = avatarUrl; // fallback to existing

		if (avatarFile) {
			setAvatarUploading(true);
			try {
				const ext = avatarFile.name.split('.').pop();
				const filePath = `avatars/${user.id}.${ext}`;

				const { error: uploadError } = await supabase.storage
					.from('avatars')
					.upload(filePath, avatarFile, { upsert: true });

				if (uploadError) throw uploadError;

				const { data: urlData } = supabase.storage
					.from('avatars')
					.getPublicUrl(filePath);

				finalAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
				setAvatarUrl(finalAvatarUrl);
				setAvatarFile(null); // clear pending file
			} catch (err) {
				console.error(err);
				toast.error('Failed to upload avatar');
				setAvatarUploading(false);
				return;
			}
			setAvatarUploading(false);
		}

		const { error } = await supabase
			.from('users')
			.update({
				username: values.username,
				bio: values.bio,
				location: values.location,
				avatar_url: finalAvatarUrl,
			})
			.eq('id', user.id);

		if (error) {
			toast.error('Failed to save profile');
			return;
		}

		reset(values);
		toast.success('Profile updated successfully!');
	};

	const handleNotificationToggle = (key: keyof typeof notifications) => {
		setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
		toast.success('Notification preference updated');
	};

	const handleSignOut = async () => {
		setSigningOut(true);
		await supabase.auth.signOut();
		toast.success('Signed out successfully');
	};

	return (
		<div className='min-h-screen bg-background'>
			<Navbar />
			<SignedOutGuard message='Sign in to manage your account settings.'>
				{/* ... back button ... */}
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
					<div className='max-w-2xl mx-auto'>
						<h1 className='font-display text-2xl font-bold text-foreground mb-6'>
							Settings
						</h1>

						{/* Profile Section */}
						<section className='card-tactile p-6 mb-6'>
							<div className='flex items-center gap-2 mb-4'>
								<User className='h-5 w-5 text-primary' />
								<h2 className='font-display text-lg font-semibold text-foreground'>
									Profile
								</h2>
							</div>

							<form
								onSubmit={handleSubmit(onSubmit)}
								className='space-y-4'>
								{/* Avatar */}
								<div className='flex items-center gap-4 mb-4'>
									<Avatar className='size-24'>
										<AvatarImage src={avatarPreview || avatarUrl} />
										<AvatarFallback>
											<Spinner className='size-4' />
										</AvatarFallback>
									</Avatar>
									<Button
										type='button'
										variant='outline'
										size='sm'
										disabled={avatarUploading}
										onClick={() => setAvatarDialogOpen(true)}>
										{avatarUploading ? 'Uploading...' : 'Change Avatar'}
									</Button>
								</div>

								{/* Username */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Username
									</label>
									<Input {...register('username')} />
									{errors.username && (
										<p className='text-xs text-destructive mt-1'>
											{errors.username.message}
										</p>
									)}
								</div>

								{/* Location */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Location
									</label>
									<Input {...register('location')} />
									{errors.location && (
										<p className='text-xs text-destructive mt-1'>
											{errors.location.message}
										</p>
									)}
								</div>

								{/* Bio */}
								<div>
									<label className='text-sm font-medium text-foreground mb-1.5 block'>
										Bio
									</label>
									<Textarea
										{...register('bio')}
										rows={3}
									/>
									{errors.bio && (
										<p className='text-xs text-destructive mt-1'>
											{errors.bio.message}
										</p>
									)}
								</div>

								{/* Save — disabled until something changes */}
								<Button
									type='submit'
									disabled={(!isDirty && !avatarFile) || isSubmitting}
									className='w-full sm:w-auto'>
									{isSubmitting ? <Spinner className='size-4 mr-2' /> : null}
									Save Profile
								</Button>
							</form>
						</section>

						{/* Notifications Section */}
						<section className='card-tactile p-6 mb-6'>
							<div className='flex items-center gap-2 mb-4'>
								<Bell className='h-5 w-5 text-primary' />
								<h2 className='font-display text-lg font-semibold text-foreground'>
									Notifications
								</h2>
							</div>

							<div className='space-y-4'>
								{[
									{
										key: 'tradeOffers' as const,
										label: 'Trade Offers',
										desc: 'Get notified when someone wants to trade',
									},
									{
										key: 'messages' as const,
										label: 'Messages',
										desc: 'New message notifications',
									},
									// {
									// 	key: 'priceDrops' as const,
									// 	label: 'Price Drops',
									// 	desc: 'When saved items go on sale',
									// },
									{
										key: 'newListings' as const,
										label: 'New Listings',
										desc: 'Pins matching your interests',
									},
									{
										key: 'newsletter' as const,
										label: 'Newsletter',
										desc: 'Weekly pin collecting tips and trends',
									},
									{
										key: 'pushEnabled' as const,
										label: 'Push Notifications',
										desc: 'Enable browser push notifications',
									},
								].map((item) => (
									<div
										key={item.key}
										className='flex items-center justify-between py-2'>
										<div>
											<div className='text-sm font-medium text-foreground'>
												{item.label}
											</div>
											<div className='text-xs text-muted-foreground'>
												{item.desc}
											</div>
										</div>
										<Switch
											checked={notifications[item.key]}
											onCheckedChange={() => handleNotificationToggle(item.key)}
										/>
									</div>
								))}
							</div>
						</section>

						{/* Privacy Section */}
						<section className='card-tactile p-6 mb-6'>
							<div className='flex items-center gap-2 mb-4'>
								<Eye className='h-5 w-5 text-primary' />
								<h2 className='font-display text-lg font-semibold text-foreground'>
									Privacy
								</h2>
							</div>

							{/* <div className='space-y-4'>
								{[
									{
										key: 'publicProfile' as const,
										label: 'Public Profile',
										desc: 'Allow others to view your profile',
									},
									{
										key: 'showLocation' as const,
										label: 'Show Location',
										desc: 'Display your city on listings',
									},
									{
										key: 'showEmail' as const,
										label: 'Show Email',
										desc: 'Let other users see your email',
									},
									{
										key: 'showPhone' as const,
										label: 'Show Phone',
										desc: 'Let other users see your phone number',
									},
								].map((item) => (
									<div
										key={item.key}
										className='flex items-center justify-between py-2'>
										<div>
											<div className='text-sm font-medium text-foreground'>
												{item.label}
											</div>
											<div className='text-xs text-muted-foreground'>
												{item.desc}
											</div>
										</div>
										<Switch
											checked={privacy[item.key]}
											onCheckedChange={() => handlePrivacyToggle(item.key)}
										/>
									</div>
								))}
							</div> */}
						</section>

						{/* Account Section */}
						<section className='card-tactile p-6 mb-6'>
							<div className='flex items-center gap-2 mb-4'>
								<Shield className='h-5 w-5 text-primary' />
								<h2 className='font-display text-lg font-semibold text-foreground'>
									Account
								</h2>
							</div>

							<div className='space-y-3'>
								{/* <Button
									variant='outline'
									className='w-full justify-start gap-2'>
									<Shield className='h-4 w-4' />
									Change Password
								</Button> */}
								<Button
									variant='outline'
									className='w-full justify-start gap-2 text-destructive border-destructive/30 hover:bg-destructive/10'
									onClick={handleSignOut}>
									{signingOut && <Spinner className='size-4' />}
									{!signingOut && <LogOut className='h-4 w-4' />}
									Sign Out
								</Button>
								<Button
									variant='ghost'
									disabled
									className='w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10'>
									<Trash2 className='h-4 w-4' />
									Delete Account
								</Button>
							</div>
						</section>
					</div>
				</main>
			</SignedOutGuard>

			{/* Avatar Dialog */}
			<Dialog
				open={avatarDialogOpen}
				onOpenChange={setAvatarDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>Change Avatar</DialogTitle>
					</DialogHeader>
					<div
						className='flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-border rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors'
						onClick={() => fileInputRef.current?.click()}>
						<div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center'>
							<ImageIcon className='h-8 w-8 text-muted-foreground' />
						</div>
						<div className='text-center'>
							<p className='text-sm font-medium text-foreground'>
								Click to upload an image
							</p>
							<p className='text-xs text-muted-foreground mt-1'>
								JPG, PNG or WEBP · Max 5MB
							</p>
						</div>
						<Button
							type='button'
							variant='outline'
							size='sm'
							className='gap-2'>
							<Upload className='h-4 w-4' />
							Choose File
						</Button>
						<input
							ref={fileInputRef}
							type='file'
							accept='image/*'
							className='hidden'
							onChange={handleFileSelect}
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};;;
export default Settings;