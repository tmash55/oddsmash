'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/libs/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Palette,
  Edit2,
  Camera,
  Trophy,
  Star,
  Crown,
  Check,
  X,
  Save,
  Zap,
  CreditCard,
  Bell,
  Lock,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { sportsbooks } from '@/data/sportsbooks';
import { useTheme } from 'next-themes';
import Image from 'next/image';

interface Profile {
  id: string;
  name?: string;
  email: string;
  image?: string;
  is_early_access?: boolean;
  has_access?: boolean;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface UserPreferences {
  favorite_sports?: string[];
  betting_style?: string;
  experience_level?: string;
  sportsbooks?: string[];
  state_code?: string;
  onboarding_completed?: boolean;
  preferred_sportsbooks?: string[];
  theme?: string;
  notifications_enabled?: boolean;
  public_profile?: boolean;
}

type TabType = 'account' | 'privacy' | 'sportsbooks' | 'appearance' | 'subscription';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  // US States for location selection - mapping state codes to full names
  const usStatesMap = {
    'AL': 'Alabama',
    'AK': 'Alaska', 
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
  };

  // Get array of state codes for the select dropdown
  const usStateCodes = Object.keys(usStatesMap);

  const tabs = [
    { id: 'account' as TabType, label: 'Account', icon: User },
    { id: 'privacy' as TabType, label: 'Privacy', icon: Shield },
    { id: 'sportsbooks' as TabType, label: 'Sportsbooks', icon: Zap },
    { id: 'appearance' as TabType, label: 'Appearance', icon: Palette },
    { id: 'subscription' as TabType, label: 'Subscription', icon: CreditCard },
  ];

  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    async function loadProfileData() {
      try {
        console.log('Loading profile data for user:', user.id);
        
        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        // Load preferences
        const { data: preferencesData, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('id', user.id)
          .single();

        if (preferencesError && preferencesError.code !== 'PGRST116') throw preferencesError;

        console.log('Loaded profile data:', profileData);
        console.log('Loaded preferences data:', preferencesData);

        setProfile(profileData || { 
          id: user.id, 
          email: user.email || '', 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setPreferences(preferencesData || {});
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: "Please refresh the page and try again."
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [user, supabase, router, toast]);

  // Calculate profile completion percentage
  const calculateProfileStrength = () => {
    if (!profile) return 0;
    let completed = 0;
    const total = 7;

    if (profile.email) completed++;
    if (profile.name || (profile.first_name && profile.last_name)) completed++;
    if (profile.phone) completed++;
    if (preferences.state_code) completed++;
    if (profile.image) completed++;
    if (preferences.preferred_sportsbooks?.length) completed++;
    if (preferences.favorite_sports?.length) completed++;

    return Math.round((completed / total) * 100);
  };

  // Get navigation for mobile back/forward buttons
  const getTabNavigation = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    const prevTab = currentIndex > 0 ? tabs[currentIndex - 1] : null;
    const nextTab = currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
    return { prevTab, nextTab };
  };

  const handleSaveField = async (field: string, value: string) => {
    setSaving(true);
    try {
      if (['name', 'first_name', 'last_name', 'phone', 'image'].includes(field)) {
        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            id: user?.id, 
            [field]: value,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
        setProfile(prev => prev ? { ...prev, [field]: value } : null);
      } else if (['state_code'].includes(field)) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({ 
            id: user?.id, 
            [field]: value,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
        setPreferences(prev => ({ ...prev, [field]: value }));
      }

      setEditingField(null);
      setTempValues({});
      
      toast({
        title: "Profile updated! ✨",
        description: "Your changes have been saved successfully."
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error saving changes",
        description: "Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreference = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          id: user?.id, 
          [key]: value,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      setPreferences(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Settings updated! ⚙️",
        description: "Your preferences have been saved."
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: "Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.name) {
      const names = profile.name.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase();
    }
    return profile?.email?.[0]?.toUpperCase() || 'U';
  };

  const renderEditableField = (
    field: string, 
    label: string, 
    value: string, 
    icon: React.ReactNode,
    type: 'input' | 'select' = 'input',
    options?: string[]
  ) => {
    // Special handling for state_code field to display full state names
    const isStateField = field === 'state_code';
    const displayValue = isStateField && value ? usStatesMap[value as keyof typeof usStatesMap] || value : value;
    
    return (
      <motion.div
        className={`group space-y-3 p-4 rounded-xl border transition-colors ${
          editingField === field 
            ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-700' 
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer'
        }`}
        whileHover={{ scale: editingField === field ? 1 : 1.01 }}
        whileTap={{ scale: editingField === field ? 1 : 0.98 }}
        onClick={() => {
          if (editingField !== field) {
            setEditingField(field);
            setTempValues({ [field]: value });
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <Label className="text-sm font-medium">{label}</Label>
          </div>
          {editingField === field ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingField(null);
                  setTempValues({});
                }}
                disabled={saving}
                className="h-9 w-9 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveField(field, tempValues[field] || value)}
                disabled={saving || !tempValues[field]}
                className="bg-blue-600 hover:bg-blue-700 h-9"
              >
                {saving ? <Save className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xs hidden sm:inline">Tap to edit</span>
              <Edit2 className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        
        <div onClick={(e) => editingField === field && e.stopPropagation()}>
          {editingField === field ? (
            type === 'select' ? (
              <Select 
                value={tempValues[field] || value} 
                onValueChange={(newValue) => setTempValues({ ...tempValues, [field]: newValue })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {isStateField ? (
                    // Show state codes with full names for state field
                    Object.entries(usStatesMap).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name} ({code})
                      </SelectItem>
                    ))
                  ) : (
                    // Regular options for other fields
                    options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={tempValues[field] || value}
                onChange={(e) => setTempValues({ ...tempValues, [field]: e.target.value })}
                placeholder={`Enter ${label.toLowerCase()}`}
                className="h-12"
                autoFocus
              />
            )
          ) : (
            <p className="text-sm text-muted-foreground ml-7 min-h-[1.25rem]">
              {displayValue || `Add your ${label.toLowerCase()}`}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    const { prevTab, nextTab } = getTabNavigation();

    const mobileNavigation = (
      <div className="lg:hidden flex items-center justify-between gap-3 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => prevTab && setActiveTab(prevTab.id)}
          disabled={!prevTab}
          className="flex items-center gap-2 h-10"
        >
          <ChevronLeft className="w-4 h-4" />
          {prevTab?.label}
        </Button>
        
        <div className="flex items-center gap-1">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`w-2 h-2 rounded-full transition-colors ${
                tab.id === activeTab ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => nextTab && setActiveTab(nextTab.id)}
          disabled={!nextTab}
          className="flex items-center gap-2 h-10"
        >
          {nextTab?.label}
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    );

    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            {mobileNavigation}
            
            {/* Profile Header */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                      <AvatarImage src={profile?.image} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full p-0 bg-green-600 hover:bg-green-700"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold truncate">
                      {profile?.name || (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : 'Your Profile')}
                    </h2>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        {profile?.is_early_access ? 'Early Access' : 'Free Plan'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 px-3" 
                        onClick={() => setActiveTab('subscription')}
                      >
                        {profile?.is_early_access ? 'Manage Plan' : 'Upgrade to Pro'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {renderEditableField(
                  'name',
                  'Display Name',
                  profile?.name || '',
                  <User className="w-4 h-4 text-blue-600" />
                )}
                
                {renderEditableField(
                  'first_name',
                  'First Name',
                  profile?.first_name || '',
                  <User className="w-4 h-4 text-blue-600" />
                )}

                {renderEditableField(
                  'last_name',
                  'Last Name',
                  profile?.last_name || '',
                  <User className="w-4 h-4 text-blue-600" />
                )}

                <motion.div className="space-y-3 p-4 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium">Email Address</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">{profile?.email}</p>
                </motion.div>

                {renderEditableField(
                  'phone',
                  'Phone Number',
                  profile?.phone || '',
                  <Phone className="w-4 h-4 text-blue-600" />
                )}

                {renderEditableField(
                  'state_code',
                  'Location',
                  preferences?.state_code || '',
                  <MapPin className="w-4 h-4 text-blue-600" />,
                  'select',
                  usStateCodes
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            {mobileNavigation}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your information and activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1 mr-4">
                    <Label className="text-sm font-medium">Public Profile</Label>
                    <p className="text-xs text-muted-foreground mt-1">Allow others to see your profile and betting activity</p>
                  </div>
                  <Switch
                    checked={preferences.public_profile || false}
                    onCheckedChange={(checked) => handleSavePreference('public_profile', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <div className="flex-1 mr-4">
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground mt-1">Receive updates about your account and new features</p>
                  </div>
                  <Switch
                    checked={preferences.notifications_enabled !== false}
                    onCheckedChange={(checked) => handleSavePreference('notifications_enabled', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-600" />
                    Account Security
                  </h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full h-12 justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Change Email Address
                    </Button>
                    <Button variant="outline" className="w-full h-12 justify-start">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'sportsbooks':
        return (
          <div className="space-y-6">
            {mobileNavigation}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Preferred Sportsbooks
                </CardTitle>
                <CardDescription>
                  Select your favorite sportsbooks to customize your experience and get the best odds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {sportsbooks.filter(sb => sb.isActive).map((sportsbook) => {
                    const isSelected = preferences.preferred_sportsbooks?.includes(sportsbook.id) || 
                                     preferences.sportsbooks?.includes(sportsbook.id);
                    
                    return (
                      <motion.div
                        key={sportsbook.id}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all min-h-[80px] ${
                          isSelected 
                            ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const currentBooks = preferences.preferred_sportsbooks || [];
                          const newBooks = isSelected
                            ? currentBooks.filter(id => id !== sportsbook.id)
                            : [...currentBooks, sportsbook.id];
                          handleSavePreference('preferred_sportsbooks', newBooks);
                        }}
                      >
                        <div className="flex flex-col items-center gap-2 h-full justify-center">
                          <Image
                            src={sportsbook.logo}
                            alt={sportsbook.name}
                            width={36}
                            height={36}
                            className="object-contain"
                          />
                          <span className="text-xs font-medium text-center leading-tight">{sportsbook.name}</span>
                        </div>
                        {isSelected && (
                          <motion.div
                            className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-600" />
                    Pro Tip
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Select multiple sportsbooks to compare odds and find the best payouts for your bets. OddSmash will highlight the highest odds across your preferred books.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            {mobileNavigation}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-green-600" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize your viewing experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1 mr-4">
                    <Label className="text-sm font-medium">Theme</Label>
                    <p className="text-xs text-muted-foreground mt-1">Choose your preferred color scheme</p>
                  </div>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-32 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            {mobileNavigation}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Subscription Plan
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {profile?.is_early_access ? 'Early Access Plan' : 'Free Plan'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {profile?.is_early_access 
                        ? 'Full access to all OddSmash features' 
                        : 'Limited access to basic features'
                      }
                    </p>
                  </div>
                  <Badge variant={profile?.is_early_access ? "default" : "secondary"}>
                    {profile?.is_early_access ? 'Active' : 'Free'}
                  </Badge>
                </div>

                {!profile?.is_early_access && (
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl">
                    <h3 className="font-medium mb-2">Upgrade to Pro</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Unlock unlimited betslip scans, advanced analytics, and priority support
                    </p>
                    <Button className="bg-green-600 hover:bg-green-700 h-12 w-full sm:w-auto">
                      Upgrade Now
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-medium">Usage This Month</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-xl">
                      <p className="text-2xl font-bold text-green-600">0</p>
                      <p className="text-xs text-muted-foreground mt-1">Betslips Scanned</p>
                    </div>
                    <div className="text-center p-4 border rounded-xl">
                      <p className="text-2xl font-bold text-green-600">0</p>
                      <p className="text-xs text-muted-foreground mt-1">Props Analyzed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-white dark:bg-gray-900 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="h-9 w-9 p-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
          
          {/* Mobile Profile Strength - Subtle */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="w-4 h-4" />
            <span>{calculateProfileStrength()}%</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Desktop Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8 text-green-600" />
              Account Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and collaborate on your account settings
            </p>
          </div>
          
          {/* Desktop Profile Strength - Subtle */}
          <motion.div
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-lg border"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Profile {calculateProfileStrength()}%</span>
            </div>
            <Progress 
              value={calculateProfileStrength()} 
              className="h-1.5 bg-gray-200 dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Complete to unlock features
            </p>
          </motion.div>
        </motion.div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Mobile Sidebar Overlay */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="lg:hidden fixed inset-0 bg-black/50 z-40"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  className="lg:hidden fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 z-50 border-r"
                >
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">Settings</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(false)}
                        className="h-9 w-9 p-0"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <motion.div
                          key={tab.id}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                          whileHover={{ x: activeTab === tab.id ? 0 : 4 }}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setSidebarOpen(false);
                          }}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{tab.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Desktop Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden lg:block"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Personal Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.div
                      key={tab.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                      whileHover={{ x: activeTab === tab.id ? 0 : 4 }}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>

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
  );
} 