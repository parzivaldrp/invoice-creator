'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

/**
 * Shape of the row we read from `profiles`. Keep this as a superset of
 * the columns we actually use in the UI — adding a new column to the
 * select() below should be the only change needed when extending it.
 */
export interface Profile {
  full_name?: string;
  subscription_tier?: 'free' | 'pro' | 'business';
  subscription_status?:
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'incomplete'
    | 'incomplete_expired'
    | 'paused'
    | string
    | null;
  current_period_end?: string | null;
  stripe_customer_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  /** True when the user has an active or trialing Pro subscription. */
  isPro: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);


const fetchProfiles = useCallback(async (userId: string) => {
  const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
  if(!error && data){
    setProfile(data as Profile);

  } else{
    setProfile(null);
  }

}, []);

const refreshProfile = useCallback(async () => {
  if (user?.id) {
    await fetchProfiles(user.id);
  }
}, [user, fetchProfiles]);



  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) await fetchProfiles(currentUser.id);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if(currentUser){
        await fetchProfiles(currentUser.id);
      }else{
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null)
    setProfile(null);
  };

  // Derived: is this user currently entitled to Pro features?
  // Trialing counts because we collect a card upfront — if they cancel
  // mid-trial, the customer.subscription.deleted webhook flips this back.
  const isPro = useMemo(() => {
    if (!profile) return false;
    if (profile.subscription_tier !== 'pro' && profile.subscription_tier !== 'business') {
      return false;
    }
    const status = profile.subscription_status;
    return status === 'active' || status === 'trialing';
  }, [profile]);

  const value = {
    user,
    session,
    loading,
    profile,
    isPro,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
