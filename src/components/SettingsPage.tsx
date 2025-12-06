'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Settings, Save, Database, Trash2, AlertTriangle, MessageSquare, Gift, Trophy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [defaultLink, setDefaultLink] = useState('');
  const [onePerUser, setOnePerUser] = useState(true);
  const [showFirstResetConfirm, setShowFirstResetConfirm] = useState(false);
  const [showSecondResetConfirm, setShowSecondResetConfirm] = useState(false);

  // Message templates
  const [promocodeDmTemplate, setPromocodeDmTemplate] = useState('');
  const [promocodeGroupTemplate, setPromocodeGroupTemplate] = useState('');
  const [randyDmTemplate, setRandyDmTemplate] = useState('');
  const [randyGroupTemplate, setRandyGroupTemplate] = useState('');

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

        // Load message templates
        setPromocodeDmTemplate(data.data.promocod_dm_template || '🎁 **Tebrikler! Kodunuz:**\n\n`{cod}`\n\n{link}');
        setPromocodeGroupTemplate(data.data.promocod_group_template || '🎉 Tebrikler {mention}! Tekli Promokod Kazandınız!\n\nKodunuz özel mesaj yoluyla gönderildi.');
        setRandyDmTemplate(data.data.randy_dm_template || '🏆 **Tebrikler {username}!**\n\nRandy çekilişinde kazandınız!\n\n**Ödülünüz:** {prize}\n\n{link}');
        setRandyGroupTemplate(data.data.randy_group_template || '🎊 Tebrikler {mention}!\n\nRandy çekilişinde kazandınız!\n**Ödül:** {prize}');
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


      {/* Message Templates - Promocode */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <CardTitle>Promocode Mesaj Taslakları</CardTitle>
          </div>
          <CardDescription>Kullanıcıya ve gruba gönderilecek mesajları özelleştirin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Promocode DM Template */}
          <div className="space-y-2">
            <Label htmlFor="promocodeDm">Özel Mesaj (DM) Taslağı</Label>
            <Textarea
              id="promocodeDm"
              value={promocodeDmTemplate}
              onChange={(e) => setPromocodeDmTemplate(e.target.value)}
              placeholder="Kullanıcıya özel mesajla gönderilecek mesaj"
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-zinc-500">
              Kullanılabilir değişkenler: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{cod}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{link}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{username}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{mention}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{first_name}'}</code>
            </p>
            <Button onClick={() => handleSaveSetting('promocod_dm_template', promocodeDmTemplate)} size="sm">
              <Save className="w-3 h-3 mr-2" />
              Kaydet
            </Button>
          </div>

          {/* Promocode Group Template */}
          <div className="space-y-2">
            <Label htmlFor="promocodeGroup">Grup Duyuru Taslağı</Label>
            <Textarea
              id="promocodeGroup"
              value={promocodeGroupTemplate}
              onChange={(e) => setPromocodeGroupTemplate(e.target.value)}
              placeholder="Gruba gönderilecek duyuru mesajı"
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-zinc-500">
              Kullanılabilir değişkenler: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{username}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{mention}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{first_name}'}</code>
            </p>
            <Button onClick={() => handleSaveSetting('promocod_group_template', promocodeGroupTemplate)} size="sm">
              <Save className="w-3 h-3 mr-2" />
              Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message Templates - Randy */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            <CardTitle>Randy Mesaj Taslakları</CardTitle>
          </div>
          <CardDescription>Kazananlara gönderilecek mesajları özelleştirin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Randy DM Template */}
          <div className="space-y-2">
            <Label htmlFor="randyDm">Özel Mesaj (DM) Taslağı</Label>
            <Textarea
              id="randyDm"
              value={randyDmTemplate}
              onChange={(e) => setRandyDmTemplate(e.target.value)}
              placeholder="Kazanana özel mesajla gönderilecek mesaj"
              rows={5}
              className="font-mono text-sm"
            />
            <p className="text-xs text-zinc-500">
              Kullanılabilir değişkenler: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{prize}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{link}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{username}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{mention}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{first_name}'}</code>
            </p>
            <Button onClick={() => handleSaveSetting('randy_dm_template', randyDmTemplate)} size="sm">
              <Save className="w-3 h-3 mr-2" />
              Kaydet
            </Button>
          </div>

          {/* Randy Group Template */}
          <div className="space-y-2">
            <Label htmlFor="randyGroup">Grup Duyuru Taslağı</Label>
            <Textarea
              id="randyGroup"
              value={randyGroupTemplate}
              onChange={(e) => setRandyGroupTemplate(e.target.value)}
              placeholder="Gruba gönderilecek duyuru mesajı"
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-zinc-500">
              Kullanılabilir değişkenler: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{prize}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{username}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{mention}'}</code>, <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">{'{first_name}'}</code>
            </p>
            <Button onClick={() => handleSaveSetting('randy_group_template', randyGroupTemplate)} size="sm">
              <Save className="w-3 h-3 mr-2" />
              Kaydet
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

