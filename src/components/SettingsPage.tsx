'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Settings, Save, Database, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [defaultLink, setDefaultLink] = useState('');
  const [onePerUser, setOnePerUser] = useState(true);
  const [showFirstResetConfirm, setShowFirstResetConfirm] = useState(false);
  const [showSecondResetConfirm, setShowSecondResetConfirm] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setDefaultLink(data.data.default_link || '');
        setOnePerUser(data.data.promocod_one_per_user !== false);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    const savePromise = fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    }).then(async (response) => {
      const data = await response.json();
      if (data.success) {
        fetchSettings();
        return data;
      }
      throw new Error(data.error || 'Kaydetme başarısız');
    });

    toast.promise(savePromise, {
      loading: 'Kaydediliyor...',
      success: 'Ayar başarıyla kaydedildi!',
      error: (err) => `Hata: ${err.message}`,
    });
  };

  const handleFirstConfirmReset = () => {
    setShowFirstResetConfirm(false);
    setShowSecondResetConfirm(true);
  };

  const handleDatabaseReset = async () => {
    const resetPromise = fetch('/api/database/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(async (response) => {
      const data = await response.json();
      if (data.success) {
        fetchSettings();
        return data;
      }
      throw new Error(data.error || 'Sıfırlama başarısız');
    });

    toast.promise(resetPromise, {
      loading: 'TÜM VERİTABANI SİLİNİYOR...',
      success: 'Veritabanı başarıyla sıfırlandı!',
      error: (err) => `Hata: ${err.message}`,
    });
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-600 flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Bot Ayarları</h2>
              <p className="text-sm text-zinc-500">Genel konfigürasyon ve ayarlar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Link Setting */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Varsayılan Link</CardTitle>
          <CardDescription>Promocod mesajlarında kullanılacak varsayılan link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultLink">Link URL</Label>
            <Input
              id="defaultLink"
              type="url"
              value={defaultLink}
              onChange={(e) => setDefaultLink(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <Button onClick={() => handleSaveSetting('default_link', defaultLink)}>
            <Save className="w-4 h-4 mr-2" />
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* Promocod Settings */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Promocod Ayarları</CardTitle>
          <CardDescription>Promocod sisteminin çalışma şekli</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Kişi Başı Bir Kod</p>
              <p className="text-sm text-zinc-500">
                Her kullanıcı sadece bir kez kod alabilir
              </p>
            </div>
            <Button
              variant={onePerUser ? 'default' : 'outline'}
              onClick={() => {
                const newValue = !onePerUser;
                setOnePerUser(newValue);
                handleSaveSetting('promocod_one_per_user', String(newValue));
              }}
            >
              {onePerUser ? 'Aktif' : 'Pasif'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DANGER ZONE - Database Reset */}
      <Card className="border-0 shadow-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <CardTitle className="text-red-600">TEHLİKE BÖLGESİ</CardTitle>
          </div>
          <CardDescription className="text-red-700 dark:text-red-400">
            Bu işlemler geri alınamaz! Dikkatli olun!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white dark:bg-zinc-900 rounded-lg border-2 border-red-300 dark:border-red-800">
            <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Tüm Veritabanını Sıfırla
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
              Bu işlem aşağıdaki tüm verileri kalıcı olarak silecektir:
            </p>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 mb-4 ml-4">
              <li>• Tüm kullanıcı mesaj istatistikleri</li>
              <li>• Tüm promocodlar ve zamanlamalar</li>
              <li>• Tüm davet linkleri ve davetliler</li>
              <li>• Tüm Randy çekilişleri ve kazananlar</li>
              <li>• Tüm sistem ayarları</li>
            </ul>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 p-3 rounded-lg mb-4">
              <p className="text-sm text-yellow-900 dark:text-yellow-200 font-medium">
                ⚠️ BU İŞLEM GERİ ALINAMAZ! İki kez onay vermeniz gerekecektir.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowFirstResetConfirm(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Tüm Veritabanını Sil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showFirstResetConfirm}
        onOpenChange={setShowFirstResetConfirm}
        onConfirm={handleFirstConfirmReset}
        title="⚠️ BİRİNCİ ONAY"
        description="TÜM VERİTABANINI SİLMEK ÜZERE OLDUĞUNUZDAN EMİN MİSİNİZ?"
        confirmText="Evet, Devam Et"
        cancelText="İptal"
        variant="destructive"
      />

      <ConfirmDialog
        open={showSecondResetConfirm}
        onOpenChange={setShowSecondResetConfirm}
        onConfirm={handleDatabaseReset}
        title="🚨 İKİNCİ VE SON ONAY"
        description="BU SON UYARIDIR! VERİTABANI ŞİMDİ SİLİNECEK! Emin misiniz?"
        confirmText="EVET, TÜM VERİTABANINI SİL"
        cancelText="HAYIR, İPTAL ET"
        variant="destructive"
      />
    </div>
  );
}

