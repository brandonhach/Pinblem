import { Search, MapPin, Bell, User, Plus, Menu, Home, MessageCircle, Heart, List, Settings, LogIn } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from "@/contexts/AuthContext";

const notifications = [
  { id: 1, title: "New trade offer", message: "Mickey Mouse pin trade request from StitchLover", time: "2m ago", unread: true, emoji: "🔄" },
  { id: 2, title: "Price drop alert", message: "Stitch pin is now $15", time: "1h ago", unread: true, emoji: "💰" },
  { id: 3, title: "Trade completed", message: "Your Elsa pin trade is complete", time: "3h ago", unread: false, emoji: "✅" },
  { id: 4, title: "New review", message: "PrincessPins left you a 5-star review", time: "5h ago", unread: false, emoji: "⭐" },
  { id: 5, title: "New follower", message: "MarvelFanatic started following you", time: "1d ago", unread: false, emoji: "👤" },
];

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Orlando, FL");
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { user } = useAuth();

  const suggestedLocations = [
    "Orlando, FL", "Anaheim, CA", "Los Angeles, CA", "New York, NY",
    "Houston, TX", "Tampa, FL", "San Francisco, CA", "Chicago, IL",
    "Miami, FL", "Dallas, TX", "Seattle, WA", "Denver, CO"
  ];

  const filteredLocations = suggestedLocations.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );


  const unreadCount = notifications.filter(n => n.unread).length;

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

				{/* Search Bar - Desktop */}
				<div className='flex-1 max-w-2xl hidden md:flex items-center gap-2'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
						<Input
							type='search'
							placeholder='Search pins, collections, sellers...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='pl-10 pr-4 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary'
						/>
					</div>

					{/* Location Selector */}
					<DropdownMenu>
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
						<DropdownMenuContent align='end'>
							<DropdownMenuItem onClick={() => setLocation('Orlando, FL')}>
								Orlando, FL
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setLocation('Anaheim, CA')}>
								Anaheim, CA
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setLocation('Los Angeles, CA')}>
								Los Angeles, CA
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setLocation('New York, NY')}>
								New York, NY
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

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
						<>
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
												{unreadCount}
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
										<button className='text-xs text-primary hover:underline font-medium'>
											Mark all read
										</button>
									</div>
									<DropdownMenuSeparator />
									<div className='max-h-72 overflow-y-auto'>
										{notifications.map((n) => (
											<DropdownMenuItem
												key={n.id}
												className={`flex items-start gap-3 py-3 px-3 cursor-pointer ${n.unread ? 'bg-accent/30' : ''}`}>
												<span className='text-lg mt-0.5 shrink-0'>
													{n.emoji}
												</span>
												<div className='flex-1 min-w-0'>
													<div className='flex items-center justify-between gap-2'>
														<span className='text-sm font-medium text-foreground truncate'>
															{n.title}
														</span>
														<span className='text-[10px] text-muted-foreground shrink-0'>
															{n.time}
														</span>
													</div>
													<p className='text-xs text-muted-foreground mt-0.5 truncate'>
														{n.message}
													</p>
												</div>
												{n.unread && (
													<div className='w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0' />
												)}
											</DropdownMenuItem>
										))}
									</div>
									<DropdownMenuSeparator />
									<DropdownMenuItem className='justify-center text-sm text-primary font-medium'>
										View all notifications
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>

							{/* Messages */}
							<Link to='/messages'>
								<Button
									variant='ghost'
									size='icon'
									className='relative'>
									<MessageCircle className='h-5 w-5' />
									<span className='absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center'>
										2
									</span>
								</Button>
							</Link>

							{/* Profile */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant='ghost'
										size='icon'>
										<Avatar>
											<AvatarImage src='https://media.licdn.com/dms/image/v2/D4E03AQFAfDCFW9DVYA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1723082083633?e=1775692800&v=beta&t=3tw2cfhDCnpQKftyRnR1_-huNQ-cW_QGaQxqScN3kig' />
											<AvatarFallback>CN</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem asChild>
										<Link
											to='/profile/1'
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
						</>
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
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
									<Input
										type='search'
										placeholder='Search...'
										className='pl-10'
									/>
								</div>

								<div className='space-y-1'>
									<Link
										to='/'
										className='block'>
										<Button
											variant='ghost'
											className='w-full justify-start gap-2'>
											<Home className='h-4 w-4' /> Browse
										</Button>
									</Link>
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
													<MessageCircle className='h-4 w-4' /> Messages
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
												to='/profile/1'
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