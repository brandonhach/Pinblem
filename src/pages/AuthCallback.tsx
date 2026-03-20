import { useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';

export default function AuthCallback() {
	const navigate = useNavigate();

	useEffect(() => {
		supabase.auth.getSession().then(() => {
			navigate('/', { replace: true });
		});
	}, []);

	return (
		<Empty>
			<EmptyHeader>
				{/* Brand */}
				<span className='font-display font-bold text-xl text-foreground sm:flex sm:items-center sm:gap-2'>
					<span className='w-8 h-8 rounded-lg bg-primary/90 flex items-center justify-center text-primary-foreground font-bold text-lg'>
						📌
					</span>
					Pinblem
				</span>
				<EmptyMedia variant='icon'>
					<Spinner />
				</EmptyMedia>
				<EmptyTitle>Processing your request</EmptyTitle>
				<EmptyDescription>
					Please wait while we process your request. Do not refresh the page.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);
}
