import { useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
	const navigate = useNavigate();

	useEffect(() => {
		supabase.auth.getSession().then(() => {
			navigate('/', { replace: true });
		});
	}, []);

	return <div>Signing you in…</div>;
}
