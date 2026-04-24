import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/services/authService";
import { AlertCircle, Loader2 } from "lucide-react";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("SignIn: Attempting sign in for:", email);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error("Please fill in all fields");
      }

      console.log("SignIn: Calling authService.signIn...");
      const { user, error: signInError } = await authService.signIn(email, password);

      console.log("SignIn: Result:", { userId: user?.id, error: signInError?.message });

      if (signInError) {
        console.error("SignIn: Error details:", signInError);
        throw new Error(signInError.message || "Failed to sign in");
      }

      if (!user) {
        throw new Error("No user returned from sign in");
      }

      console.log("SignIn: Success! Redirecting to chat...");
      router.push("/chat");
    } catch (err) {
      console.error("SignIn: Full error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please check the console.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="editorial-container py-section">
        <div className="max-w-md mx-auto animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="mentor-voice-md text-foreground mb-2">Welcome back</h1>
            <p className="ui-sm text-muted-foreground">
              Continue your conversation with your future self
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
                  placeholder="Your password"
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
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <p className="text-center ui-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}