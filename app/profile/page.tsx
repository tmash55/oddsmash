"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/libs/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

// Import our new components
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSidebar } from "@/components/profile/profile-sidebar"
import { AccountTab } from "@/components/profile/account-tab"
import { SportsbooksTab } from "@/components/profile/sportsbooks-tab"

import type { Profile, UserPreferences, TabType } from "@/types/profile"

export default function ProfilePageRefactored() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValues, setTempValues] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<TabType>("account")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Calculate profile completion percentage
  const calculateProfileStrength = () => {
    if (!profile) return 0
    let completed = 0
    const total = 7

    if (profile.email) completed++
    if (profile.name || (profile.first_name && profile.last_name)) completed++
    if (profile.phone) completed++
    if (preferences.state_code) completed++
    if (profile.image) completed++
    if (preferences.preferred_sportsbooks?.length) completed++
    if (preferences.favorite_sports?.length) completed++

    return Math.round((completed / total) * 100)
  }

  // Load profile data
  useEffect(() => {
    if (!user) {
      router.push("/sign-in")
      return
    }

    async function loadProfileData() {
      try {
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError && profileError.code !== "PGRST116") throw profileError

        // Load preferences
        const { data: preferencesData, error: preferencesError } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("id", user.id)
          .single()

        if (preferencesError && preferencesError.code !== "PGRST116") throw preferencesError

        setProfile(
          profileData || {
            id: user.id,
            email: user.email || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        )
        setPreferences(preferencesData || {})
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: "Please refresh the page and try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfileData()
  }, [user, supabase, router, toast])

  // Save field handler
  const handleSaveField = async (field: string, value: string) => {
    setSaving(true)
    try {
      if (["name", "first_name", "last_name", "phone", "image"].includes(field)) {
        const { error } = await supabase.from("profiles").upsert({
          id: user?.id,
          [field]: value,
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
        setProfile((prev) => (prev ? { ...prev, [field]: value } : null))
      } else if (["state_code"].includes(field)) {
        const { error } = await supabase.from("user_preferences").upsert({
          id: user?.id,
          [field]: value,
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
        setPreferences((prev) => ({ ...prev, [field]: value }))
      }

      setEditingField(null)
      setTempValues({})

      toast({
        title: "Profile updated! ✨",
        description: "Your changes have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        variant: "destructive",
        title: "Error saving changes",
        description: "Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  // Save preference handler
  const handleSavePreference = async (key: string, value: any) => {
    setSaving(true)
    try {
      const { error } = await supabase.from("user_preferences").upsert({
        id: user?.id,
        [key]: value,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      setPreferences((prev) => ({ ...prev, [key]: value }))

      toast({
        title: "Settings updated! ⚙️",
        description: "Your preferences have been saved.",
      })
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: "Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )
    }

    const tabProps = {
      profile,
      preferences,
      onSaveField: handleSaveField,
      onSavePreference: handleSavePreference,
      saving,
      editingField,
      setEditingField,
      tempValues,
      setTempValues,
      activeTab,
      setActiveTab,
    }

    switch (activeTab) {
      case "account":
        return <AccountTab {...tabProps} />
      case "sportsbooks":
        return <SportsbooksTab {...tabProps} />
      // Add other tabs here as needed
      default:
        return <AccountTab {...tabProps} />
    }
  }

  // Loading state
  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950 dark:to-gray-900/50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-1/3"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                <div className="lg:col-span-3 h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800/50">
      {/* Mobile Header */}
      <ProfileHeader
        profileStrength={calculateProfileStrength()}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile
      />

      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <ProfileHeader
            profileStrength={calculateProfileStrength()}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar */}
          <ProfileSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* Main Content */}
          <motion.div
            className="lg:col-span-3 mt-6 lg:mt-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            key={activeTab}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
