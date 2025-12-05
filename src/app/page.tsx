'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MessageSquare,
  Gift,
  Trophy,
  UserPlus,
  Activity,
  TrendingUp,
  Settings
} from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import Promocodes from '@/components/Promocodes';
import Randy from '@/components/Randy';
import Invites from '@/components/Invites';
import UserStats from '@/components/UserStats';
import SettingsPage from '@/components/SettingsPage';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                SüperSohbet Admin Panel
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Bot yönetim ve istatistik paneli
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 h-auto p-1 bg-white dark:bg-zinc-800 shadow-lg">
            <TabsTrigger value="dashboard" className="gap-2 py-3">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="promocodes" className="gap-2 py-3">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Promocod</span>
            </TabsTrigger>
            <TabsTrigger value="randy" className="gap-2 py-3">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Randy</span>
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2 py-3">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Davetler</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 py-3">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Kullanıcılar</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 py-3">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ayarlar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="promocodes" className="space-y-6">
            <Promocodes />
          </TabsContent>

          <TabsContent value="randy" className="space-y-6">
            <Randy />
          </TabsContent>

          <TabsContent value="invites" className="space-y-6">
            <Invites />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserStats />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
