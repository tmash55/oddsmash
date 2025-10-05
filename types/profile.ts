export interface Profile {
    id: string
    name?: string
    email: string
    image?: string
    is_early_access?: boolean
    has_access?: boolean
    created_at: string
    updated_at: string
    first_name?: string
    last_name?: string
    phone?: string
  }
  
  export interface UserPreferences {
    favorite_sports?: string[]
    betting_style?: string
    experience_level?: string
    sportsbooks?: string[]
    state_code?: string
    onboarding_completed?: boolean
    preferred_sportsbooks?: string[]
    theme?: string
    notifications_enabled?: boolean
    public_profile?: boolean
  }
  
  export type TabType = "account" | "privacy" | "sportsbooks" | "appearance" | "subscription"
  
  export interface ProfileTabProps {
    profile: Profile | null
    preferences: UserPreferences
    onSaveField: (field: string, value: string) => Promise<void>
    onSavePreference: (key: string, value: any) => Promise<void>
    saving: boolean
    editingField: string | null
    setEditingField: (field: string | null) => void
    tempValues: Record<string, string>
    setTempValues: (values: Record<string, string>) => void
  }
  