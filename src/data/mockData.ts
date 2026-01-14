export interface User {
  id: string;
  name: string;
  avatar: string;
  location: string;
  country: string;
  bio: string;
  skillsOffered: string[];
  skillsWanted: string[];
  rating: number;
  reviewCount: number;
  swapsCompleted: number;
  badges: Badge[];
  joinedDate: string;
  languages: string[];
  timezone: string;
  availability: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: string;
}

export interface Swap {
  id: string;
  title: string;
  description: string;
  skillOffered: string;
  skillWanted: string;
  user: User;
  participantId?: string;
  category: string;
  duration: string;
  format: 'online' | 'in-person' | 'both';
  status: 'open' | 'active' | 'pending' | 'completed';
  createdAt: string;
  matchScore?: number;
  schedule?: string;
  totalHours?: number;
  completedSessions?: number;
  totalSessions?: number;
  rating?: number;
}

export interface Review {
  id: string;
  reviewer: User;
  rating: number;
  comment: string;
  skillExchanged: string;
  date: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  swapId?: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  author: User;
  category: string;
  replies: number;
  views: number;
  lastActivity: string;
  isPinned: boolean;
}

export interface Notification {
  id: string;
  type: 'match' | 'message' | 'review' | 'badge' | 'swap';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Amara Okonkwo',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop',
    location: 'Lagos',
    country: 'Nigeria',
    bio: 'Passionate about sharing African textile traditions and eager to learn digital marketing strategies.',
    skillsOffered: ['African Textile Art', 'Yoruba Language', 'Traditional Cooking'],
    skillsWanted: ['Digital Marketing', 'Social Media Strategy', 'E-commerce'],
    rating: 4.9,
    reviewCount: 47,
    swapsCompleted: 52,
    badges: [
      { id: 'b1', name: 'Cultural Ambassador', icon: '🌍', description: 'Completed 50+ swaps', earnedDate: '2024-01-15' },
      { id: 'b2', name: 'Top Rated', icon: '⭐', description: 'Maintained 4.8+ rating', earnedDate: '2024-02-20' }
    ],
    joinedDate: '2023-06-15',
    languages: ['English', 'Yoruba', 'French'],
    timezone: 'WAT',
    availability: 'Weekday evenings, Weekend mornings'
  },
  {
    id: '2',
    name: 'Kenji Tanaka',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    location: 'Tokyo',
    country: 'Japan',
    bio: 'Software engineer by day, calligraphy enthusiast by heart. Looking to exchange cultural arts.',
    skillsOffered: ['Japanese Calligraphy', 'Origami', 'Japanese Language'],
    skillsWanted: ['Spanish Language', 'Guitar', 'Latin Dance'],
    rating: 4.8,
    reviewCount: 31,
    swapsCompleted: 38,
    badges: [
      { id: 'b3', name: 'Quick Responder', icon: '⚡', description: 'Responds within 24 hours', earnedDate: '2024-03-10' }
    ],
    joinedDate: '2023-08-22',
    languages: ['Japanese', 'English'],
    timezone: 'JST',
    availability: 'Weekends'
  },
  {
    id: '3',
    name: 'Sofia Martinez',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    location: 'Buenos Aires',
    country: 'Argentina',
    bio: 'Professional tango dancer offering lessons in exchange for learning new languages and crafts.',
    skillsOffered: ['Tango Dancing', 'Spanish Language', 'Argentine Cuisine'],
    skillsWanted: ['Photography', 'Japanese Language', 'Pottery'],
    rating: 5.0,
    reviewCount: 89,
    swapsCompleted: 95,
    badges: [
      { id: 'b4', name: 'Super Swapper', icon: '🏆', description: 'Completed 100+ swaps', earnedDate: '2024-04-05' },
      { id: 'b5', name: 'Perfect Score', icon: '💎', description: 'Achieved 5.0 rating', earnedDate: '2024-04-10' }
    ],
    joinedDate: '2023-02-10',
    languages: ['Spanish', 'English', 'Portuguese'],
    timezone: 'ART',
    availability: 'Flexible'
  },
  {
    id: '4',
    name: 'Erik Lindgren',
    avatar: "/assets/images/profile_placeholder.png",
    location: 'Stockholm',
    country: 'Sweden',
    bio: 'Woodworking craftsman with 20 years of experience. Want to learn new cooking traditions.',
    skillsOffered: ['Woodworking', 'Swedish Language', 'Furniture Design'],
    skillsWanted: ['Asian Cuisine', 'Meditation', 'Yoga'],
    rating: 4.7,
    reviewCount: 23,
    swapsCompleted: 28,
    badges: [
      { id: 'b6', name: 'Master Craftsman', icon: '🔨', description: 'Expert in craft skills', earnedDate: '2024-02-28' }
    ],
    joinedDate: '2023-11-05',
    languages: ['Swedish', 'English', 'Norwegian'],
    timezone: 'CET',
    availability: 'Evening hours'
  },
  {
    id: '5',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    location: 'Mumbai',
    country: 'India',
    bio: 'Yoga instructor and Ayurvedic cooking expert. Interested in learning Western musical instruments.',
    skillsOffered: ['Yoga', 'Ayurvedic Cooking', 'Hindi Language', 'Meditation'],
    skillsWanted: ['Piano', 'Violin', 'Music Theory'],
    rating: 4.9,
    reviewCount: 67,
    swapsCompleted: 72,
    badges: [
      { id: 'b7', name: 'Wellness Guru', icon: '🧘', description: 'Health & wellness expert', earnedDate: '2024-01-20' }
    ],
    joinedDate: '2023-04-18',
    languages: ['Hindi', 'English', 'Marathi'],
    timezone: 'IST',
    availability: 'Early mornings, Evenings'
  }
];

// Mock Swaps
export const mockSwaps: Swap[] = [
  {
    id: 's1',
    title: 'Learn Traditional Textile Art',
    description: 'I will teach you the ancient art of Adire (tie-dye) and Aso-oke weaving techniques passed down through generations.',
    skillOffered: 'African Textile Art',
    skillWanted: 'Digital Marketing',
    user: mockUsers[0],
    participantId: '1',
    category: 'Arts & Crafts',
    duration: '4-6 weeks',
    format: 'online',
    status: 'active',
    createdAt: '2024-11-28',
    matchScore: 95,
    schedule: 'Tue & Thu 6PM',
    totalHours: 12,
    completedSessions: 4,
    totalSessions: 8
  },
  {
    id: 's2',
    title: 'Japanese Calligraphy Basics',
    description: 'Master the art of Shodo - Japanese calligraphy. I will guide you through brush techniques, stroke order, and artistic expression.',
    skillOffered: 'Japanese Calligraphy',
    skillWanted: 'Spanish Language',
    user: mockUsers[1],
    participantId: '2',
    category: 'Arts & Crafts',
    duration: '8 weeks',
    format: 'online',
    status: 'pending',
    createdAt: '2024-11-25',
    matchScore: 88,
    schedule: 'Sat 10AM',
    totalHours: 16,
    completedSessions: 0,
    totalSessions: 8
  },
  {
    id: 's3',
    title: 'Authentic Tango Lessons',
    description: 'Learn the passion and technique of Argentine Tango from a professional dancer. From basic steps to advanced moves.',
    skillOffered: 'Tango Dancing',
    skillWanted: 'Photography',
    user: mockUsers[2],
    participantId: '3',
    category: 'Dance & Movement',
    duration: '12 weeks',
    format: 'both',
    status: 'completed',
    createdAt: '2024-11-20',
    matchScore: 92,
    schedule: 'Mon & Wed 7PM',
    totalHours: 24,
    completedSessions: 12,
    totalSessions: 12,
    rating: 5
  },
  {
    id: 's4',
    title: 'Scandinavian Woodworking',
    description: 'Traditional Swedish woodworking techniques including joinery, carving, and furniture making.',
    skillOffered: 'Woodworking',
    skillWanted: 'Asian Cuisine',
    user: mockUsers[3],
    participantId: '4',
    category: 'Craftsmanship',
    duration: '10 weeks',
    format: 'online',
    status: 'active',
    createdAt: '2024-11-15',
    matchScore: 85,
    schedule: 'Sun 2PM',
    totalHours: 20,
    completedSessions: 6,
    totalSessions: 10
  },
  {
    id: 's5',
    title: 'Yoga & Meditation Journey',
    description: 'Comprehensive yoga training including asanas, pranayama, and meditation techniques rooted in ancient traditions.',
    skillOffered: 'Yoga',
    skillWanted: 'Piano',
    user: mockUsers[4],
    participantId: '5',
    category: 'Wellness',
    duration: '8 weeks',
    format: 'online',
    status: 'completed',
    createdAt: '2024-11-10',
    matchScore: 90,
    schedule: 'Daily 6AM',
    totalHours: 16,
    completedSessions: 8,
    totalSessions: 8,
    rating: 4
  },
  {
    id: 's6',
    title: 'Open Swap - Learn Cooking',
    description: 'Want to learn traditional cooking techniques from various cultures.',
    skillOffered: 'Web Development',
    skillWanted: 'Traditional Cooking',
    user: mockUsers[0],
    category: 'Cooking & Cuisine',
    duration: '6 weeks',
    format: 'online',
    status: 'open',
    createdAt: '2024-12-01',
    matchScore: 78
  }
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: 'r1',
    reviewer: mockUsers[2],
    rating: 5,
    comment: 'Amara is an incredible teacher! Her patience and deep knowledge of textile art made learning so enjoyable.',
    skillExchanged: 'African Textile Art',
    date: '2024-11-20'
  },
  {
    id: 'r2',
    reviewer: mockUsers[4],
    rating: 5,
    comment: 'The calligraphy lessons were transformative. Kenji has a gift for teaching.',
    skillExchanged: 'Japanese Calligraphy',
    date: '2024-11-15'
  },
  {
    id: 'r3',
    reviewer: mockUsers[1],
    rating: 5,
    comment: 'Sofia made learning tango feel natural and fun. Her energy is contagious!',
    skillExchanged: 'Tango Dancing',
    date: '2024-11-10'
  }
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  { 
    id: 'c1',
    participants: [mockUsers[0], mockUsers[2]],
    lastMessage: {
      id: 'm1',
      senderId: '3',
      content: 'Looking forward to our session tomorrow!',
      timestamp: '2024-11-28T14:30:00Z',
      read: false
    },
    unreadCount: 2,
    swapId: 's1'
  },
  {
    id: 'c2',
    participants: [mockUsers[0], mockUsers[1]],
    lastMessage: {
      id: 'm2',
      senderId: '2',
      content: 'Thank you for the wonderful lesson!',
      timestamp: '2024-11-27T09:15:00Z',
      read: true
    },
    unreadCount: 0,
    swapId: 's2'
  }
];

// Mock Forum Topics
export const mockForumTopics: ForumTopic[] = [
  {
    id: 'f1',
    title: 'Best practices for online skill exchanges',
    author: mockUsers[2],
    category: 'Tips & Tricks',
    replies: 45,
    views: 320,
    lastActivity: '2024-11-28T16:00:00Z',
    isPinned: true
  },
  {
    id: 'f2',
    title: 'Share your cultural exchange stories!',
    author: mockUsers[0],
    category: 'Community',
    replies: 89,
    views: 567,
    lastActivity: '2024-11-28T12:00:00Z',
    isPinned: true
  },
  {
    id: 'f3',
    title: 'Looking for language exchange partners - Spanish/Japanese',
    author: mockUsers[1],
    category: 'Language Exchange',
    replies: 12,
    views: 98,
    lastActivity: '2024-11-27T18:00:00Z',
    isPinned: false
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'match',
    title: 'New Match Found!',
    description: 'Sofia Martinez matches 92% with your skill preferences',
    timestamp: '2024-11-28T10:00:00Z',
    read: false,
    link: '/swaps/s3'
  },
  {
    id: 'n2',
    type: 'message',
    title: 'New Message',
    description: 'Kenji sent you a message',
    timestamp: '2024-11-27T15:30:00Z',
    read: false,
    link: '/messages/c2'
  },
  {
    id: 'n3',
    type: 'badge',
    title: 'Badge Earned!',
    description: 'You earned the "Quick Responder" badge',
    timestamp: '2024-11-26T09:00:00Z',
    read: true
  },
  {
    id: 'n4',
    type: 'review',
    title: 'New Review',
    description: 'Sofia left you a 5-star review',
    timestamp: '2024-11-25T14:00:00Z',
    read: true,
    link: '/profile'
  }
];

// Categories
export const skillCategories = [
  { id: 'arts', name: 'Arts & Crafts', icon: '🎨', count: 245 },
  { id: 'languages', name: 'Languages', icon: '🗣️', count: 412 },
  { id: 'music', name: 'Music', icon: '🎵', count: 178 },
  { id: 'dance', name: 'Dance & Movement', icon: '💃', count: 134 },
  { id: 'cooking', name: 'Cooking & Cuisine', icon: '🍳', count: 289 },
  { id: 'tech', name: 'Technology', icon: '💻', count: 356 },
  { id: 'wellness', name: 'Wellness & Fitness', icon: '🧘', count: 201 },
  { id: 'crafts', name: 'Craftsmanship', icon: '🔨', count: 156 },
  { id: 'business', name: 'Business & Entrepreneurship', icon: '💼', count: 189 },
  { id: 'academic', name: 'Academic', icon: '📚', count: 167 },
  { id: 'sports', name: 'Sports', icon: '⚽', count: 145 }
];

// Current logged in user (for demo purposes)
export const currentUser: User = {
  id: 'current',
  name: 'Alex Chen',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
  location: 'San Francisco',
  country: 'USA',
  bio: 'Tech entrepreneur interested in learning traditional arts and crafts from around the world.',
  skillsOffered: ['Web Development', 'Digital Marketing', 'Photography'],
  skillsWanted: ['Calligraphy', 'Cooking', 'Traditional Arts'],
  rating: 4.6,
  reviewCount: 15,
  swapsCompleted: 18,
  badges: [
    { id: 'b8', name: 'Early Adopter', icon: '🚀', description: 'Joined in first year', earnedDate: '2023-05-01' }
  ],
  joinedDate: '2023-05-01',
  languages: ['English', 'Mandarin'],
  timezone: 'PST',
  availability: 'Evenings and weekends'
};