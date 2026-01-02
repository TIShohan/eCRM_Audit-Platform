import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
            setProfile(null)
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            return { data, error: null }
        } catch (error) {
            return { data: null, error }
        }
    }

    const signUp = async (email, password, role = 'auditor', dailyLimit = 50, fullName = '', mobileNumber = '') => {
        try {
            // 1. Create a temporary client to sign up the NEW user without logging out the CURRENT user (Admin)
            // We disable session persistence so this client doesn't overwrite localStorage
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
            const { createClient } = await import('@supabase/supabase-js')

            const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            })

            // 2. Sign up the new user using the temp client
            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email,
                password,
            })
            if (authError) throw authError

            // 3. Update the profile using the ADMIN'S existing session (GLOBAL client)
            // The temp client might be logged in as the new user (auditor), who can't set their own role.
            // But 'supabase' (global) is logged in as Admin, so it CAN update the profile.
            if (authData.user) {
                // Wait a moment for the trigger to create the profile row if necessary, 
                // though usually we can UPDATE immediately if the row exists or UPSERT.
                // We'll trust the trigger created it, or we can use upsert to be safe.

                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .update({
                        role,
                        daily_limit: dailyLimit,
                        email,
                        full_name: fullName,
                        mobile_number: mobileNumber
                    })
                    .eq('id', authData.user.id)

                if (profileError) throw profileError
            }

            return { data: authData, error: null }
        } catch (error) {
            return { data: null, error }
        }
    }

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            setUser(null)
            setProfile(null)
            return { error: null }
        } catch (error) {
            return { error }
        }
    }

    const deleteUser = async (userId) => {
        try {
            // SOFT DELETE STRATEGY
            // We cannot hard delete because of foreign key constraints (Completed Audits).
            // Instead, we will:
            // 1. Mark as inactive (locks access)
            // 2. Anonymize the name (visual delete)
            // 3. Scramble the email (frees up the email for re-use if needed, and prevents login matching)

            // 1. Get current details to append [DELETED]
            const { data: current, error: fetchError } = await supabase
                .from('user_profiles')
                .select('full_name, email')
                .eq('id', userId)
                .single()

            if (fetchError) throw fetchError

            // 2. Perform Soft Delete Update
            const timestamp = new Date().getTime()
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    is_active: false,
                    full_name: `[DELETED] ${current.full_name}`,
                    email: `deleted_${timestamp}_${current.email}`,
                    mobile_number: null // Remove personal info
                })
                .eq('id', userId)

            if (error) throw error

            return { error: null }
        } catch (error) {
            console.error('Error deleting user:', error)
            return { error }
        }
    }

    const value = {
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        deleteUser, // EXPORT
        isAdmin: profile?.role === 'admin',
        isAuditor: profile?.role === 'auditor',
        isActive: profile?.is_active !== false,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
