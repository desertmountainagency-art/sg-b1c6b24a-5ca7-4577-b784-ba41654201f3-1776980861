import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function TestConnection() {
  const [status, setStatus] = useState<{
    client: boolean | null;
    auth: boolean | null;
    database: boolean | null;
    message: string;
  }>({
    client: null,
    auth: null,
    database: null,
    message: "Testing connection...",
  });
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {
      client: false,
      auth: false,
      database: false,
      message: "",
    };

    try {
      // Test 1: Client initialization
      if (supabase) {
        results.client = true;
        console.log("✅ Supabase client initialized");
      }

      // Test 2: Auth endpoint
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError) {
        results.auth = true;
        console.log("✅ Auth endpoint accessible", { hasSession: !!sessionData.session });
      } else {
        console.error("❌ Auth endpoint error:", sessionError);
        results.message = `Auth Error: ${sessionError.message}`;
      }

      // Test 3: Database connection
      const { data: dbData, error: dbError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);
      
      if (!dbError) {
        results.database = true;
        console.log("✅ Database accessible");
      } else {
        console.error("❌ Database error:", dbError);
        results.message = results.message 
          ? `${results.message} | DB Error: ${dbError.message}`
          : `Database Error: ${dbError.message}`;
      }

      if (results.client && results.auth && results.database) {
        results.message = "All systems operational!";
      }

    } catch (err) {
      console.error("❌ Connection test failed:", err);
      results.message = err instanceof Error ? err.message : "Unknown error";
    }

    setStatus(results);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    if (status) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="mentor-voice-lg mb-8 text-center">Supabase Connection Test</h1>

        <Card className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-outline-variant">
              <StatusIcon status={status.client} />
              <div>
                <p className="ui-sm font-semibold">Client Initialization</p>
                <p className="ui-sm text-muted-foreground">Supabase client created successfully</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border border-outline-variant">
              <StatusIcon status={status.auth} />
              <div>
                <p className="ui-sm font-semibold">Auth Endpoint</p>
                <p className="ui-sm text-muted-foreground">Authentication service accessible</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border border-outline-variant">
              <StatusIcon status={status.database} />
              <div>
                <p className="ui-sm font-semibold">Database Connection</p>
                <p className="ui-sm text-muted-foreground">Database queries working</p>
              </div>
            </div>
          </div>

          {status.message && (
            <Alert variant={status.client && status.auth && status.database ? "default" : "destructive"}>
              <AlertDescription className="ui-sm">{status.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button onClick={runTests} disabled={loading} className="ui-sm">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                "Run Tests Again"
              )}
            </Button>

            <Button variant="outline" onClick={() => window.location.href = "/"} className="ui-sm">
              Back to Home
            </Button>
          </div>

          <div className="pt-4 border-t border-outline-variant">
            <p className="ui-sm text-muted-foreground mb-2">Environment Variables:</p>
            <div className="space-y-1">
              <p className="ui-sm font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing"}
              </p>
              <p className="ui-sm font-mono text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}