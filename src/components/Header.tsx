import { Bell, MessageCircle, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

  const notifications = [
    { id: 1, title: "New trade offer", message: "Mickey Mouse pin trade request", time: "2m ago", unread: true },
    { id: 2, title: "Price drop alert", message: "Stitch pin is now $15", time: "1h ago", unread: true },
    { id: 3, title: "Trade completed", message: "Your Elsa pin trade is complete", time: "3h ago", unread: false },
  ];

  const messages = [
    { id: 1, user: "DisneyFan23", avatar: "🏰", message: "Is the Tinkerbell pin still available?", time: "5m ago", unread: true },
    { id: 2, user: "PinCollector", avatar: "📌", message: "Thanks for the trade!", time: "2h ago", unread: false },
    { id: 3, user: "MagicTrader", avatar: "✨", message: "I have a rare Cinderella pin", time: "1d ago", unread: false },
  ];

  const unreadNotifications = notifications.filter(n => n.unread).length;
  const unreadMessages = messages.filter(m => m.unread).length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-ghost btn-sm btn-circle lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
            <span className="text-2xl">📌</span>
            <span className="text-xl font-bold text-primary">LeePin</span>
          </Link>
        </div>

        {/* Search - Hidden on mobile, visible on larger screens */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search pins, traders..." 
              className="input input-bordered w-full pl-10 h-10 bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search button for mobile */}
          <button className="btn btn-ghost btn-sm btn-circle md:hidden">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications Dropdown */}
          <div className="dropdown dropdown-end">
            <button 
              tabIndex={0}
              className="btn btn-ghost btn-sm btn-circle relative"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsMessagesOpen(false);
              }}
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 badge badge-sm bg-destructive text-destructive-foreground border-none">
                  {unreadNotifications}
                </span>
              )}
            </button>
            {isNotificationsOpen && (
              <div tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-card rounded-box w-80 mt-2 border border-border">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <button className="text-xs text-primary hover:underline">Mark all read</button>
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <a className={`flex flex-col items-start gap-1 py-3 ${notification.unread ? 'bg-accent/20' : ''}`}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm text-foreground">{notification.title}</span>
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{notification.message}</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border px-3 py-2">
                  <a href="/notifications" className="text-sm text-primary hover:underline">View all notifications</a>
                </div>
              </div>
            )}
          </div>

          {/* Messages Dropdown */}
          <div className="dropdown dropdown-end">
            <button 
              tabIndex={0}
              className="btn btn-ghost btn-sm btn-circle relative"
              onClick={() => {
                setIsMessagesOpen(!isMessagesOpen);
                setIsNotificationsOpen(false);
              }}
            >
              <MessageCircle className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 badge badge-sm bg-destructive text-destructive-foreground border-none">
                  {unreadMessages}
                </span>
              )}
            </button>
            {isMessagesOpen && (
              <div tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-card rounded-box w-80 mt-2 border border-border">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <h3 className="font-semibold text-foreground">Messages</h3>
                  <button className="text-xs text-primary hover:underline">New message</button>
                </div>
                <ul className="max-h-64 overflow-y-auto">
                  {messages.map((msg) => (
                    <li key={msg.id}>
                      <a className={`flex items-start gap-3 py-3 ${msg.unread ? 'bg-accent/20' : ''}`}>
                        <div className="avatar placeholder">
                          <div className="bg-secondary text-secondary-foreground rounded-full w-10 h-10 flex items-center justify-center text-lg">
                            {msg.avatar}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-foreground">{msg.user}</span>
                            <span className="text-xs text-muted-foreground">{msg.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{msg.message}</p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border px-3 py-2">
                  <a href="/messages" className="text-sm text-primary hover:underline">View all messages</a>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle avatar">
              <div className="w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                LP
              </div>
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-card rounded-box w-52 mt-2 border border-border">
              <li><a className="text-foreground">My Profile</a></li>
              <li><a className="text-foreground">My Listings</a></li>
              <li><a className="text-foreground">Trade History</a></li>
              <li><a className="text-foreground">Settings</a></li>
              <div className="divider my-1"></div>
              <li><a className="text-destructive">Sign Out</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card">
          <nav className="container px-4 py-3">
            <ul className="menu menu-compact">
              <li>
                <Link to="/" className="text-foreground" onClick={() => setIsMenuOpen(false)}>
                  Browse
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-foreground" onClick={() => setIsMenuOpen(false)}>
                  Search
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-foreground" onClick={() => setIsMenuOpen(false)}>
                  Sell
                </Link>
              </li>
              <li>
                <Link to="/inbox" className="text-foreground" onClick={() => setIsMenuOpen(false)}>
                  Inbox
                </Link>
              </li>
              <li>
                <Link to="/profile/1" className="text-foreground" onClick={() => setIsMenuOpen(false)}>
                  Profile
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
