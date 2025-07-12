"use client"

import { Camera, User, Mail, Phone, MapPin, Crown } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileNavigation } from "./profile-navigation"

import type { ProfileTabProps, TabType } from "@/types/profile"
import { EditableField } from "./editable-field"

// US States mapping
const usStatesMap = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
}

interface AccountTabProps extends ProfileTabProps {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

export function AccountTab({
  profile,
  preferences,
  onSaveField,
  saving,
  editingField,
  setEditingField,
  tempValues,
  setTempValues,
  activeTab,
  setActiveTab,
}: AccountTabProps) {
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    if (profile?.name) {
      const names = profile.name.split(" ")
      return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase()
    }
    return profile?.email?.[0]?.toUpperCase() || "U"
  }

  return (
    <div className="space-y-6">
      <ProfileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Enhanced Profile Header */}
      <Card className="overflow-hidden border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-2xl">
                <AvatarImage src={profile?.image || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full p-0 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {profile?.name ||
                  (profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : "Your Profile")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{profile?.email}</p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg">
                  <Crown className="w-3 h-3 mr-1" />
                  {profile?.is_early_access ? "Early Access" : "Free Plan"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 hover:bg-white dark:hover:bg-gray-800"
                  onClick={() => setActiveTab("subscription")}
                >
                  {profile?.is_early_access ? "Manage Plan" : "Upgrade to Pro"}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-6">
          <EditableField
            field="name"
            label="Display Name"
            value={profile?.name || ""}
            icon={<User className="w-4 h-4 text-white" />}
            placeholder="Enter your display name"
            editingField={editingField}
            setEditingField={setEditingField}
            tempValues={tempValues}
            setTempValues={setTempValues}
            onSave={onSaveField}
            saving={saving}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField
              field="first_name"
              label="First Name"
              value={profile?.first_name || ""}
              icon={<User className="w-4 h-4 text-white" />}
              placeholder="Enter your first name"
              editingField={editingField}
              setEditingField={setEditingField}
              tempValues={tempValues}
              setTempValues={setTempValues}
              onSave={onSaveField}
              saving={saving}
            />

            <EditableField
              field="last_name"
              label="Last Name"
              value={profile?.last_name || ""}
              icon={<User className="w-4 h-4 text-white" />}
              placeholder="Enter your last name"
              editingField={editingField}
              setEditingField={setEditingField}
              tempValues={tempValues}
              setTempValues={setTempValues}
              onSave={onSaveField}
              saving={saving}
            />
          </div>

          {/* Email - Read Only */}
          <div className="p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">Email Address</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">This cannot be changed</p>
              </div>
            </div>
            <div className="ml-14">
              <p className="text-gray-900 dark:text-white font-medium">{profile?.email}</p>
            </div>
          </div>

          <EditableField
            field="phone"
            label="Phone Number"
            value={profile?.phone || ""}
            icon={<Phone className="w-4 h-4 text-white" />}
            placeholder="Enter your phone number"
            editingField={editingField}
            setEditingField={setEditingField}
            tempValues={tempValues}
            setTempValues={setTempValues}
            onSave={onSaveField}
            saving={saving}
          />

          <EditableField
            field="state_code"
            label="Location"
            value={preferences?.state_code || ""}
            icon={<MapPin className="w-4 h-4 text-white" />}
            type="select"
            options={usStatesMap}
            placeholder="Select your state"
            editingField={editingField}
            setEditingField={setEditingField}
            tempValues={tempValues}
            setTempValues={setTempValues}
            onSave={onSaveField}
            saving={saving}
          />
        </CardContent>
      </Card>
    </div>
  )
}
