import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import SignedOutGuard from "@/components/SignedOutGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockConversations, mockSellers, mockPins, getSellerById } from "@/data/mockData";
import { cn } from "@/lib/utils";

const CURRENT_USER_ID = 1;

const Messages = () => {
  const [conversations] = useState(mockConversations);
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockConversations);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConvo = messages.find(c => c.id === activeConvoId);
  const otherParticipant = activeConvo
    ? getSellerById(activeConvo.participantIds.find(id => id !== CURRENT_USER_ID) || 0)
    : null;
  const activePin = activeConvo ? mockPins.find(p => p.id === activeConvo.pinId) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConvo?.messages.length]);

  const filteredConversations = conversations.filter(c => {
    const otherId = c.participantIds.find(id => id !== CURRENT_USER_ID) || 0;
    const other = getSellerById(otherId);
    return other.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSend = () => {
    if (!newMessage.trim() || !activeConvoId) return;
    
    setMessages(prev =>
      prev.map(c =>
        c.id === activeConvoId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: Date.now(),
                  senderId: CURRENT_USER_ID,
                  text: newMessage.trim(),
                  timestamp: new Date().toISOString(),
                  isRead: false,
                },
              ],
              lastActivity: new Date().toISOString(),
            }
          : c
      )
    );
    setNewMessage("");
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ago`;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (hours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <SignedOutGuard message="Sign in to view your messages.">

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
        {/* Conversation List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border bg-card flex flex-col shrink-0",
          activeConvoId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-border">
            <h1 className="font-display text-lg font-bold text-foreground mb-3">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((convo) => {
              const otherId = convo.participantIds.find(id => id !== CURRENT_USER_ID) || 0;
              const other = getSellerById(otherId);
              const lastMsg = convo.messages[convo.messages.length - 1];
              const unreadCount = convo.messages.filter(m => !m.isRead && m.senderId !== CURRENT_USER_ID).length;
              const pin = mockPins.find(p => p.id === convo.pinId);

              return (
                <button
                  key={convo.id}
                  onClick={() => setActiveConvoId(convo.id)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border",
                    activeConvoId === convo.id && "bg-accent/30"
                  )}
                >
                  <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">
                    {other.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"
                      )}>
                        {other.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTime(convo.lastActivity)}
                      </span>
                    </div>
                    {pin && (
                      <div className="text-[10px] text-primary truncate">
                        Re: {pin.title}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn(
                        "text-xs truncate",
                        unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {lastMsg.senderId === CURRENT_USER_ID ? "You: " : ""}{lastMsg.text}
                      </p>
                      {unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        {activeConvoId && activeConvo ? (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Chat Header */}
            <div className="sticky top-0 z-10 p-4 border-b border-border bg-card flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={() => setActiveConvoId(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <Link to={`/profile/${otherParticipant?.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg shrink-0">
                  {otherParticipant?.avatar}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-foreground text-sm">{otherParticipant?.username}</div>
                  <div className="text-xs text-muted-foreground">{otherParticipant?.responseTime}</div>
                </div>
              </Link>

              {activePin && (
                <Link
                  to={`/pin/${activePin.id}`}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors shrink-0"
                >
                  <img src={activePin.image} alt="" className="w-8 h-8 rounded object-cover" />
                  <div className="text-xs">
                    <div className="text-foreground font-medium truncate max-w-[120px]">{activePin.title}</div>
                    <div className="text-primary font-semibold">
                      {activePin.isTradeOnly ? "Trade" : `$${activePin.price}`}
                    </div>
                  </div>
                </Link>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConvo.messages.map((msg) => {
                const isOwn = msg.senderId === CURRENT_USER_ID;
                return (
                  <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border text-foreground rounded-bl-md"
                    )}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {formatMessageTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="sticky bottom-0 z-10 p-4 border-t border-border bg-card shrink-0">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <h2 className="font-display text-lg font-semibold text-foreground mb-1">Your Messages</h2>
              <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
      </SignedOutGuard>
    </div>
  );
};

export default Messages;