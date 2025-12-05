'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

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

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users?page=${page}&limit=50`);
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
          <CardTitle>Kullanıcı İstatistikleri</CardTitle>
          <CardDescription>
            Mesaj aktivitelerine göre sıralanmış kullanıcılar (Sayfa {data.page} / {data.totalPages})
          </CardDescription>
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
                      {format(new Date(user.last_message_at), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
