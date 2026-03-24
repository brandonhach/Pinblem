import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Star, Shield, Clock, MessageCircle, PenLine } from "lucide-react";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ListingCard from "@/components/ListingCard";
import ListingDrawer from "@/components/ListingDrawer";
import { Button } from "@/components/ui/button";
import { mockSellers, mockPins, mockReviews, type Pin } from "@/data/mockData";
import ReviewFormDialog from "@/components/ReviewFormDialog";
import { supabase } from "@/utils/supabaseClient";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { set } from "date-fns";

const Profile = () => {
  const { id } = useParams();
  const sellerId = parseInt(id || "1");
  
  const seller = mockSellers.find(s => s.id === sellerId) || mockSellers[0];
  const sellerPins = mockPins.filter(p => p.sellerId === sellerId);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-warning text-warning' : 'text-muted-foreground'}`}
      />
    ));
  };

  const handleCardClick = (pin: Pin) => {
    setSelectedPin(pin);
    setIsDrawerOpen(true);
  };

  useEffect(() => {
      const loadProfile = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
  
        if (error) {
          setError('This user may not exist or there was an error loading the profile.');  
        } else {
          setProfile(data);
        }
      };
  
      loadProfile();
  }, [id]);
  
  if (error) {
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
				<div className='container px-4 py-3'>{error}</div>
			</div>
		);
	}

  if (!profile) {
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
				<div className='container px-4 py-3'>
					<Spinner className='mx-auto' />
				</div>
			</div>
		);
  }
  return (
		<div className='min-h-screen bg-background'>
			<Navbar />

			{/* Back Button */}
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

			{/* Profile Header */}
			<section className='px-4 pb-6'>
				<div className='container max-w-4xl'>
					<div className='card-tactile p-6'>
						{/* Avatar & Basic Info */}
						<div className='flex items-start gap-4'>
							<Avatar className='size-24'>
								<AvatarImage src={profile?.avatar_url} />
								<AvatarFallback>
									<Spinner className='size-4' />
								</AvatarFallback>
							</Avatar>
							<div className='flex-1 min-w-0'>
								<div className='flex items-center gap-2 flex-wrap'>
									<h1 className='font-display text-xl font-bold text-foreground'>
										{profile.username}
									</h1>
									{profile.verified && (
										<span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium'>
											<Shield className='h-3 w-3' />
											Verified
										</span>
									)}
								</div>

								{/* Rating */}
								<div className='flex items-center gap-2 mt-1'>
									<div className='flex'>{renderStars(seller.rating)}</div>
									<span className='text-sm font-medium text-foreground'>
										{seller.rating}
									</span>
									<span className='text-sm text-muted-foreground'>
										({seller.totalReviews} reviews)
									</span>
								</div>

								{/* Location & Join Date */}
								<div className='flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground'>
									<span className='flex items-center gap-1'>
										<MapPin className='h-3 w-3' />
										{profile.location}
									</span>
									<span className='flex items-center gap-1'>
										<Calendar className='h-3 w-3' />
										Joined {profile.created_at.split('T')[0]}
									</span>
								</div>
							</div>
						</div>

						{/* Bio */}
						<p className='text-sm text-muted-foreground mt-4'>{profile.bio}</p>

						{/* Stats */}
						<div className='grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border'>
							<div className='text-center'>
								<div className='text-2xl font-bold text-foreground'>
									{seller.totalSales}
								</div>
								<div className='text-xs text-muted-foreground'>Sales</div>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-foreground'>
									{seller.totalReviews}
								</div>
								<div className='text-xs text-muted-foreground'>Reviews</div>
							</div>
							<div className='text-center'>
								<div className='text-2xl font-bold text-foreground'>
									{seller.rating}
								</div>
								<div className='text-xs text-muted-foreground'>Rating</div>
							</div>
						</div>

						{/* Response Time & Contact */}
						<div className='flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-border'>
							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<Clock className='h-4 w-4' />
								{profile.response_time}
							</div>
							<div className='flex gap-2 sm:ml-auto'>
								<Button
									size='sm'
									variant='outline'
									className='gap-2'
									onClick={() => setIsReviewOpen(true)}>
									<PenLine className='h-4 w-4' />
									Write Review
								</Button>
								<Button
									size='sm'
									className='gap-2'>
									<MessageCircle className='h-4 w-4' />
									Message Seller
								</Button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Reviews Section */}
			<section className='px-4 pb-6'>
				<div className='container max-w-4xl'>
					<h2 className='font-display text-lg font-semibold text-foreground mb-4'>
						Recent Reviews
					</h2>
					<div className='space-y-3'>
						{mockReviews.map((review) => (
							<div
								key={review.id}
								className='card-tactile p-4'>
								<div className='flex items-start gap-3'>
									<Link
										to={`/profile/${review.reviewerId}`}
										className='shrink-0'>
										<div className='w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-lg'>
											{review.reviewerAvatar}
										</div>
									</Link>
									<div className='flex-1 min-w-0'>
										<div className='flex items-center justify-between'>
											<Link
												to={`/profile/${review.reviewerId}`}
												className='font-medium text-foreground hover:text-primary transition-colors'>
												{review.reviewer}
											</Link>
											<span className='text-xs text-muted-foreground'>
												{review.date}
											</span>
										</div>
										<div className='flex mt-1'>
											{renderStars(review.rating)}
										</div>
										<p className='text-sm text-muted-foreground mt-2'>
											{review.comment}
										</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Seller's Listings */}
			<section className='px-4 pb-6'>
				<div className='container max-w-4xl'>
					<h2 className='font-display text-lg font-semibold text-foreground mb-4'>
						{seller.username}'s Listings ({sellerPins.length})
					</h2>
					{sellerPins.length > 0 ? (
						<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
							{sellerPins.map((pin) => (
								<ListingCard
									key={pin.id}
									pin={pin}
									onClick={() => handleCardClick(pin)}
								/>
							))}
						</div>
					) : (
						<div className='card-tactile p-8 text-center'>
							<p className='text-muted-foreground'>No listings yet</p>
						</div>
					)}
				</div>
			</section>

			<ListingDrawer
				pin={selectedPin}
				isOpen={isDrawerOpen}
				onClose={() => setIsDrawerOpen(false)}
			/>

			<ReviewFormDialog
				open={isReviewOpen}
				onOpenChange={setIsReviewOpen}
				sellerName={seller.username}
			/>
		</div>
	);
};

export default Profile;