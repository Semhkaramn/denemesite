'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, UserPlus, Users, Link as LinkIcon } from 'lucide-react';
import { formatTR } from '@/lib/date-utils';

interface InviteLink {
  id: number;
  user_id: number;
  username: string | null;
  first_name: string | null;
  invite_link: string;
  created_at: string;
  total_uses: number;
  active_users: number;
  total_invites: number;
  active_invites: number;
}

interface InvitedUser {
  id: number;
  invited_user_id: number;
  invited_username: string | null;
  invited_first_name: string | null;
  inviter_user_id: number;
  invite_link: string;
  joined_at: string;
  is_active: boolean;
  was_member_before: boolean;
  rejoined_count: number;
  left_at: string | null;
  leave_reason: string | null;
}

export default function Invites() {
  const [invites, setInvites] = useState<InviteLink[]>([]);
  const [selectedInvite, setSelectedInvite] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvites();
  }, []);

  useEffect(() => {
    if (selectedInvite) {
      fetchInviteDetails(selectedInvite);
    }
  }, [selectedInvite]);

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/invites');
      const data = await response.json();
      if (data.success) {
        setInvites(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInviteDetails = async (link: string) => {
    try {
      const response = await fetch(`/api/invites/details?link=${encodeURIComponent(link)}`);
      const data = await response.json();
      if (data.success) {
        setInvitedUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invite details:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  const totalInvites = invites.reduce((sum, inv) => sum + (inv.total_invites || 0), 0);
  const totalActive = invites.reduce((sum, inv) => sum + (inv.active_invites || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Toplam Link</p>
                <p className="text-2xl font-bold">{invites.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Toplam Davet</p>
                <p className="text-2xl font-bold">{totalInvites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Aktif Üye</p>
                <p className="text-2xl font-bold">{totalActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Links */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Davet Linkleri ({invites.length})</CardTitle>
          <CardDescription>Kullanıcıların oluşturduğu davet linkleri</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Davet Linki</TableHead>
                <TableHead>Toplam Davet</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">
                    {invite.first_name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {invite.username ? (
                      <Badge variant="outline">@{invite.username}</Badge>
                    ) : (
                      <Badge variant="secondary">-</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs max-w-xs truncate">
                      {invite.invite_link}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{invite.total_invites || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{invite.active_invites || 0}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {formatTR(new Date(invite.created_at))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvite(invite.invite_link)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {invites.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              Henüz davet linki oluşturulmamış
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invited Users Details */}
      {selectedInvite && invitedUsers.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Davet Edilen Kullanıcılar</CardTitle>
            <CardDescription>
              {selectedInvite.split('/').pop()} linki ile gelen üyeler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Katılma Tarihi</TableHead>
                  <TableHead>Tekrar Giriş</TableHead>
                  <TableHead>Ayrılma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.invited_first_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {user.invited_username ? (
                        <Badge variant="outline">@{user.invited_username}</Badge>
                      ) : (
                        <Badge variant="secondary">-</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="success">Aktif</Badge>
                      ) : (
                        <Badge variant="destructive">Ayrıldı</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {formatTR(new Date(user.joined_at))}
                    </TableCell>
                    <TableCell>
                      {user.rejoined_count > 0 ? (
                        <Badge variant="warning">{user.rejoined_count}x</Badge>
                      ) : (
                        <Badge variant="outline">İlk</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {user.left_at ? formatTR(new Date(user.left_at)) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
