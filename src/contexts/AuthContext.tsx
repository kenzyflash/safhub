
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AUTH_TIMEOUT = 15000; // 15 seconds timeout for auth operations
const ROLE_FETCH_TIMEOUT = 10000; // 10 seconds timeout for role fetching

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();
  
  const roleUpdateInProgress = useRef(false);
  const cleanupFunctions = useRef<(() => void)[]>([]);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupAuthState = useCallback(() => {
    localStorage.removeItem('supabase.auth.token');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  const getDashboardPath = useCallback((role: string) => {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'teacher':
        return '/teacher-dashboard';
      case 'parent':
        return '/parent-dashboard';
      case 'student':
      default:
        return '/student-dashboard';
    }
  }, []);

  const fetchUserRole = useCallback(async (userId: string): Promise<string> => {
    if (roleUpdateInProgress.current) {
      console.log('Role update already in progress, returning cached role');
      return userRole || 'student';
    }

    try {
      roleUpdateInProgress.current = true;
      console.log('Fetching role for user:', userId);
      
      // Add timeout for role fetching
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Role fetch timeout')), ROLE_FETCH_TIMEOUT);
      });

      const rolePromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([rolePromise, timeoutPromise]);

      if (error) {
        console.error('Error fetching user role:', error);
        console.warn('Role fetch failed, defaulting to student for security');
        setUserRole('student');
        return 'student';
      }

      const role = data?.role || 'student';
      console.log('User role fetched successfully:', role);
      setUserRole(role);
      return role;
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      setUserRole('student');
      return 'student';
    } finally {
      roleUpdateInProgress.current = false;
    }
  }, [userRole]);

  const handleRedirection = useCallback((role: string) => {
    const currentPath = window.location.pathname;
    const targetPath = getDashboardPath(role);
    
    console.log('Current path:', currentPath, 'Target path:', targetPath, 'Role:', role);
    
    if (currentPath !== targetPath) {
      if (currentPath === '/') {
        console.log('Redirecting from home to dashboard');
        setTimeout(() => {
          window.location.href = targetPath;
        }, 100);
        return;
      }
      
      if (currentPath.includes('-dashboard')) {
        console.log('Redirecting to correct dashboard');
        setTimeout(() => {
          window.location.href = targetPath;
        }, 100);
        return;
      }
    }
  }, [getDashboardPath]);

  const cleanupSubscriptions = useCallback(() => {
    console.log('Cleaning up subscriptions...');
    cleanupFunctions.current.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    cleanupFunctions.current = [];
    
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
  }, []);

  const setupRealtimeListeners = useCallback((userId: string) => {
    console.log('Setting up secure realtime listeners for user:', userId);

    cleanupSubscriptions();

    // Simplified realtime setup with better error handling
    const roleChangesChannel = supabase
      .channel(`user-role-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Role change detected:', payload);
          
          if (payload.new && typeof payload.new === 'object' && 'user_id' in payload.new) {
            if (payload.new.user_id !== userId) {
              console.warn('Received role change for different user, ignoring');
              return;
            }
          }
          
          // Debounce role refresh
          setTimeout(async () => {
            try {
              const newRole = await fetchUserRole(userId);
              
              toast({
                title: "Role Updated",
                description: `Your role has been updated to ${newRole}. Redirecting...`,
              });
              
              setTimeout(() => {
                handleRedirection(newRole);
              }, 2000);
            } catch (error) {
              console.error('Error handling role change:', error);
            }
          }, 1000);
        }
      )
      .subscribe();

    // Simplified notifications channel
    const notificationsChannel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Notification received:', payload);
          
          const notification = payload.new;
          if (notification && notification.type === 'general') {
            toast({
              title: notification.title,
              description: notification.message,
            });
          }
        }
      )
      .subscribe();

    cleanupFunctions.current = [
      () => supabase.removeChannel(roleChangesChannel),
      () => supabase.removeChannel(notificationsChannel)
    ];

    return cleanupSubscriptions;
  }, [fetchUserRole, handleRedirection, toast, cleanupSubscriptions]);

  const refreshUserRole = useCallback(async () => {
    if (user && !roleUpdateInProgress.current) {
      console.log('Refreshing user role for:', user.id);
      const role = await fetchUserRole(user.id);
      const currentPath = window.location.pathname;
      if (currentPath === '/' || (currentPath.includes('-dashboard') && currentPath !== getDashboardPath(role))) {
        handleRedirection(role);
      }
    }
  }, [user, fetchUserRole, getDashboardPath, handleRedirection]);

  // Initialize authentication state with timeout
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing secure auth...');
        
        // Set auth timeout
        authTimeoutRef.current = setTimeout(() => {
          if (mounted && loading) {
            console.log('Auth initialization timeout');
            setLoading(false);
            setInitialized(true);
          }
        }, AUTH_TIMEOUT);

        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (currentSession?.user && mounted) {
          console.log('Found existing session for:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch role with timeout
          try {
            await fetchUserRole(currentSession.user.id);
            setupRealtimeListeners(currentSession.user.id);
          } catch (error) {
            console.error('Error setting up user data:', error);
          }
        }
        
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        cleanupSubscriptions();

        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && initialized) {
          // Use setTimeout to defer Supabase calls
          setTimeout(async () => {
            try {
              const role = await fetchUserRole(session.user.id);
              setupRealtimeListeners(session.user.id);
              if (event === 'SIGNED_IN') {
                handleRedirection(role);
              }
            } catch (error) {
              console.error('Error in auth state change handler:', error);
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      cleanupSubscriptions();
    };
  }, [initialized, fetchUserRole, setupRealtimeListeners, handleRedirection, cleanupSubscriptions]);

  const validateInput = (input: string, type: 'email' | 'name' | 'text'): string => {
    if (!input || typeof input !== 'string') {
      throw new Error('Invalid input provided');
    }

    const sanitized = input.trim().slice(0, 255);

    switch (type) {
      case 'email':
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(sanitized)) {
          throw new Error('Invalid email format');
        }
        break;
      case 'name':
        const nameRegex = /^[A-Za-z\s'-]{1,50}$/;
        if (!nameRegex.test(sanitized)) {
          throw new Error('Name contains invalid characters');
        }
        break;
      case 'text':
        if (/<script|javascript:|data:|vbscript:/i.test(sanitized)) {
          throw new Error('Invalid characters detected');
        }
        break;
    }

    return sanitized;
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      cleanupAuthState();

      const cleanEmail = validateInput(email, 'email').toLowerCase();
      const cleanFirstName = validateInput(userData.first_name, 'name');
      const cleanLastName = validateInput(userData.last_name, 'name');
      const cleanSchool = userData.school ? validateInput(userData.school, 'text') : '';
      const cleanGrade = userData.grade ? validateInput(userData.grade, 'text') : '';

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            first_name: cleanFirstName,
            last_name: cleanLastName,
            school: cleanSchool,
            grade: cleanGrade,
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      let errorMessage = error.message;
      if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please try signing in instead.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (error.message?.includes('Email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      cleanupAuthState();
      
      const cleanEmail = validateInput(email, 'email').toLowerCase();
      
      if (!password?.trim()) {
        throw new Error('Password is required');
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      let errorMessage = error.message;
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
      }
      
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting secure sign out...');
      
      cleanupSubscriptions();
      setUserRole(null);
      setUser(null);
      setSession(null);
      
      cleanupAuthState();
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error && 
          !error.message.includes('session_not_found') && 
          !error.message.includes('Auth session missing')) {
        throw error;
      }

      toast({
        title: "Signed out",
        description: "You have been logged out successfully.",
      });
      
      window.location.href = "/";
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      cleanupSubscriptions();
      setUserRole(null);
      setUser(null);
      setSession(null);
      cleanupAuthState();
      
      toast({
        title: "Signed out",
        description: "You have been logged out.",
      });
      
      window.location.href = "/";
    }
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
