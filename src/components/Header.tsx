import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="border-b border-outline-variant/30 bg-surface">
      <div className="container py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-semibold">∞</span>
            </div>
            <span className="font-serif text-xl text-foreground tracking-tight">
              Soul Mentor
            </span>
          </Link>

          {user ? (
            <>
              <div className="flex items-center gap-4">
                <Link href="/chat">
                  <Button variant="ghost" className="ui-sm">
                    Conversations
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleSignOut} className="ui-sm">
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="ui-sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="ui-sm">
                    Begin
                  </Button>
                </Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}