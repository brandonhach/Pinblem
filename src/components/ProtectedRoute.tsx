import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';
import { Spinner } from './ui/spinner';

export default function ProtectedRoute({ children }) {
	const { session, loading } = useAuth();

	if (loading) return (
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
					Please wait while we process your request.
				</EmptyDescription>
			</EmptyHeader>
		</Empty>
	);

	if (!session)
		return (
			<Navigate
				to='/login'
				replace
			/>
		);

	return children;
}
