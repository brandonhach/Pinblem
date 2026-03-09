import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface SignedOutGuardProps {
  children: React.ReactNode;
  /** Optional custom message shown to signed-out users */
  message?: string;
}

const SignedOutGuard = ({ children, message }: SignedOutGuardProps) => {
  const { user, isLoading } = useAuth();

  // TODO: Re-enable auth guard when ready
  const bypassGuard = true;

  if (!bypassGuard && isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!bypassGuard && !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-5">
          <LockKeyhole className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          Sign in required
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          {message ?? "You need to be signed in to view this page."}
        </p>
        <div className="flex gap-3">
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Browse Pins</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SignedOutGuard;
