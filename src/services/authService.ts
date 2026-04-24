import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const authService = {
  async signUp(email: string, password: string) {
    try {
      console.log("AuthService: Starting signup for:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log("AuthService: Signup response:", { 
        userId: data?.user?.id, 
        error: error?.message 
      });

      if (error) {
        console.error("AuthService: Signup error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.error("AuthService: Unexpected error during signup:", err);
      return { 
        user: null, 
        error: err instanceof Error ? err : new Error("Unexpected signup error") 
      };
    }
  },

  async signIn(email: string, password: string) {
    try {
      console.log("AuthService: Starting signin for:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("AuthService: Signin response:", { 
        userId: data?.user?.id, 
        error: error?.message 
      });

      if (error) {
        console.error("AuthService: Signin error details:", {
          message: error.message,
          status: error.status,
          name: error.name
        });
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.error("AuthService: Unexpected error during signin:", err);
      return { 
        user: null, 
        error: err instanceof Error ? err : new Error("Unexpected signin error") 
      };
    }
  },

  async signOut() {
    try {
      console.log("AuthService: Signing out...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("AuthService: Signout error:", error);
        return { error };
      }

      console.log("AuthService: Signout successful");
      return { error: null };
    } catch (err) {
      console.error("AuthService: Unexpected error during signout:", err);
      return { 
        error: err instanceof Error ? err : new Error("Unexpected signout error") 
      };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("AuthService: Get current user error:", error);
        return { user: null, error };
      }

      return { user: session?.user ?? null, error: null };
    } catch (err) {
      console.error("AuthService: Unexpected error getting current user:", err);
      return { 
        user: null, 
        error: err instanceof Error ? err : new Error("Unexpected error") 
      };
    }
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }
};
