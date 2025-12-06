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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Send, Users, Image, Link2, Square, Code, UserCheck, Search, X, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatTR } from '@/lib/date-utils';

interface User {
  user_id: number;
  username: string | null;
  first_name: string | null;
  message_count: number;
}

interface MessageHistory {
  id: number;
  message_text: string;
  parse_mode: string;
  recipient_count: number;
  message_preview: string;
  sent_at: string;
}

export default function Messaging() {
  const [messageType, setMessageType] = useState<'all' | 'selected'>('all');
  const [messageText, setMessageText] = useState('');
  const [messageHTML, setMessageHTML] = useState('');
  const [useHTML, setUseHTML] = useState(false);
  const [parseMode, setParseMode] = useState<'HTML' | 'Markdown'>('HTML');
  const [disableWebPagePreview] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [buttons, setButtons] = useState<Array<{text: string, url: string}>>([]);

  // Selected users
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  // Message history
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>([]);

  useEffect(() => {
    if (showUserSelector) {
      fetchUsers();
    }
  }, [showUserSelector]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=1000');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Kullanıcılar yüklenemedi');
    }
  };

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    const filtered = getFilteredUsers();
    const newSelected = new Set(selectedUsers);
    filtered.forEach(user => newSelected.add(user.user_id));
    setSelectedUsers(newSelected);
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const getFilteredUsers = () => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      user.first_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.user_id.toString().includes(query)
    );
  };

  const insertHTMLTemplate = (template: string) => {
    setMessageHTML(messageHTML + template);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Sadece resim dosyaları yüklenebilir');
        return;
      }
      setPhotoFile(file);
      setPhotoUrl(''); // Clear URL if file is selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Sadece resim dosyaları yüklenebilir');
        return;
      }
      setPhotoFile(file);
      setPhotoUrl('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoUrl('');
    setPhotoPreview('');
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    // Convert to base64 or upload to a service
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async () => {
    const message = useHTML ? messageHTML : messageText;

    if (!message.trim() && !photoUrl && !photoFile) {
      toast.error('Lütfen bir mesaj veya fotoğraf ekleyin!');
      return;
    }

    if (messageType === 'selected' && selectedUsers.size === 0) {
      toast.error('Lütfen en az bir kullanıcı seçin!');
      return;
    }

    setLoading(true);

    try {
      // For photo file, we need URL not base64 - warn user
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        toast.error('Fotoğraf dosyası yükleme henüz desteklenmiyor. Lütfen fotoğraf URL\'si kullanın.');
        setLoading(false);
        return;
      }

      // Validate photo URL if provided
      if (finalPhotoUrl && !finalPhotoUrl.startsWith('http')) {
        toast.error('Geçerli bir URL giriniz (http:// veya https:// ile başlamalı)');
        setLoading(false);
        return;
      }

      // Prepare inline keyboard if buttons exist
      let inlineKeyboard = null;
      if (buttons.length > 0) {
        // Filter out empty buttons
        const validButtons = buttons.filter(btn => btn.text.trim() && btn.url.trim());
        if (validButtons.length > 0) {
          // Validate button URLs
          for (const btn of validButtons) {
            if (!btn.url.startsWith('http')) {
              toast.error(`Buton URL'si geçersiz: ${btn.text}`);
              setLoading(false);
              return;
            }
          }
          inlineKeyboard = [validButtons.map(btn => ({
            text: btn.text,
            url: btn.url
          }))];
        }
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message || '',
          parseMode,
          sendToAll: messageType === 'all',
          userIds: messageType === 'selected' ? Array.from(selectedUsers) : undefined,
          disableWebPagePreview,
          photoUrl: finalPhotoUrl || undefined,
          inlineKeyboard
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Mesaj başarıyla kuyruğa eklendi! (${data.sentCount} kullanıcı)`);
        toast.info('Bot 10 saniye içinde mesajları gönderecek...');
        setMessageText('');
        setMessageHTML('');
        clearPhoto();
        setButtons([]);
        setSelectedUsers(new Set());
        fetchMessageHistory();
      } else {
        toast.error(data.error || 'Mesaj gönderilemedi');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Mesaj gönderilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageHistory = async () => {
    try {
      const response = await fetch('/api/messages/history');
      const data = await response.json();
      if (data.success) {
        setMessageHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch message history:', error);
    }
  };

  useEffect(() => {
    fetchMessageHistory();
  }, []);

  const filteredUsers = getFilteredUsers();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Toplam Kullanıcı</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Seçili Kullanıcı</p>
                <p className="text-2xl font-bold">{selectedUsers.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Send className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Gönderilen Mesaj</p>
                <p className="text-2xl font-bold">{messageHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Composer */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Mesaj Gönder</CardTitle>
          <CardDescription>Kullanıcılara HTML destekli mesaj gönderin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Type Selector */}
          <div className="space-y-2">
            <Label>Gönderim Tipi</Label>
            <div className="flex gap-4">
              <Button
                variant={messageType === 'all' ? 'default' : 'outline'}
                onClick={() => setMessageType('all')}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                Tüm Kullanıcılar
              </Button>
              <Button
                variant={messageType === 'selected' ? 'default' : 'outline'}
                onClick={() => {
                  setMessageType('selected');
                  setShowUserSelector(true);
                }}
                className="flex-1"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Seçili Kullanıcılar ({selectedUsers.size})
              </Button>
            </div>
          </div>

          {/* Parse Mode */}
          <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
            <div>
              <Label>Mesaj Formatı</Label>
              <p className="text-sm text-zinc-500">HTML formatında mesaj gönderin</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={parseMode === 'Markdown' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParseMode('Markdown')}
              >
                Markdown
              </Button>
              <Button
                variant={parseMode === 'HTML' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setParseMode('HTML')}
              >
                HTML
              </Button>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Fotoğraf (Opsiyonel)</Label>

            {!photoPreview && !photoUrl && (
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  id="photoFile"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="photoFile" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Resim yüklemek için tıklayın veya sürükleyin
                  </p>
                  <p className="text-xs text-zinc-500">
                    PNG, JPG, GIF (Maks. 10MB)
                  </p>
                </label>
              </div>
            )}

            {/* Or URL Input */}
            {!photoPreview && !photoFile && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-300 dark:border-zinc-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">Veya URL</span>
                </div>
              </div>
            )}

            {!photoPreview && !photoFile && (
              <div className="flex gap-2">
                <Input
                  id="photoUrl"
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
            )}

            {/* Preview */}
            {(photoPreview || photoUrl) && (
              <div className="relative border rounded-lg overflow-hidden">
                <img
                  src={photoPreview || photoUrl}
                  alt="Preview"
                  className="w-full max-h-64 object-contain bg-zinc-100 dark:bg-zinc-900"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearPhoto}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Kaldır
                </Button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <Label>Butonlar (Inline Keyboard)</Label>
            <div className="space-y-2">
              {buttons.map((btn, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Buton Metni"
                    value={btn.text}
                    onChange={(e) => {
                      const newButtons = [...buttons];
                      newButtons[index].text = e.target.value;
                      setButtons(newButtons);
                    }}
                  />
                  <Input
                    placeholder="URL"
                    value={btn.url}
                    onChange={(e) => {
                      const newButtons = [...buttons];
                      newButtons[index].url = e.target.value;
                      setButtons(newButtons);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newButtons = buttons.filter((_, i) => i !== index);
                      setButtons(newButtons);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setButtons([...buttons, { text: '', url: '' }])}
                className="w-full"
              >
                <Square className="w-4 h-4 mr-2" />
                Buton Ekle
              </Button>
            </div>
          </div>

          {/* Message Editor */}
          <Tabs defaultValue="simple" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple" onClick={() => setUseHTML(false)}>
                Basit Metin
              </TabsTrigger>
              <TabsTrigger value="html" onClick={() => setUseHTML(true)}>
                HTML Editör
              </TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4">
              <div className="space-y-2">
                <Label>Mesaj Metni</Label>
                <Textarea
                  placeholder="Mesajınızı buraya yazın..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              {/* HTML Shortcuts */}
              <div className="space-y-2">
                <Label>Hızlı Ekle</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => insertHTMLTemplate('<b>Kalın Metin</b>')}
                  >
                    <b>B</b>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => insertHTMLTemplate('<i>İtalik Metin</i>')}
                  >
                    <i>I</i>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => insertHTMLTemplate('<a href="https://example.com">Link</a>')}
                  >
                    <Link2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => insertHTMLTemplate('<code>Kod</code>')}
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => insertHTMLTemplate('\n<a href="https://example.com">🔘 Buton Metni</a>\n')}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>HTML Mesaj</Label>
                <Textarea
                  placeholder="<b>Kalın</b>, <i>İtalik</i>, <a href='url'>Link</a>"
                  value={messageHTML}
                  onChange={(e) => setMessageHTML(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-zinc-500">
                  Desteklenen HTML etiketleri: b, i, u, s, code, pre, a, tg-spoiler
                </p>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Önizleme</Label>
                <div
                  className="p-4 border rounded-lg bg-white dark:bg-zinc-900 min-h-[100px]"
                  dangerouslySetInnerHTML={{ __html: messageHTML }}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Send Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleSendMessage}
              disabled={loading}
              className="flex-1"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'Gönderiliyor...' : `Mesajı Gönder${messageType === 'selected' ? ` (${selectedUsers.size} kişi)` : ' (Tümü)'}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Mesaj Geçmişi</CardTitle>
          <CardDescription>Gönderilen son mesajlar</CardDescription>
        </CardHeader>
        <CardContent>
          {messageHistory.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              Henüz mesaj gönderilmedi
            </div>
          ) : (
            <div className="space-y-3">
              {messageHistory.slice(0, 10).map((msg, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">{msg.recipient_count} alıcı</Badge>
                    <span className="text-sm text-zinc-500">
                      {formatTR(msg.sent_at)}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2">
                    {msg.message_preview}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Selector Dialog */}
      <Dialog open={showUserSelector} onOpenChange={setShowUserSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Kullanıcı Seç</DialogTitle>
            <DialogDescription>
              Mesaj göndermek istediğiniz kullanıcıları seçin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Search and Actions */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="İsim, kullanıcı adı veya ID ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <Search className="w-4 h-4" />
                  <span>{filteredUsers.length} kullanıcı bulundu</span>
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                      className="h-6 px-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Temizle
                    </Button>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllUsers}
                >
                  Tümünü Seç ({filteredUsers.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  <X className="w-4 h-4 mr-1" />
                  Temizle
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {selectedUsers.size} seçili
                </Badge>
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Seç</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Mesaj</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.user_id)}
                          onChange={() => toggleUserSelection(user.user_id)}
                          className="w-4 h-4 cursor-pointer"
                        />
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
                        <Badge variant="secondary">{user.message_count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserSelector(false)}>
              Kapat
            </Button>
            <Button onClick={() => setShowUserSelector(false)}>
              Seçimi Onayla ({selectedUsers.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
