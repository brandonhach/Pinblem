import { useState } from 'react';
import { RefreshCw, ImagePlus, X } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { supabase } from '@/utils/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TradeProposalDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	listingTitle: string;
	// The pin being traded for
	pinId: string;
	sellerId: string;
}

const TradeProposalDialog = ({
	open,
	onOpenChange,
	listingTitle,
	pinId,
	sellerId,
}: TradeProposalDialogProps) => {
	const { user } = useAuth();
	const navigate = useNavigate();

	const [itemName, setItemName] = useState('');
	const [condition, setCondition] = useState('');
	const [description, setDescription] = useState('');
	const [imageFiles, setImageFiles] = useState<
		{ preview: string; file: File }[]
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files) return;
		Array.from(files).forEach((file) => {
			if (imageFiles.length >= 4) {
				toast.error('Maximum 4 images');
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
			setImageFiles((prev) => [
				...prev,
				{ preview: URL.createObjectURL(file), file },
			]);
		});
		e.target.value = '';
	};

	const removeImage = (index: number) => {
		setImageFiles((prev) => {
			URL.revokeObjectURL(prev[index].preview);
			return prev.filter((_, i) => i !== index);
		});
	};

	const handleSubmit = async () => {
		if (!user) {
			navigate('/login');
			return;
		}
		if (!itemName.trim()) {
			toast.error('Please enter the item name');
			return;
		}
		if (!condition) {
			toast.error('Please select a condition');
			return;
		}

		setIsSubmitting(true);

		try {
			// 1. Find or create conversation scoped to this pin
			const { data: existing } = await supabase
				.from('conversations')
				.select('id')
				.eq('buyer_id', user.id)
				.eq('seller_id', sellerId)
				.eq('pin_id', pinId)
				.maybeSingle();

			let convoId: string;

			if (existing) {
				convoId = existing.id;
			} else {
				const { data: newConvo, error: convoError } = await supabase
					.from('conversations')
					.insert({
						buyer_id: user.id,
						seller_id: sellerId,
						pin_id: pinId,
						last_activity: new Date().toISOString(),
					})
					.select('id')
					.single();

				if (convoError || !newConvo) throw convoError;
				convoId = newConvo.id;
			}

			// 2. Upload images to 'offers' bucket
			const uploadedUrls: string[] = [];
			for (const { file } of imageFiles) {
				const ext = file.name.split('.').pop();
				const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
				const { error: upErr } = await supabase.storage
					.from('offers')
					.upload(path, file, { upsert: false });
				if (upErr) throw upErr;
				const { data: urlData } = supabase.storage
					.from('offers')
					.getPublicUrl(path);
				uploadedUrls.push(urlData.publicUrl);
			}

			// 3. Insert trade offer row
			const { error: offerError } = await supabase
				.from('messages_offers')
				.insert({
					conversation_id: convoId,
					pin_id: pinId,
					name: itemName.trim(),
					condition,
					description: description.trim() || null,
					photos_url: uploadedUrls.length > 0 ? uploadedUrls : null,
				});

			if (offerError) throw offerError;

			// 4. Update conversation last_activity
			await supabase
				.from('conversations')
				.update({ last_activity: new Date().toISOString() })
				.eq('id', convoId);

			toast.success('Trade proposal sent!');
			// Reset
			setItemName('');
			setCondition('');
			setDescription('');
			setImageFiles([]);
			onOpenChange(false);
			navigate(`/messages?convo=${convoId}`);
		} catch (err) {
			console.error(err);
			toast.error('Failed to send trade proposal.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-md max-h-[85vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<RefreshCw className='h-5 w-5 text-primary' />
						Propose a Trade
					</DialogTitle>
					<DialogDescription>
						What would you like to trade for{' '}
						<span className='font-medium text-foreground'>
							"{listingTitle}"
						</span>
						?
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 pt-2'>
					{/* Item name */}
					<div>
						<label className='text-sm font-medium text-foreground mb-2 block'>
							Your Item Name
						</label>
						<Input
							placeholder='e.g. Mickey Mouse 25th Anniversary Pin'
							value={itemName}
							onChange={(e) => setItemName(e.target.value)}
						/>
					</div>

					{/* Condition */}
					<div>
						<label className='text-sm font-medium text-foreground mb-2 block'>
							Condition
						</label>
						<Select
							value={condition}
							onValueChange={setCondition}>
							<SelectTrigger>
								<SelectValue placeholder='Select condition' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='new'>New</SelectItem>
								<SelectItem value='like-new'>Like New</SelectItem>
								<SelectItem value='good'>Good</SelectItem>
								<SelectItem value='fair'>Fair</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Description */}
					<div>
						<label className='text-sm font-medium text-foreground mb-2 block'>
							Description
						</label>
						<Textarea
							placeholder='Describe your item, including any details about rarity, edition, etc.'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
						/>
					</div>

					{/* Photos */}
					<div>
						<label className='text-sm font-medium text-foreground mb-2 block'>
							Photos ({imageFiles.length}/4)
						</label>
						<div className='grid grid-cols-4 gap-2 mb-2'>
							{imageFiles.map(({ preview }, i) => (
								<div
									key={i}
									className='relative aspect-square rounded-lg overflow-hidden bg-muted'>
									<img
										src={preview}
										alt=''
										className='w-full h-full object-cover'
									/>
									<button
										type='button'
										onClick={() => removeImage(i)}
										className='absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center'>
										<X className='h-2.5 w-2.5' />
									</button>
								</div>
							))}
							{imageFiles.length < 4 && (
								<label className='aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-card col-span-1'>
									<ImagePlus className='h-6 w-6 text-muted-foreground' />
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
					</div>

					<Button
						onClick={handleSubmit}
						className='w-full gap-2'
						disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<span className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
								Sending Proposal…
							</>
						) : (
							<>
								<RefreshCw className='h-4 w-4' />
								Send Trade Proposal
							</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default TradeProposalDialog;
