'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Eye, Trophy, Users } from 'lucide-react';
import { format } from 'date-fns';

interface RandySchedule {
  id: number;
  winner_count: number;
  distribution_hours: number;
  prize_text: string;
  min_messages: number;
  message_period: string;
  send_announcement: boolean;
  pin_message: boolean;
  one_per_user: boolean;
  created_at: string;
  start_time: string;
  status: string;
  total_slots: number;
  assigned_slots: number;
}

interface RandySlot {
  id: number;
  sched_time: string;
  assigned: boolean;
  assigned_user: number | null;
  assigned_at: string | null;
  dm_sent: boolean;
  group_announced: boolean;
  username: string | null;
  first_name: string | null;
}

export default function Randy() {
  const [schedules, setSchedules] = useState<RandySchedule[]>([]);
  const [slots, setSlots] = useState<RandySlot[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [winnerCount, setWinnerCount] = useState('10');
  const [distributionHours, setDistributionHours] = useState('24');
  const [prizeText, setPrizeText] = useState('');
  const [minMessages, setMinMessages] = useState('0');
  const [startTime, setStartTime] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      fetchSlots(selectedSchedule);
    }
  }, [selectedSchedule]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/randy');
      const data = await response.json();
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (scheduleId: number) => {
    try {
      const response = await fetch(`/api/randy/slots?scheduleId=${scheduleId}`);
      const data = await response.json();
      if (data.success) {
        setSlots(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const handleAddSchedule = async () => {
    if (!winnerCount || !distributionHours || !prizeText || !startTime) {
      alert('Lütfen tüm zorunlu alanları doldurun!');
      return;
    }

    try {
      const response = await fetch('/api/randy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerCount: parseInt(winnerCount),
          distributionHours: parseInt(distributionHours),
          prizeText,
          minMessages: parseInt(minMessages) || 0,
          messagePeriod: 'none',
          sendAnnouncement: true,
          pinMessage: true,
          onePerUser: true,
          startTime
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Randy çekilişi oluşturuldu!');
        setShowAddForm(false);
        resetForm();
        fetchSchedules();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to add schedule:', error);
      alert('Çekiliş oluşturulurken hata oluştu!');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Bu çekilişi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/randy?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        alert('Çekiliş silindi!');
        if (selectedSchedule === id) {
          setSelectedSchedule(null);
          setSlots([]);
        }
        fetchSchedules();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Çekiliş silinirken hata oluştu!');
    }
  };

  const resetForm = () => {
    setWinnerCount('10');
    setDistributionHours('24');
    setPrizeText('');
    setMinMessages('0');
    setStartTime('');
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  const activeSchedules = schedules.filter(s => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Aktif Çekilişler</p>
                <p className="text-2xl font-bold">{activeSchedules}</p>
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Toplam Çekiliş</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Çekiliş
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Yeni Randy Çekilişi</CardTitle>
            <CardDescription>Otomatik ödül dağıtımı için çekiliş oluşturun</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="winnerCount">Kazanan Sayısı</Label>
                <Input
                  id="winnerCount"
                  type="number"
                  value={winnerCount}
                  onChange={(e) => setWinnerCount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distributionHours">Dağıtım Süresi (Saat)</Label>
                <Input
                  id="distributionHours"
                  type="number"
                  value={distributionHours}
                  onChange={(e) => setDistributionHours(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizeText">Ödül Açıklaması</Label>
              <Textarea
                id="prizeText"
                placeholder="Örn: 100 TL Hediye Çeki"
                value={prizeText}
                onChange={(e) => setPrizeText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minMessages">Min. Mesaj Sayısı</Label>
                <Input
                  id="minMessages"
                  type="number"
                  value={minMessages}
                  onChange={(e) => setMinMessages(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Başlangıç Zamanı</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddSchedule}>Oluştur</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>İptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Randy Çekilişleri ({schedules.length})</CardTitle>
          <CardDescription>Tüm çekilişler ve detayları</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ödül</TableHead>
                <TableHead>Kazanan</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İlerleme</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {schedule.prize_text}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{schedule.winner_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{schedule.distribution_hours}h</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={schedule.status === 'active' ? 'success' : 'secondary'}>
                      {schedule.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {schedule.assigned_slots || 0} / {schedule.total_slots || 0}
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${((schedule.assigned_slots || 0) / (schedule.total_slots || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {format(new Date(schedule.start_time), 'dd.MM.yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSchedule(schedule.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {schedules.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              Henüz çekiliş oluşturulmamış
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slots Details */}
      {selectedSchedule && slots.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Çekiliş Slot Detayları</CardTitle>
            <CardDescription>Zamanlama ve atamalar</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Zaman</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kazanan</TableHead>
                  <TableHead>DM</TableHead>
                  <TableHead>Duyuru</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot, index) => (
                  <TableRow key={slot.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(slot.sched_time), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {slot.assigned ? (
                        <Badge variant="success">Atandı</Badge>
                      ) : (
                        <Badge variant="secondary">Bekliyor</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {slot.assigned_user ? (
                        <div>
                          <div className="font-medium">{slot.first_name || 'Unknown'}</div>
                          {slot.username && (
                            <div className="text-xs text-zinc-500">@{slot.username}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {slot.dm_sent ? (
                        <Badge variant="success">✓</Badge>
                      ) : (
                        <Badge variant="secondary">✗</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {slot.group_announced ? (
                        <Badge variant="success">✓</Badge>
                      ) : (
                        <Badge variant="secondary">✗</Badge>
                      )}
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
