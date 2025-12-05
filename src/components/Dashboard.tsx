'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, MessageSquare, Gift, Trophy, UserPlus, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatTR } from '@/lib/date-utils';

interface TopUser {
  user_id: number;
  username: string | null;
  first_name: string | null;
  message_count: number;
  last_message_at: string;
}

interface MessagePerDay {
  date: string;
  count: number;
}

interface DashboardStats {
  totalUsers: number;
  totalMessages: number;
  activeCodes: number;
  usedCodes: number;
  activeRandy: number;
  totalInvites: number;
  activeInvites: number;
  topUsers: TopUser[];
  messagesPerDay: MessagePerDay[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-red-500">Veriler yüklenemedi</div>;
  }

  const statCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      description: 'Aktif üye sayısı'
    },
    {
      title: 'Toplam Mesaj',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'from-green-500 to-green-600',
      description: 'Gönderilen mesaj'
    },
    {
      title: 'Promocod',
      value: `${stats.activeCodes} / ${stats.usedCodes}`,
      icon: Gift,
      color: 'from-purple-500 to-purple-600',
      description: 'Aktif / Kullanılan'
    },
    {
      title: 'Randy Çekilişleri',
      value: stats.activeRandy,
      icon: Trophy,
      color: 'from-yellow-500 to-yellow-600',
      description: 'Aktif çekiliş'
    },
    {
      title: 'Davet Sistemi',
      value: `${stats.activeInvites} / ${stats.totalInvites}`,
      icon: UserPlus,
      color: 'from-orange-500 to-orange-600',
      description: 'Aktif / Toplam'
    },
    {
      title: 'Aktivite',
      value: stats.topUsers.length,
      icon: Activity,
      color: 'from-red-500 to-red-600',
      description: 'Aktif kullanıcı'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow border-0">
            <CardHeader className={`bg-gradient-to-r ${stat.color} text-white pb-3`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">{stat.title}</CardTitle>
                <stat.icon className="w-5 h-5 opacity-80" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Users */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>En Aktif Kullanıcılar</CardTitle>
          <CardDescription>Mesaj sayısına göre sıralama</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Mesaj Sayısı</TableHead>
                <TableHead>Son Mesaj</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topUsers.map((user, index) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}.`}
                  </TableCell>
                  <TableCell>{user.first_name || 'Unknown'}</TableCell>
                  <TableCell>
                    {user.username ? (
                      <Badge variant="outline">@{user.username}</Badge>
                    ) : (
                      <Badge variant="secondary">-</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.message_count.toLocaleString()}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {user.last_message_at ? formatTR(new Date(user.last_message_at), 'dd.MM.yyyy HH:mm') : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Messages Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Günlük Mesaj İstatistikleri</CardTitle>
          <CardDescription>Son 7 günlük aktivite</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.messagesPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatTR(new Date(value), 'dd.MM')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => formatTR(new Date(value), 'dd MMMM yyyy')}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
