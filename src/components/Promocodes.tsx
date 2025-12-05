'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Promocode {
  code: string;
  created_at: string;
  used: boolean;
  used_by: number | null;
  used_at: string | null;
  min_messages: number;
  sched_time: string | null;
  assigned: boolean;
  assigned_user: number | null;
  dm_sent: boolean;
}

export default function Promocodes() {
  const [codes, setCodes] = useState<Promocode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [minMessages, setMinMessages] = useState('0');
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/promocodes');
      const data = await response.json();
      if (data.success) {
        setCodes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCode = async () => {
    if (!newCode.trim()) {
      alert('Lütfen bir kod girin!');
      return;
    }

    try {
      const response = await fetch('/api/promocodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          minMessages: parseInt(minMessages) || 0,
          scheduleTime: scheduleTime || null
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Promocod başarıyla eklendi!');
        setNewCode('');
        setMinMessages('0');
        setScheduleTime('');
        fetchCodes();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to add code:', error);
      alert('Kod eklenirken hata oluştu!');
    }
  };

  const handleDeleteCode = async (code: string) => {
    if (!confirm(`"${code}" kodunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/promocodes?code=${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('Promocod silindi!');
        fetchCodes();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to delete code:', error);
      alert('Kod silinirken hata oluştu!');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  const activeCount = codes.filter(c => !c.used).length;
  const usedCount = codes.filter(c => c.used).length;
  const scheduledCount = codes.filter(c => c.sched_time && !c.assigned).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Aktif Kodlar</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Zamanlanmış</p>
                <p className="text-2xl font-bold">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Kullanılan</p>
                <p className="text-2xl font-bold">{usedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Code */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Yeni Promocod Ekle</CardTitle>
          <CardDescription>Tek kod veya zamanlanmış kod ekleyebilirsiniz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promocod</Label>
              <Input
                id="code"
                placeholder="ABC123"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minMessages">Min. Mesaj</Label>
              <Input
                id="minMessages"
                type="number"
                placeholder="0"
                value={minMessages}
                onChange={(e) => setMinMessages(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduleTime">Zamanlama (Opsiyonel)</Label>
              <Input
                id="scheduleTime"
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddCode} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Ekle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Codes List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Tüm Promocodlar ({codes.length})</CardTitle>
          <CardDescription>Eklenen tüm promocodlar ve durumları</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Min. Mesaj</TableHead>
                <TableHead>Zamanlama</TableHead>
                <TableHead>Atanan</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((code) => (
                <TableRow key={code.code}>
                  <TableCell className="font-mono font-bold">{code.code}</TableCell>
                  <TableCell>
                    {code.used ? (
                      <Badge variant="destructive">Kullanıldı</Badge>
                    ) : code.assigned ? (
                      <Badge variant="warning">Atandı</Badge>
                    ) : (
                      <Badge variant="success">Aktif</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{code.min_messages}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {code.sched_time ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        {format(new Date(code.sched_time), 'dd.MM.yyyy HH:mm')}
                      </span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {code.assigned_user ? (
                      <Badge variant="secondary">
                        {code.dm_sent ? '✓ Gönderildi' : '⏳ Bekliyor'}
                      </Badge>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {format(new Date(code.created_at), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCode(code.code)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {codes.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              Henüz promocod eklenmemiş
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
