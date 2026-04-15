import { Search, MapPin, Bell, User, Plus, Menu, Home, MessageCircle, Heart, List, Settings, LogIn, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useLocation, ALL_LOCATIONS } from "@/contexts/LocationContext";

const SUGGESTED_LOCATIONS = [
  "All Locations",
  "Orlando, FL", "Anaheim, CA", "Los Angeles, CA", "New York, NY",
  "Houston, TX", "Tampa, FL", "San Francisco, CA", "Chicago, IL",
  "Miami, FL", "Dallas, TX", "Seattle, WA", "Denver, CO",
];

const Navbar = () => {
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { user, profile } = useAuth();
  const { location, setLocation } = useLocation();

  const { notifications, unreadCount, markAllRead } = useNotifications();
  const unreadMessages = useUnreadMessages();

  // Merge profile location into suggestions if it's not already there
  const allSuggestions = profile?.location && !SUGGESTED_LOCATIONS.includes(profile.location)
    ? [SUGGESTED_LOCATIONS[0], profile.location, ...SUGGESTED_LOCATIONS.slice(1)]
    : SUGGESTED_LOCATIONS;

  const filteredLocations = allSuggestions.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const typeEmoji = (type: string) => {
    const map: Record<string, string> = {
      message: '💬',
      review: '⭐',
      trade_offer: '🔄',
      price_drop: '💰',
    };
    return map[type] ?? '🔔';
  };

  return (
		<header className='sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80'>
			<div className='container flex h-16 items-center gap-4 px-4'>
				{/* Logo */}
				<Link
					to='/'
					className='flex items-center gap-2 shrink-0'>
					<div className='w-8 h-8 rounded-lg bg-primary/90 flex items-center justify-center'>
						<span className='text-primary-foreground font-bold text-lg'>
							📌
						</span>
					</div>
					<span className='font-display font-bold text-xl text-foreground sm:block'>
						Pinblem
					</span>
				</Link>

				{/* Actions */}
				<div className='flex items-center gap-1 ml-auto'>
					{/* Sell Button */}
					<Link to='/create'>
						<Button
							className='gap-2 hidden sm:flex'
							size='sm'>
							<Plus className='h-4 w-4' />
							Sell
						</Button>
					</Link>

					{/* Condition: User isLoggedIn */}
					{user ? (
						<div className='hidden sm:flex gap-2'>
							{/* Notifications Dropdown */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='relative'>
										<Bell className='h-5 w-5' />
										{unreadCount > 0 && (
											<span className='absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center'>
												{unreadCount > 9 ? '9+' : unreadCount}
											</span>
										)}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align='end'
									className='w-80'>
									<div className='flex items-center justify-between px-3 py-2'>
										<DropdownMenuLabel className='p-0 text-foreground'>
											Notifications
										</DropdownMenuLabel>
										{unreadCount > 0 && (
											<button
												className='text-xs text-primary hover:underline font-medium'
												onClick={markAllRead}>
												Mark all read
											</button>
										)}
									</div>
									<DropdownMenuSeparator />
									<div className='max-h-72 overflow-y-auto'>
										{notifications.length === 0 ? (
											<div className='py-6 text-center text-sm text-muted-foreground'>
												No notifications yet
											</div>
										) : (
											notifications.map((n) => (
												<DropdownMenuItem
													key={n.id}
													asChild
													className={`flex items-start gap-3 py-3 px-3 cursor-pointer ${!n.read ? 'bg-accent/30' : ''}`}>
													<Link to={n.link ?? '#'}>
														<span className='text-lg mt-0.5 shrink-0'>
															{typeEmoji(n.type)}
														</span>
														<div className='flex-1 min-w-0'>
															<div className='flex items-center justify-between gap-2'>
																<span className='text-sm font-medium text-foreground truncate'>
																	{n.title}
																</span>
																<span className='text-[10px] text-muted-foreground shrink-0'>
																	{formatTime(n.created_at)}
																</span>
															</div>
															<p className='text-xs text-muted-foreground mt-0.5 truncate'>
																{n.message}
															</p>
														</div>
														{!n.read && (
															<div className='w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0' />
														)}
													</Link>
												</DropdownMenuItem>
											))
										)}
									</div>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Messages */}
							<Link to='/messages'>
								<Button
									variant='ghost'
									size='icon'
									className='relative'>
									<MessageCircle className='h-5 w-5' />
									{unreadMessages > 0 && (
										<span className='absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center'>
											{unreadMessages > 9 ? '9+' : unreadMessages}
										</span>
									)}
								</Button>
							</Link>

							{/* Profile */}
							<DropdownMenu>
								{/* Location Selector */}
								<DropdownMenu onOpenChange={(open) => { if (!open) setLocationSearch(''); }}>
									<DropdownMenuTrigger asChild>
										<Button
											variant='ghost'
											className='gap-2 text-muted-foreground hover:text-foreground shrink-0'>
											<MapPin className='h-4 w-4' />
											<span className='hidden lg:inline max-w-[120px] truncate'>
												{location}
											</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-56 p-2'>
										<Input
											placeholder='Search location…'
											value={locationSearch}
											onChange={(e) => setLocationSearch(e.target.value)}
											className='h-8 text-sm mb-1'
											autoFocus
										/>
										<div className='max-h-48 overflow-y-auto space-y-0.5'>
											{filteredLocations.map((loc) => (
												<DropdownMenuItem
													key={loc}
													className={location === loc ? 'bg-accent' : ''}
													onClick={() => { setLocation(loc); setLocationSearch(''); }}>
													{loc}
												</DropdownMenuItem>
											))}
											{filteredLocations.length === 0 && locationSearch && (
												<DropdownMenuItem
													onClick={() => { setLocation(locationSearch); setLocationSearch(''); }}>
													Use "{locationSearch}"
												</DropdownMenuItem>
											)}
										</div>
									</DropdownMenuContent>
								</DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										size='icon'
										className='relative inline-block'>
										<Avatar>
											<AvatarImage src={profile?.avatar_url} />
											<AvatarFallback>
												<Spinner className='size-4' />
											</AvatarFallback>
										</Avatar>
										<Badge className='size-4 absolute bottom-0 right-0 rounded-full p-0 z-50'>
											<ChevronDown className='size-2' />
										</Badge>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem asChild>
										<Link
											to={`/profile/${user.id}`}
											className='flex items-center gap-2'>
											<User className='h-4 w-4' />
											My Profile
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link
											to='/my-listings'
											className='flex items-center gap-2'>
											<List className='h-4 w-4' />
											My Listings
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link
											to='/saved'
											className='flex items-center gap-2'>
											<Heart className='h-4 w-4' />
											Saved Items
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link
											to='/settings'
											className='flex items-center gap-2'>
											<Settings className='h-4 w-4' />
											Settings
										</Link>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					) : (
						<>
							<Link to='/login'>
								<Button
									className='gap-2 hidden sm:flex'
									size='sm'>
									<LogIn className='h-4 w-4' />
									Log in
								</Button>
							</Link>
						</>
					)}

					{/* Mobile Menu */}
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant='ghost'
								size='icon'
								className='md:hidden'>
								<Menu className='h-5 w-5' />
							</Button>
						</SheetTrigger>
						<SheetContent
							side='right'
							className='w-80'>
							<div className='flex flex-col gap-4 mt-6'>
								<div className='space-y-1'>
									<Link
										to='/search'
										className='block'>
										<Button
											variant='ghost'
											className='w-full justify-start gap-2'>
											<Search className='h-4 w-4' /> Search
										</Button>
									</Link>
									{user && (
										<>
											<Link
												to='/messages'
												className='block'>
												<Button
													variant='ghost'
													className='w-full justify-start gap-2'>
													<MessageCircle className='h-4 w-4' />
													Messages
													{unreadMessages > 0 && (
														<span className='ml-auto h-5 min-w-5 px-1 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center'>
															{unreadMessages > 9 ? '9+' : unreadMessages}
														</span>
													)}
												</Button>
											</Link>
											<Link
												to='/my-listings'
												className='block'>
												<Button
													variant='ghost'
													className='w-full justify-start gap-2'>
													<List className='h-4 w-4' /> My Listings
												</Button>
											</Link>
											<Link
												to='/saved'
												className='block'>
												<Button
													variant='ghost'
													className='w-full justify-start gap-2'>
													<Heart className='h-4 w-4' /> Saved Items
												</Button>
											</Link>
											<Link
												to={`/profile/${user.id}`}
												className='block'>
												<Button
													variant='ghost'
													className='w-full justify-start gap-2'>
													<User className='h-4 w-4' /> Profile
												</Button>
											</Link>
											<Link
												to='/settings'
												className='block'>
												<Button
													variant='ghost'
													className='w-full justify-start gap-2'>
													<Settings className='h-4 w-4' /> Settings
												</Button>
											</Link>
										</>
									)}
									{!user && (
										<>
											<Link
												to='/login'
												className='block'>
												<Button
													variant='default'
													className='w-full justify-start gap-2'>
													<LogIn className='h-4 w-4' /> Log in
												</Button>
											</Link>
										</>
									)}
								</div>

								<div>
									<button
										className='flex items-center gap-2 px-4 py-2 w-full text-left'
										onClick={() => setShowLocationSearch(!showLocationSearch)}>
										<MapPin className='h-4 w-4 text-muted-foreground' />
										<div>
											<label className='text-xs font-medium text-muted-foreground block'>
												Location
											</label>
											<span className='text-sm font-medium text-foreground'>
												{location}
											</span>
										</div>
									</button>
									{showLocationSearch && (
										<div className='px-4 pb-2 space-y-1.5'>
											<Input
												placeholder='Search city...'
												value={locationSearch}
												onChange={(e) => setLocationSearch(e.target.value)}
												className='h-8 text-sm'
												autoFocus
											/>
											<div className='max-h-36 overflow-y-auto rounded-lg border border-border bg-background'>
												{filteredLocations.map((loc) => (
													<button
														key={loc}
														className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors ${location === loc ? 'bg-accent/30 font-medium text-foreground' : 'text-muted-foreground'}`}
														onClick={() => {
															setLocation(loc);
															setShowLocationSearch(false);
															setLocationSearch('');
														}}>
														{loc}
													</button>
												))}
												{filteredLocations.length === 0 && locationSearch && (
													<button
														className='w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50'
														onClick={() => {
															setLocation(locationSearch);
															setShowLocationSearch(false);
															setLocationSearch('');
														}}>
														Use "{locationSearch}"
													</button>
												)}
											</div>
										</div>
									)}
								</div>
								{user && (
									<>
										<Link to='/create'>
											<Button className='w-full gap-2'>
												<Plus className='h-4 w-4' />
												Create Listing
											</Button>
										</Link>
									</>
								)}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
