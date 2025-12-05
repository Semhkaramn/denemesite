'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
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

export default function UserStats() {
  const [data, setData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
  }, [page, debouncedSearch]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/users', window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '50');
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

  if (loading && !data) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-500">Veriler yüklenemedi</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Toplam Kullanıcı</p>
            <p className="text-4xl font-bold">{data.total.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
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
    </div>
  );
}
