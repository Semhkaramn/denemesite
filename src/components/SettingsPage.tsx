'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Database } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [defaultLink, setDefaultLink] = useState('');
  const [onePerUser, setOnePerUser] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });

      const data = await response.json();
      if (data.success) {
        alert('Ayar kaydedildi!');
        fetchSettings();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to save setting:', error);
      alert('Ayar kaydedilirken hata oluştu!');
    }
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

      {/* Database Info */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Veritabanı Bilgisi</CardTitle>
          <CardDescription>PostgreSQL bağlantı durumu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-medium">Bağlantı Aktif</p>
              <p className="text-sm text-zinc-500">PostgreSQL veritabanına bağlı</p>
            </div>
            <Badge variant="success" className="ml-auto">Çalışıyor</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Ortam Değişkenleri</CardTitle>
          <CardDescription>Aktif ayarlar ve konfigürasyonlar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <span className="text-sm font-medium">DATABASE_URL</span>
              <Badge variant="success">Ayarlı</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <span className="text-sm font-medium">BOT_TOKEN</span>
              <Badge variant="success">Ayarlı</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <span className="text-sm font-medium">ADMIN_PASSWORD</span>
              <Badge variant="success">Ayarlı</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-0 shadow-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Kurulum Talimatları</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900 dark:text-blue-100 space-y-2">
          <p className="text-sm">
            <strong>1.</strong> <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">.env.local</code> dosyasını düzenleyin
          </p>
          <p className="text-sm">
            <strong>2.</strong> <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">DATABASE_URL</code> değişkenini PostgreSQL bağlantı stringi ile değiştirin
          </p>
          <p className="text-sm">
            <strong>3.</strong> Bot tokenınızı <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">BOT_TOKEN</code> değişkenine ekleyin
          </p>
          <p className="text-sm">
            <strong>4.</strong> Geliştirme sunucusunu başlatın: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">bun run dev</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
