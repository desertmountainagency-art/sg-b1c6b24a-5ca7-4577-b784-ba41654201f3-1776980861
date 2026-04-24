import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Loader2 } from "lucide-react";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("Signup attempt:", { email, password: "***", name });

    try {
      // Validate inputs
      if (!email || !password || !name) {
        throw new Error("Please fill in all fields");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      console.log("Calling signup...");
      const { user, error: signUpError } = await signup(email, password, name);
      
      console.log("Signup result:", { user: user?.id, error: signUpError });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        throw signUpError;
      }

      if (!user) {
        throw new Error("No user returned from signup");
      }

      console.log("Signup successful, redirecting to onboarding...");
      router.push("/onboarding");
    } catch (err) {
      console.error("Full signup error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please check the console.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="editorial-container py-section">
          <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary text-2xl">✓</span>
            </div>
            <h1 className="mentor-voice-md text-foreground">Check your email</h1>
            <p className="ui-md text-muted-foreground">
              We sent a confirmation link to <strong>{email}</strong>. 
              Click the link to verify your account and begin your journey.
            </p>
            <Link href="/auth/signin">
              <Button variant="ghost" className="ui-sm">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="editorial-container py-section">
        <div className="max-w-md mx-auto animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="mentor-voice-md text-foreground mb-2">Begin your journey</h1>
            <p className="ui-sm text-muted-foreground">
              Create an account to meet your future self
            </p>
          </div>

          <div className="reflection-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="ui-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="ui-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="ui-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="ui-md"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 ui-md shadow-ambient"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <p className="text-center ui-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}