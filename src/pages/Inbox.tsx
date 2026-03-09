import Navbar from "@/components/Navbar";
import { MessageCircle } from "lucide-react";

const Inbox = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Messages
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Your conversations with buyers and sellers will appear here.
            Start browsing to find something you like!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
