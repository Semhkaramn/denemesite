'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Clock, CheckCircle, XCircle, Upload, Calendar, Trash, Settings } from 'lucide-react';
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
  const [bulkCodes, setBulkCodes] = useState('');
  const [planHours, setPlanHours] = useState('24');
  const [onePerUser, setOnePerUser] = useState(true);
  const [sendAnnouncement, setSendAnnouncement] = useState(true);
  const [pinMessage, setPinMessage] = useState(true);
  const [defaultLink, setDefaultLink] = useState('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  useEffect(() => {
    fetchCodes();
    fetchSettings();
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

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setDefaultLink(data.data.default_link || '');
        setOnePerUser(data.data.one_per_user !== false);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleBulkUpload = async () => {
    const codesArray = bulkCodes.split('\n').map(c => c.trim()).filter(c => c.length > 0);

    if (codesArray.length === 0) {
      alert('Lütfen en az bir kod girin!');
      return;
    }

    try {
      const response = await fetch('/api/promocodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: codesArray })
      });

      const data = await response.json();
      if (data.success) {
        alert(`${codesArray.length} kod başarıyla yüklendi!`);
        setBulkCodes('');
        setShowBulkDialog(false);
        fetchCodes();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to upload codes:', error);
      alert('Kodlar yüklenirken hata oluştu!');
    }
  };

  const handleCreatePlan = async () => {
    const unusedCodes = codes.filter(c => !c.used && !c.assigned);

    if (unusedCodes.length === 0) {
      alert('Planlamak için kullanılmamış kod bulunmuyor!');
      return;
    }

    if (!confirm(`${unusedCodes.length} kod için ${planHours} saatlik dağıtım planı oluşturulsun mu?`)) {
      return;
    }

    try {
      const response = await fetch('/api/promocodes/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: parseInt(planHours),
          onePerUser,
          sendAnnouncement,
          pinMessage
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Dağıtım planı oluşturuldu!');
        setShowPlanDialog(false);
        fetchCodes();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to create plan:', error);
      alert('Plan oluşturulurken hata oluştu!');
    }
  };

  const handleReset = async () => {
    if (!confirm('TÜM KODLARI VE PLANI SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?\n\nBu işlem geri alınamaz!')) {
      return;
    }

    try {
      const response = await fetch('/api/promocodes/reset', {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        alert('Tüm kodlar ve plan silindi!');
        fetchCodes();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to reset:', error);
      alert('Reset işlemi başarısız!');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_link: defaultLink,
          one_per_user: onePerUser
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Ayarlar kaydedildi!');
        setShowSettingsDialog(false);
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Ayarlar kaydedilemedi!');
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Toplu Kod Yükle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Toplu Kod Yükleme</DialogTitle>
              <DialogDescription>
                Her satıra bir kod yazın. Boş satırlar atlanacaktır.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="ABC123&#10;DEF456&#10;GHI789"
                value={bulkCodes}
                onChange={(e) => setBulkCodes(e.target.value)}
                rows={10}
                className="font-mono"
              />
              <div className="text-sm text-zinc-500">
                {bulkCodes.split('\n').filter(c => c.trim()).length} kod girildi
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleBulkUpload}>Yükle</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Calendar className="w-4 h-4 mr-2" />
              Plan Oluştur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dağıtım Planı Oluştur</DialogTitle>
              <DialogDescription>
                Kullanılmamış kodlar için rastgele zaman dağıtımı oluşturun
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planHours">Dağıtım Süresi (Saat)</Label>
                <Input
                  id="planHours"
                  type="number"
                  value={planHours}
                  onChange={(e) => setPlanHours(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="onePerUser">Kullanıcı Başına 1 Kod</Label>
                <Switch
                  id="onePerUser"
                  checked={onePerUser}
                  onCheckedChange={setOnePerUser}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sendAnnouncement">Gruba Duyuru Gönder</Label>
                <Switch
                  id="sendAnnouncement"
                  checked={sendAnnouncement}
                  onCheckedChange={setSendAnnouncement}
                />
              </div>
              {sendAnnouncement && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="pinMessage">Mesajı Sabitle</Label>
                  <Switch
                    id="pinMessage"
                    checked={pinMessage}
                    onCheckedChange={setPinMessage}
                  />
                </div>
              )}
              <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Özet:</p>
                <p>• Kod Sayısı: {codes.filter(c => !c.used && !c.assigned).length}</p>
                <p>• Süre: {planHours} saat</p>
                <p>• Her kullanıcı: {onePerUser ? '1 kod' : 'Sınırsız'}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleCreatePlan}>Oluştur</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Ayarlar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promocod Ayarları</DialogTitle>
              <DialogDescription>
                Genel promocod ayarları
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultLink">Varsayılan Link</Label>
                <Input
                  id="defaultLink"
                  type="url"
                  placeholder="https://example.com"
                  value={defaultLink}
                  onChange={(e) => setDefaultLink(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="onePerUserSetting">Kullanıcı Başına 1 Kod</Label>
                  <p className="text-sm text-zinc-500">Her kullanıcı sadece bir kez kod alabilir</p>
                </div>
                <Switch
                  id="onePerUserSetting"
                  checked={onePerUser}
                  onCheckedChange={setOnePerUser}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleSaveSettings}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button variant="destructive" onClick={handleReset}>
          <Trash className="w-4 h-4 mr-2" />
          Tümünü Sıfırla
        </Button>
      </div>

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
                <TableHead>Zamanlama</TableHead>
                <TableHead>Atanan</TableHead>
                <TableHead>Kullanılan</TableHead>
                <TableHead>Oluşturulma</TableHead>
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
                      <Badge className="bg-yellow-500">Atandı</Badge>
                    ) : (
                      <Badge className="bg-green-600">Aktif</Badge>
                    )}
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
                    {code.used_at ? format(new Date(code.used_at), 'dd.MM.yyyy HH:mm') : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {format(new Date(code.created_at), 'dd.MM.yyyy')}
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
