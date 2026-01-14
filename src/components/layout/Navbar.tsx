import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Bell, MessageCircle, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { notificationService } from "@/lib/notificationService";
import { messageService } from "@/lib/messageService";
import { profileService } from "@/lib/profileService";

interface NavbarProps {
  isLoggedIn?: boolean;
}

const Navbar = ({ isLoggedIn = false }: NavbarProps) => {
  // Initialize from localStorage cache to avoid flickering
  const cachedProfile = typeof window !== 'undefined' ? (() => {
    try {
      const cached = localStorage.getItem('navbar_profile_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  })() : null;

  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState(cachedProfile?.userName || "User");
  const [userImage, setUserImage] = useState<string | null>(cachedProfile?.userImage || null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [senderProfiles, setSenderProfiles] = useState<Record<string, any>>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch from user_profiles table to get latest data
          const profile = await profileService.getProfile(user.id);
          if (profile) {
            const name = profile.full_name || user.email?.split('@')[0] || "User";
            const image = profile.profile_image_url || null;
            setUserName(name);
            setUserImage(image);
            // Update localStorage cache
            localStorage.setItem('navbar_profile_cache', JSON.stringify({ userName: name, userImage: image }));
          } else {
            const name = user.email?.split('@')[0] || "User";
            setUserName(name);
            setUserImage(null);
            // Update localStorage cache
            localStorage.setItem('navbar_profile_cache', JSON.stringify({ userName: name, userImage: null }));
          }
          // Reset the loaded flag so next navigation can refresh if needed
          setProfileLoaded(true);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    // Get logged in user
    const loadUser = async () => {
      // Only load if not already loaded
      if (profileLoaded) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);

          // Fetch profile data from user_profiles table
          const profile = await profileService.getProfile(user.id);
          if (profile) {
            const name = profile.full_name || user.email?.split('@')[0] || "User";
            const image = profile.profile_image_url || null;
            setUserName(name);
            setUserImage(image);
            // Cache in localStorage
            localStorage.setItem('navbar_profile_cache', JSON.stringify({ userName: name, userImage: image }));
          } else {
            const name = user.email?.split('@')[0] || "User";
            setUserName(name);
            setUserImage(null);
            // Cache fallback
            localStorage.setItem('navbar_profile_cache', JSON.stringify({ userName: name, userImage: null }));
          }

          // Mark profile as loaded
          setProfileLoaded(true);

          // Load notifications
          const unreadNotifs = await notificationService.getUnreadNotifications(user.id);
          setNotifications(unreadNotifs);
          setUnreadCount(unreadNotifs.length);

          // Load unread message count
          const unreadMsgs = await messageService.getUnreadCount(user.id);
          setUnreadMessages(unreadMsgs);

          // Load sender profiles
          const profiles: Record<string, any> = {};
          for (const notif of unreadNotifs) {
            if (notif.sender_id && !profiles[notif.sender_id]) {
              const senderProfile = await profileService.getProfile(notif.sender_id);
              profiles[notif.sender_id] = senderProfile;
            }
          }
          setSenderProfiles(profiles);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    if (isLoggedIn) {
      loadUser();
    }
  }, [isLoggedIn, profileLoaded]);

  // Handle subscriptions separately once currentUser is available
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) return;

    // Set up real-time subscription for notifications
    const subscription = notificationService.subscribeToNotifications(
      currentUser.id,
      async (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Load sender profile
        if (newNotification.sender_id) {
          const profile = await profileService.getProfile(newNotification.sender_id);
          setSenderProfiles(prev => ({ ...prev, [newNotification.sender_id]: profile }));
        }
      }
    );

    // Subscribe to messages for count
    const msgSub = supabase
      .channel(`unread_messages_count_${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUser.id}`
      }, () => {
        setUnreadMessages(prev => prev + 1);
      })
      .subscribe();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
      if (msgSub) supabase.removeChannel(msgSub);
    };
  }, [isLoggedIn, currentUser?.id]);

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Swaps", href: "/swaps" },
    { name: "Discover", href: "/discover" },
    // { name: "Community", href: "/community" }, // Hidden for now
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear localStorage cache
      localStorage.removeItem('navbar_profile_cache');
      // Redirect to landing page
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-terracotta to-teal">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              CultureSwap
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {isLoggedIn && navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                {link.name}
              </Link>
            ))}

          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Messages */}
                <Button variant="ghost" size="icon" asChild className="relative">
                  <Link to="/messages">
                    <MessageCircle className="h-5 w-5" />
                    {unreadMessages > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-terracotta text-white text-[10px]">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </Badge>
                    )}
                  </Link>
                </Button>

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-terracotta text-white text-xs">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-3 border-b border-border">
                      <h4 className="font-semibold">Notifications</h4>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No new notifications
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification) => {
                        const senderProfile = senderProfiles[notification.sender_id];
                        return (
                          <DropdownMenuItem
                            key={notification.id}
                            className="p-3 cursor-pointer hover:bg-muted"
                            onClick={() => {
                              notificationService.markAsRead(notification.id);
                              setUnreadCount(prev => Math.max(0, prev - 1));
                              setNotifications(prev => prev.map(n =>
                                n.id === notification.id ? { ...n, read: true } : n
                              ));
                              navigate(`/messages?user=${notification.sender_id}`);
                            }}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <img
                                src={senderProfile?.profile_image_url || "/placeholder.svg"}
                                alt="Sender"
                                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{senderProfile?.full_name || 'User'}</p>
                                <p className="text-xs text-muted-foreground truncate">{notification.body}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                    {notifications.length > 5 && (
                      <>
                        <DropdownMenuSeparator />
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 pl-2 pr-3">
                      <img
                        src={userImage || "/placeholder.svg"}
                        alt={userName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium">{userName}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-3 border-b border-border">
                      <p className="font-semibold">{userName}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="gap-2">
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Login/Signup buttons shown when user is not logged in */}
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="terracotta" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 mt-6">
                {isLoggedIn && (
                  <div className="flex items-center gap-3 pb-4 border-b border-border">
                    <div>
                      <p className="font-semibold">{userName}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {isLoggedIn && navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                        }`}
                    >
                      {link.name}
                    </Link>
                  ))}

                </div>

                <div className="mt-auto pt-4 border-t border-border">
                  {isLoggedIn ? (
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/profile" onClick={() => setIsOpen(false)}>
                          My Profile
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full text-destructive"
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                      >
                        Log Out
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" asChild className="w-full">
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          Log In
                        </Link>
                      </Button>
                      <Button variant="terracotta" asChild className="w-full">
                        <Link to="/signup" onClick={() => setIsOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;