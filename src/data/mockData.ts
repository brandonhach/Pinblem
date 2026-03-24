export type Pin = {
	id: string;
	user_id: string;
	title: string;
	description: string;
	price: number | null;
	category: string;
	images: string[];
	listing_type: 'sell' | 'trade' | 'both';
	condition: 'new' | 'like-new' | 'good' | 'fair';
	location: string;
	created_at: string;
  bumped_cat: string;
  rating: number;
	isTradeOnly: boolean;
	verified: boolean;
	isFavorite?: boolean;
	username: string; // from join
	avatar_url: string; // from join
};

export interface Seller {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  joinDate: string;
  rating: number;
  totalReviews: number;
  totalSales: number;
  responseTime: string;
  verified: boolean;
}

export interface Review {
  id: number;
  reviewer: string;
  reviewerAvatar: string;
  reviewerId: number;
  rating: number;
  comment: string;
  date: string;
}

export interface Message {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: number;
  participantIds: [number, number];
  pinId: number;
  messages: Message[];
  lastActivity: string;
}

export const mockPins: Pin[] = [
	{
		id: 1,
		title: 'Mickey Mouse 50th Anniversary Limited Edition Pin',
		price: 45,
		image:
			'https://i.etsystatic.com/15122266/r/il/799d76/4258097491/il_fullxfull.4258097491_mcht.jpg?w=400&h=400&fit=crop',
		location: 'Orlando, FL',
		seller: 'DisneyFan23',
		sellerId: 1,
		sellerAvatar: '🏰',
		condition: 'new',
		isTradeOnly: false,
		isFavorite: true,
		category: 'disney',
		description:
			'Beautiful 50th anniversary Mickey Mouse pin in pristine condition. Features gold plating and limited edition numbering.',
		listingType: 'sell',
		createdAt: '2026-03-08T14:30:00Z',
	},
	{
		id: 2,
		title: 'Stitch Ohana Means Family Pin',
		price: 0,
		image:
			'https://res.cloudinary.com/teepublic/image/private/s--MDu605kq--/c_crop,x_10,y_10/c_fit,h_830/c_crop,g_north_west,h_1038,w_1038,x_-287,y_-104/l_upload:v1565806151:production:blanks:vdbwo35fw6qtflw9kezw/fl_layer_apply,g_north_west,x_-398,y_-215/b_rgb:ffffff/c_limit,f_jpg,h_630,q_90,w_630/v1597198624/production/designs/12992606_3.jpg?w=400&h=400&fit=crop',
		location: 'Los Angeles, CA',
		seller: 'StitchLover',
		sellerId: 2,
		sellerAvatar: '👽',
		condition: 'like-new',
		isTradeOnly: true,
		category: 'disney',
		description:
			"Adorable Stitch pin with the iconic 'Ohana Means Family' quote.",
		listingType: 'trade',
		createdAt: '2026-03-07T09:15:00Z',
	},
	{
		id: 3,
		title: 'Haunted Mansion Ghost Pin Set',
		price: 65,
		image:
			'https://d23.com/app/uploads/2023/07/Haunted-Mansion-Pin-ShopDisney-backer.jpg?w=400&h=400&fit=crop',
		location: 'Anaheim, CA',
		seller: 'HauntedCollector',
		sellerId: 3,
		sellerAvatar: '👻',
		condition: 'good',
		isTradeOnly: false,
		category: 'disney',
		description: 'Complete set of 3 Haunted Mansion hitchhiking ghost pins.',
		listingType: 'sell',
		createdAt: '2026-03-06T18:45:00Z',
	},
	{
		id: 4,
		title: 'Star Wars Baby Yoda Grogu Pin',
		price: 35,
		image:
			'https://i.ebayimg.com/images/g/uKkAAOSwMhhmsSBM/s-l400.jpg?w=400&h=400&fit=crop',
		location: 'Houston, TX',
		seller: 'MandalorianFan',
		sellerId: 4,
		sellerAvatar: '⭐',
		condition: 'new',
		isTradeOnly: false,
		isFavorite: true,
		category: 'starwars',
		description:
			'Brand new Baby Yoda/Grogu pin from The Mandalorian collection.',
		listingType: 'sell',
		createdAt: '2026-03-05T11:20:00Z',
	},
	{
		id: 5,
		title: 'Cinderella Castle 70th Anniversary Pin',
		price: 80,
		image:
			'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTRtxpNMB9IRXfNV3Sz_9WgnYtTNJEtTiz5Rg&s?w=400&h=400&fit=crop',
		location: 'Tampa, FL',
		seller: 'PrincessPins',
		sellerId: 5,
		sellerAvatar: '👑',
		condition: 'new',
		isTradeOnly: false,
		isFavorite: true,
		category: 'disney',
		description:
			'Stunning Cinderella Castle 70th anniversary commemorative pin.',
		listingType: 'sell',
		createdAt: '2026-03-04T16:00:00Z',
	},
	{
		id: 6,
		title: 'Universal Studios Jurassic Park Pin',
		price: 0,
		image:
			'https://i.ebayimg.com/images/g/SqoAAOSwA4Va3jZw/s-l1200.jpg?w=400&h=400&fit=crop',
		location: 'Orlando, FL',
		seller: 'DinoCollector',
		sellerId: 6,
		sellerAvatar: '🦖',
		condition: 'fair',
		isTradeOnly: true,
		category: 'universal',
		description: 'Classic Jurassic Park logo pin from Universal Studios.',
		listingType: 'trade',
		createdAt: '2026-03-03T08:30:00Z',
	},
	{
		id: 7,
		title: 'Marvel Avengers Endgame Pin Collection',
		price: 120,
		image:
			'https://i.ebayimg.com/images/g/S~sAAOSw6w5dRz9T/s-l400.jpg?w=400&h=400&fit=crop',
		location: 'New York, NY',
		seller: 'MarvelFanatic',
		sellerId: 7,
		sellerAvatar: '🦸',
		condition: 'new',
		isTradeOnly: false,
		category: 'marvel',
		description:
			'Complete Avengers Endgame pin collection featuring all original Avengers.',
		listingType: 'sell',
		createdAt: '2026-03-02T13:10:00Z',
	},
	{
		id: 8,
		title: 'Pixar Up House with Balloons Pin',
		price: 55,
		image:
			'https://i.ebayimg.com/images/g/psYAAOSw2J1lyYZ2/s-l400.jpg?w=400&h=400&fit=crop',
		location: 'San Francisco, CA',
		seller: 'PixarPinPal',
		sellerId: 8,
		sellerAvatar: '🎈',
		condition: 'like-new',
		isTradeOnly: false,
		category: 'pixar',
		description: 'Beautiful Up house pin with colorful balloon cluster.',
		listingType: 'sell',
		createdAt: '2026-03-01T20:45:00Z',
	},
];

export const mockSellers: Seller[] = [
  {
    id: 1,
    username: "DisneyFan23",
    avatar: "🏰",
    bio: "Disney pin collector since 2005. Specializing in limited edition and park exclusive pins.",
    location: "Orlando, FL",
    joinDate: "March 2020",
    rating: 4.9,
    totalReviews: 156,
    totalSales: 342,
    responseTime: "Usually responds within 1 hour",
    verified: true,
  },
  {
    id: 2,
    username: "StitchLover",
    avatar: "👽",
    bio: "Huge Lilo & Stitch fan! My collection focuses on everything Stitch.",
    location: "Los Angeles, CA",
    joinDate: "June 2021",
    rating: 4.7,
    totalReviews: 89,
    totalSales: 127,
    responseTime: "Usually responds within 2 hours",
    verified: true,
  },
  {
    id: 3,
    username: "HauntedCollector",
    avatar: "👻",
    bio: "Foolish mortal collecting Haunted Mansion memorabilia.",
    location: "Anaheim, CA",
    joinDate: "October 2019",
    rating: 4.8,
    totalReviews: 203,
    totalSales: 456,
    responseTime: "Usually responds within 30 minutes",
    verified: true,
  },
  {
    id: 4,
    username: "MandalorianFan",
    avatar: "⭐",
    bio: "This is the way. Star Wars collector focusing on The Mandalorian and Clone Wars era pins.",
    location: "Houston, TX",
    joinDate: "January 2022",
    rating: 4.6,
    totalReviews: 67,
    totalSales: 94,
    responseTime: "Usually responds within 3 hours",
    verified: false,
  },
  {
    id: 5,
    username: "PrincessPins",
    avatar: "👑",
    bio: "All things Disney Princess! From Snow White to Moana.",
    location: "Tampa, FL",
    joinDate: "August 2020",
    rating: 5.0,
    totalReviews: 234,
    totalSales: 512,
    responseTime: "Usually responds within 45 minutes",
    verified: true,
  },
  {
    id: 6,
    username: "DinoCollector",
    avatar: "🦖",
    bio: "Universal Studios enthusiast with a passion for Jurassic Park.",
    location: "Orlando, FL",
    joinDate: "May 2021",
    rating: 4.3,
    totalReviews: 42,
    totalSales: 58,
    responseTime: "Usually responds within 4 hours",
    verified: false,
  },
  {
    id: 7,
    username: "MarvelFanatic",
    avatar: "🦸",
    bio: "Avengers assemble! Collecting Marvel pins since Phase 1.",
    location: "New York, NY",
    joinDate: "April 2019",
    rating: 4.9,
    totalReviews: 312,
    totalSales: 678,
    responseTime: "Usually responds within 1 hour",
    verified: true,
  },
  {
    id: 8,
    username: "PixarPinPal",
    avatar: "🎈",
    bio: "To infinity and beyond! Pixar fan collecting everything from Toy Story to Soul.",
    location: "San Francisco, CA",
    joinDate: "February 2022",
    rating: 4.5,
    totalReviews: 53,
    totalSales: 71,
    responseTime: "Usually responds within 2 hours",
    verified: true,
  },
];

export const mockReviews: Review[] = [
  {
    id: 1,
    reviewer: "PinTrader99",
    reviewerAvatar: "⭐",
    reviewerId: 4,
    rating: 5,
    comment: "Amazing seller! Pin was exactly as described and shipped super fast.",
    date: "2 days ago",
  },
  {
    id: 2,
    reviewer: "MagicCollector",
    reviewerAvatar: "✨",
    reviewerId: 5,
    rating: 5,
    comment: "Great communication throughout the trade. Very fair and honest.",
    date: "1 week ago",
  },
  {
    id: 3,
    reviewer: "DisneyDreamer",
    reviewerAvatar: "🌟",
    reviewerId: 6,
    rating: 4,
    comment: "Good experience overall. Shipping took a bit longer than expected but the pin was in perfect condition.",
    date: "2 weeks ago",
  },
  {
    id: 4,
    reviewer: "PrincessPins",
    reviewerAvatar: "👑",
    reviewerId: 5,
    rating: 5,
    comment: "Wonderful trade partner! The pin was beautifully packaged.",
    date: "3 weeks ago",
  },
  {
    id: 5,
    reviewer: "MarvelFanatic",
    reviewerAvatar: "🦸",
    reviewerId: 7,
    rating: 4,
    comment: "Solid transaction. Minor imperfections not in listing but seller offered partial refund.",
    date: "1 month ago",
  },
  {
    id: 6,
    reviewer: "PixarPinPal",
    reviewerAvatar: "🎈",
    reviewerId: 8,
    rating: 5,
    comment: "Best seller I've dealt with! Lightning fast shipping.",
    date: "1 month ago",
  },
];

export const mockConversations: Conversation[] = [
  {
    id: 1,
    participantIds: [1, 2],
    pinId: 2,
    lastActivity: "2026-03-09T10:30:00Z",
    messages: [
      { id: 1, senderId: 1, text: "Hey! I'm interested in your Stitch pin. Would you trade for my Goofy limited edition?", timestamp: "2026-03-09T09:00:00Z", isRead: true },
      { id: 2, senderId: 2, text: "Hi! Thanks for reaching out 😊 Can you send me a pic of the Goofy pin?", timestamp: "2026-03-09T09:15:00Z", isRead: true },
      { id: 3, senderId: 1, text: "Sure! Here's a description — it's the 2024 Parks Exclusive Goofy with gold trim. Mint condition, never displayed.", timestamp: "2026-03-09T09:30:00Z", isRead: true },
      { id: 4, senderId: 2, text: "Oh wow that sounds amazing! I'd definitely be open to that trade. Want to meet at Disney Springs this weekend?", timestamp: "2026-03-09T09:45:00Z", isRead: true },
      { id: 5, senderId: 1, text: "Perfect! Saturday afternoon works for me. Around 2pm at the pin trading store?", timestamp: "2026-03-09T10:00:00Z", isRead: true },
      { id: 6, senderId: 2, text: "Sounds great! See you there! 🎉", timestamp: "2026-03-09T10:30:00Z", isRead: false },
    ],
  },
  {
    id: 2,
    participantIds: [1, 3],
    pinId: 3,
    lastActivity: "2026-03-08T16:20:00Z",
    messages: [
      { id: 7, senderId: 1, text: "Hi! Is the Haunted Mansion Ghost Pin Set still available?", timestamp: "2026-03-08T14:00:00Z", isRead: true },
      { id: 8, senderId: 3, text: "Yes it is! Are you interested in buying or trading?", timestamp: "2026-03-08T14:30:00Z", isRead: true },
      { id: 9, senderId: 1, text: "I'd like to buy it. Would you accept $55?", timestamp: "2026-03-08T15:00:00Z", isRead: true },
      { id: 10, senderId: 3, text: "I can do $60 since it's a complete set. That's my best price.", timestamp: "2026-03-08T15:30:00Z", isRead: true },
      { id: 11, senderId: 1, text: "Deal! How do you want to handle payment and shipping?", timestamp: "2026-03-08T16:00:00Z", isRead: true },
      { id: 12, senderId: 3, text: "I'll send you a payment link. I ship USPS Priority with tracking, usually ships within 24 hours! 📦", timestamp: "2026-03-08T16:20:00Z", isRead: false },
    ],
  },
  {
    id: 3,
    participantIds: [1, 5],
    pinId: 5,
    lastActivity: "2026-03-07T12:00:00Z",
    messages: [
      { id: 13, senderId: 5, text: "Hi DisneyFan23! I saw your Mickey 50th Anniversary pin. Would you consider a trade for my Cinderella Castle pin?", timestamp: "2026-03-07T10:00:00Z", isRead: true },
      { id: 14, senderId: 1, text: "That's a beautiful pin! But I'm mainly looking to sell this one. Would you be interested in buying?", timestamp: "2026-03-07T10:30:00Z", isRead: true },
      { id: 15, senderId: 5, text: "Understandable! Let me think about it and get back to you.", timestamp: "2026-03-07T11:00:00Z", isRead: true },
      { id: 16, senderId: 1, text: "No rush! It'll be here whenever you're ready 😊", timestamp: "2026-03-07T12:00:00Z", isRead: true },
    ],
  },
  {
    id: 4,
    participantIds: [1, 7],
    pinId: 7,
    lastActivity: "2026-03-06T22:15:00Z",
    messages: [
      { id: 17, senderId: 7, text: "Hey! Fellow Marvel fan here. I noticed you had some interest in Avengers pins. I have the complete Endgame set if you're interested!", timestamp: "2026-03-06T20:00:00Z", isRead: true },
      { id: 18, senderId: 1, text: "Oh nice! How much are you asking for the full set?", timestamp: "2026-03-06T20:30:00Z", isRead: true },
      { id: 19, senderId: 7, text: "$120 for the full set of 6. Each pin is individually numbered and comes with COA.", timestamp: "2026-03-06T21:00:00Z", isRead: true },
      { id: 20, senderId: 1, text: "That's a great price. Let me check my budget and I'll get back to you by tomorrow!", timestamp: "2026-03-06T21:30:00Z", isRead: true },
      { id: 21, senderId: 7, text: "Sounds good! No pressure at all. I also have some standalone Iron Man pins if you're interested in just one. 🦸‍♂️", timestamp: "2026-03-06T22:15:00Z", isRead: true },
    ],
  },
];

export const getSellerById = (id: number): Seller => {
  return mockSellers.find(s => s.id === id) || mockSellers[0];
};

export const categories = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "disney", label: "Disney", emoji: "🏰" },
  { id: "universal", label: "Universal", emoji: "🎢" },
  { id: "marvel", label: "Marvel", emoji: "🦸" },
  { id: "starwars", label: "Star Wars", emoji: "⭐" },
  { id: "pixar", label: "Pixar", emoji: "🎬" },
  { id: "apparel", label: "Apparel", emoji: "👕" },
  { id: "rare", label: "Rare", emoji: "💎" },
];