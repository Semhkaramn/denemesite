'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Search, Eye, Calendar, Clock, Trophy, Gift, UserPlus } from 'lucide-react';
import { formatTR } from '@/lib/date-utils';

interface User {
  user_id: number;
  username: string | null;
  first_name: string | null;
  message_count: number;
  last_message_at: string;
}

interface UsersData {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

interface UserDetail {
  user_id: number;
  username: string | null;
  first_name: string | null;
  message_count: number;
  last_message_at: string;
  promocodes_won: number;
  randy_won: number;
  invites_made: number;
  invited_by: string | null;
}

export default function UserStats() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [timePeriod, setTimePeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, timePeriod]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/users', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '50');
      url.searchParams.set('period', timePeriod);
      if (debouncedSearch) {
        url.searchParams.set('search', debouncedSearch);
      }

      const response = await fetch(url.toString());
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: number) => {
    try {
      const response = await fetch(`/api/users?userId=${userId}&detailed=true`);
      const result = await response.json();
      if (result.success && result.data) {
        setSelectedUser(result.data);
        setShowUserDetail(true);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  if (loading && !data) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-500">Veriler yüklenemedi</div>;
  }

  const periodLabels = {
    all: 'Tüm Zamanlar',
    today: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay'
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Toplam Kullanıcı ({periodLabels[timePeriod]})</p>
            <p className="text-4xl font-bold">{data.total.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Kullanıcı İstatistikleri</CardTitle>
                <CardDescription>
                  Mesaj aktivitelerine göre sıralanmış kullanıcılar (Sayfa {data.page} / {data.totalPages})
                </CardDescription>
              </div>
              <div className="w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    placeholder="Kullanıcı ara (isim, username, ID)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Time Period Filter */}
            <div className="flex gap-2">
              <Button
                variant={timePeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('all')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Tüm Zamanlar
              </Button>
              <Button
                variant={timePeriod === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('today')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Bugün
              </Button>
              <Button
                variant={timePeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('week')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Bu Hafta
              </Button>
              <Button
                variant={timePeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimePeriod('month')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Bu Ay
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Kullanıcı ID</TableHead>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Mesaj Sayısı</TableHead>
                <TableHead>Son Mesaj</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.map((user, index) => {
                const globalRank = (data.page - 1) * 50 + index + 1;
                return (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">
                      {globalRank === 1 && '🥇'}
                      {globalRank === 2 && '🥈'}
                      {globalRank === 3 && '🥉'}
                      {globalRank > 3 && `${globalRank}.`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.user_id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.first_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {user.username ? (
                        <Badge variant="outline">@{user.username}</Badge>
                      ) : (
                        <Badge variant="secondary">-</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.message_count > 1000 ? 'success' : user.message_count > 500 ? 'warning' : 'secondary'}
                      >
                        {user.message_count.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {formatTR(user.last_message_at, 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUserDetail(user.user_id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {data.users.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Kullanıcı bulunamadı'}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Önceki
            </Button>
            <span className="text-sm text-zinc-500">
              Sayfa {data.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              Sonraki
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={showUserDetail} onOpenChange={setShowUserDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kullanıcı Detayları</DialogTitle>
            <DialogDescription>
              Kullanıcı hakkında detaylı bilgiler
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Temel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Kullanıcı ID:</span>
                    <Badge variant="outline">{selectedUser.user_id}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ad Soyad:</span>
                    <span className="font-medium">{selectedUser.first_name || 'Bilinmiyor'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Username:</span>
                    {selectedUser.username ? (
                      <Badge variant="outline">@{selectedUser.username}</Badge>
                    ) : (
                      <Badge variant="secondary">-</Badge>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Son Mesaj:</span>
                    <span className="text-sm">{formatTR(selectedUser.last_message_at, 'dd.MM.yyyy HH:mm')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-2">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold">{selectedUser.message_count}</p>
                      <p className="text-xs text-zinc-500">Mesaj</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
                        <Gift className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold">{selectedUser.promocodes_won || 0}</p>
                      <p className="text-xs text-zinc-500">Promocod</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-2">
                        <Trophy className="w-6 h-6 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold">{selectedUser.randy_won || 0}</p>
                      <p className="text-xs text-zinc-500">Randy</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-2">
                        <UserPlus className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold">{selectedUser.invites_made || 0}</p>
                      <p className="text-xs text-zinc-500">Davet</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Invite Info */}
              {selectedUser.invited_by && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Davet Bilgisi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-500">Davet Eden:</span>
                      <Badge variant="outline">{selectedUser.invited_by}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
