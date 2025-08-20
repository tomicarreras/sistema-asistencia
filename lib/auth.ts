import { supabase } from "./supabase/client"

export interface AuthUser {
  id: string
  email: string
  full_name: string
}

// Client-side authentication functions
export const signUp = async (email: string, password: string, fullName: string) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    })

    if (authError) throw authError

    if (authData.user && !authData.user.email_confirmed_at) {
      // For development: manually confirm the user
      const { error: confirmError } = await supabase.auth.admin.updateUserById(authData.user.id, {
        email_confirm: true,
      })
    }

    if (authData.user) {
      // Create teacher record in our custom table
      const { error: teacherError } = await supabase.from("teachers").insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          full_name: fullName,
          password_hash: "managed_by_supabase_auth",
        },
      ])

      if (teacherError) throw teacherError
    }

    return { data: authData, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) return { user: null, error: null }

    // Get teacher details from our custom table
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", user.id)
      .single()

    if (teacherError) throw teacherError

    return {
      user: {
        id: user.id,
        email: user.email!,
        full_name: teacher.full_name,
      } as AuthUser,
      error: null,
    }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}
