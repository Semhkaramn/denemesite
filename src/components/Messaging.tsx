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
import { Send, Users, Image, Link2, Square, Code, UserCheck, Search, X, Upload, Trash2, Video, FileImage, Plus, ArrowRight, ArrowDown, Edit2, Pencil } from 'lucide-react';
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

interface ButtonItem {
  text: string;
  url: string;
  position: 'inline' | 'below';
}

export default function Messaging() {
  const [messageType, setMessageType] = useState<'all' | 'selected'>('all');
  const [messageText, setMessageText] = useState('');
  const [messageHTML, setMessageHTML] = useState('');
  const [useHTML, setUseHTML] = useState(false);
  const [parseMode, setParseMode] = useState<'HTML' | 'Markdown'>('HTML');
  const [disableWebPagePreview] = useState(true);

  // Media states - auto-detect type
  const [mediaType, setMediaType] = useState<'photo' | 'video' | 'gif'>('photo');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Button states with positioning
  const [buttons, setButtons] = useState<ButtonItem[]>([]);

  // Add button dialog states
  const [showAddButtonDialog, setShowAddButtonDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingButtonIndex, setEditingButtonIndex] = useState<number | null>(null);
  const [addAfterIndex, setAddAfterIndex] = useState<number | null>(null);
  const [newButtonText, setNewButtonText] = useState('');
  const [newButtonUrl, setNewButtonUrl] = useState('');
  const [newButtonPosition, setNewButtonPosition] = useState<'inline' | 'below'>('inline');

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

  const insertTag = (tag: string) => {
    const currentMessage = useHTML ? messageHTML : messageText;
    const newMessage = currentMessage + tag;

    if (useHTML) {
      setMessageHTML(newMessage);
    } else {
      setMessageText(newMessage);
    }
  };

  // Get tags based on parse mode
  const getFormattedTags = () => {
    if (parseMode === 'HTML') {
      return {
        bold: { text: 'Kalın', example: '<b>metin</b>' },
        italic: { text: 'İtalik', example: '<i>metin</i>' },
        underline: { text: 'Altı Çizili', example: '<u>metin</u>' },
        strike: { text: 'Üstü Çizili', example: '<s>metin</s>' },
        code: { text: 'Kod', example: '<code>kod</code>' },
        link: { text: 'Link', example: '<a href="url">metin</a>' },
        spoiler: { text: 'Spoiler', example: '<tg-spoiler>metin</tg-spoiler>' },
      };
    } else {
      // Markdown - spoiler ve mention çalışmıyor, onları çıkarıyoruz
      return {
        bold: { text: 'Kalın', example: '**metin**' },
        italic: { text: 'İtalik', example: '_metin_' },
        underline: { text: 'Altı Çizili', example: '__metin__' },
        strike: { text: 'Üstü Çizili', example: '~metin~' },
        code: { text: 'Kod', example: '`kod`' },
        link: { text: 'Link', example: '[metin](url)' },
      };
    }
  };

  // Get user tags based on parse mode
  const getUserTags = () => {
    if (parseMode === 'HTML') {
      return [
        { key: 'username', label: '{username}' },
        { key: 'first_name', label: '{first_name}' },
        { key: 'mention', label: '{mention}' },
      ];
    } else {
      // Markdown - mention çalışmıyor
      return [
        { key: 'username', label: '{username}' },
        { key: 'first_name', label: '{first_name}' },
      ];
    }
  };

  // Auto-detect media type from file
  const detectMediaType = (file: File): 'photo' | 'video' | 'gif' => {
    if (file.type.includes('gif')) return 'gif';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('image/')) return 'photo';
    return 'photo';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Dosya boyutu 50MB\'dan küçük olmalıdır');
        return;
      }

      // Auto-detect media type
      const detectedType = detectMediaType(file);
      setMediaType(detectedType);

      setPhotoFile(file);
      setPhotoUrl('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast.success(`${detectedType === 'photo' ? 'Fotoğraf' : detectedType === 'video' ? 'Video' : 'GIF'} yüklendi`);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Dosya boyutu 50MB\'dan küçük olmalıdır');
        return;
      }

      // Auto-detect media type
      const detectedType = detectMediaType(file);
      setMediaType(detectedType);

      setPhotoFile(file);
      setPhotoUrl('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast.success(`${detectedType === 'photo' ? 'Fotoğraf' : detectedType === 'video' ? 'Video' : 'GIF'} yüklendi`);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoUrl('');
    setPhotoPreview('');
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success && data.url) {
        return data.url;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      throw new Error('Fotoğraf yüklenemedi');
    }
  };

  const openAddButtonDialog = (position: 'inline' | 'below', afterIndex?: number) => {
    setIsEditMode(false);
    setNewButtonPosition(position);
    setNewButtonText('');
    setNewButtonUrl('');
    setAddAfterIndex(afterIndex !== undefined && afterIndex >= 0 ? afterIndex : null);
    setEditingButtonIndex(null);
    setShowAddButtonDialog(true);
  };

  const openEditButtonDialog = (index: number) => {
    setIsEditMode(true);
    const button = buttons[index];
    setNewButtonText(button.text);
    setNewButtonUrl(button.url);
    setNewButtonPosition(button.position);
    setEditingButtonIndex(index);
    setAddAfterIndex(null);
    setShowAddButtonDialog(true);
  };

  const confirmAddButton = () => {
    if (!newButtonText.trim() || !newButtonUrl.trim()) {
      toast.error('Lütfen buton metni ve URL girin!');
      return;
    }

    if (isEditMode && editingButtonIndex !== null) {
      // Editing existing button
      const newButtons = [...buttons];
      newButtons[editingButtonIndex] = {
        text: newButtonText,
        url: newButtonUrl,
        position: newButtonPosition
      };
      setButtons(newButtons);
      toast.success('Buton güncellendi!');
    } else {
      // Adding new button
      const newButton = {
        text: newButtonText,
        url: newButtonUrl,
        position: newButtonPosition
      };

      if (addAfterIndex !== null && addAfterIndex >= 0) {
        // Insert after specific button
        const newButtons = [...buttons];
        newButtons.splice(addAfterIndex + 1, 0, newButton);
        setButtons(newButtons);
      } else {
        // Add to end
        setButtons([...buttons, newButton]);
      }
      toast.success('Buton eklendi!');
    }

    setShowAddButtonDialog(false);
    setNewButtonText('');
    setNewButtonUrl('');
    setIsEditMode(false);
    setEditingButtonIndex(null);
    setAddAfterIndex(null);
  };

  const removeButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
    toast.success('Buton silindi!');
  };

  const updateButton = (index: number, field: 'text' | 'url', value: string) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    setButtons(newButtons);
  };

  const handleSendMessage = async () => {
    const message = useHTML ? messageHTML : messageText;

    if (!message.trim() && !photoUrl && !photoFile) {
      toast.error('Lütfen bir mesaj veya medya ekleyin!');
      return;
    }

    if (messageType === 'selected' && selectedUsers.size === 0) {
      setShowUserSelector(true);
      toast.error('Lütfen en az bir kullanıcı seçin!');
      return;
    }

    setLoading(true);

    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        toast.info('Medya yükleniyor...');
        try {
          finalPhotoUrl = await uploadPhoto(photoFile);
          toast.success('Medya başarıyla yüklendi!');
        } catch (error) {
          toast.error('Medya yüklenemedi. Lütfen tekrar deneyin.');
          setLoading(false);
          return;
        }
      }

      if (finalPhotoUrl) {
        const trimmedUrl = finalPhotoUrl.trim();
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('data:')) {
          finalPhotoUrl = 'https://' + trimmedUrl;
        } else {
          finalPhotoUrl = trimmedUrl;
        }
      }

      // Build inline keyboard with positioning
      let inlineKeyboard = null;
      if (buttons.length > 0) {
        const validButtons = buttons.filter(btn => btn.text.trim() && btn.url.trim());
        if (validButtons.length > 0) {
          const processedButtons = validButtons.map(btn => {
            let url = btn.url.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              url = 'https://' + url;
            }
            return {
              text: btn.text,
              url: url,
              position: btn.position
            };
          });

          // Group buttons by rows based on position
          const rows: Array<Array<{text: string; url: string}>> = [];
          let currentRow: Array<{text: string; url: string}> = [];

          for (const btn of processedButtons) {
            if (btn.position === 'below' && currentRow.length > 0) {
              rows.push(currentRow);
              currentRow = [];
            }
            currentRow.push({ text: btn.text, url: btn.url });
            if (btn.position === 'below') {
              rows.push(currentRow);
              currentRow = [];
            }
          }
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }

          inlineKeyboard = rows;
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
          inlineKeyboard,
          mediaType: finalPhotoUrl ? mediaType : undefined,
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
  const formattedTags = getFormattedTags();
  const userTags = getUserTags();

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
          <CardDescription>Kullanıcılara medya ve butonlarla zenginleştirilmiş mesaj gönderin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Media Upload - TOP */}
          <div className="space-y-2">
            <Label>Medya (Opsiyonel)</Label>

            {!photoPreview && !photoUrl && (
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <input
                  type="file"
                  id="photoFile"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="photoFile" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Fotoğraf, Video veya GIF yükleyin
                  </p>
                  <p className="text-xs text-zinc-500">
                    Dosya türü otomatik algılanacak (Maks. 50MB)
                  </p>
                </label>
              </div>
            )}

            {!photoPreview && !photoFile && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-300 dark:border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">Veya URL</span>
                  </div>
                </div>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </>
            )}

            {(photoPreview || photoUrl) && (
              <div className="relative border rounded-lg overflow-hidden">
                {mediaType === 'video' ? (
                  <video
                    src={photoPreview || photoUrl}
                    className="w-full max-h-64 object-contain bg-zinc-100 dark:bg-zinc-900"
                    controls
                  />
                ) : (
                  <img
                    src={photoPreview || photoUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-contain bg-zinc-100 dark:bg-zinc-900"
                  />
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant="secondary">
                    {mediaType === 'photo' ? 'Fotoğraf' : mediaType === 'video' ? 'Video' : 'GIF'}
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearPhoto}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
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
                <div className="flex items-center justify-between">
                  <Label>Mesaj Metni</Label>
                  <div className="flex items-center gap-2">
                    {/* Format Selection - Minimal */}
                    <div className="flex gap-1">
                      <Button
                        variant={parseMode === 'HTML' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setParseMode('HTML')}
                        className="h-7 text-xs px-2"
                      >
                        HTML
                      </Button>
                      <Button
                        variant={parseMode === 'Markdown' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setParseMode('Markdown')}
                        className="h-7 text-xs px-2"
                      >
                        Markdown
                      </Button>
                    </div>
                  </div>
                </div>

                {/* User Tags - Minimal */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {userTags.map((tag) => (
                    <Button
                      key={tag.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertTag(tag.label)}
                      className="text-xs h-6 px-2"
                    >
                      {tag.label}
                    </Button>
                  ))}
                  {Object.entries(formattedTags).map(([key, value]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertTag(value.example)}
                      className="text-xs h-6 px-2"
                      title={value.example}
                    >
                      {value.text}
                    </Button>
                  ))}
                </div>

                <Textarea
                  placeholder="Mesajınızı buraya yazın..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={8}
                  className="font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>HTML Mesaj</Label>
                  <div className="flex items-center gap-2">
                    {/* Format Selection - Minimal */}
                    <div className="flex gap-1">
                      <Button
                        variant={parseMode === 'HTML' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setParseMode('HTML')}
                        className="h-7 text-xs px-2"
                      >
                        HTML
                      </Button>
                      <Button
                        variant={parseMode === 'Markdown' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setParseMode('Markdown')}
                        className="h-7 text-xs px-2"
                      >
                        Markdown
                      </Button>
                    </div>
                  </div>
                </div>

                {/* User Tags - Minimal */}
                <div className="flex flex-wrap gap-1 mb-1">
                  {userTags.map((tag) => (
                    <Button
                      key={tag.key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertTag(tag.label)}
                      className="text-xs h-6 px-2"
                    >
                      {tag.label}
                    </Button>
                  ))}
                  {Object.entries(formattedTags).map(([key, value]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => insertTag(value.example)}
                      className="text-xs h-6 px-2"
                      title={value.example}
                    >
                      {value.text}
                    </Button>
                  ))}
                </div>

                <Textarea
                  placeholder="<b>Kalın</b>, <i>İtalik</i>, <a href='url'>Link</a>"
                  value={messageHTML}
                  onChange={(e) => setMessageHTML(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-zinc-500">
                  Desteklenen: b, i, u, s, code, pre, a, tg-spoiler
                </p>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Önizleme</Label>
                <div
                  className="p-4 border rounded-lg bg-white dark:bg-zinc-900 min-h-[60px]"
                  dangerouslySetInnerHTML={{ __html: messageHTML }}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Buttons Section - Modern Design */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Inline Keyboard Butonlar</Label>
              {buttons.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setButtons([])}
                  className="h-7 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Tümünü Temizle
                </Button>
              )}
            </div>

            {buttons.length === 0 ? (
              <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 mb-4">
                  <Square className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Henüz buton eklenmedi</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 max-w-sm mx-auto">
                  Mesajınıza interaktif butonlar ekleyerek kullanıcı deneyimini geliştirin
                </p>
                <Button
                  onClick={() => openAddButtonDialog('below', -1)}
                  className="shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  İlk Butonu Ekle
                </Button>
              </div>
            ) : (
              <div className="border rounded-xl bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/50 dark:to-zinc-900/30 p-6">
                {/* Preview Section */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Önizleme
                    </span>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 border shadow-sm">
                    <div className="space-y-2">
                      {(() => {
                        const rows: number[][] = [];
                        let currentRow: number[] = [];

                        buttons.forEach((btn, index) => {
                          if (btn.position === 'below' && currentRow.length > 0) {
                            rows.push(currentRow);
                            currentRow = [];
                          }
                          currentRow.push(index);
                          if (btn.position === 'below') {
                            rows.push(currentRow);
                            currentRow = [];
                          }
                        });
                        if (currentRow.length > 0) {
                          rows.push(currentRow);
                        }

                        return rows.map((row, rowIndex) => (
                          <div key={rowIndex} className="flex gap-2">
                            {row.map((btnIndex) => {
                              const btn = buttons[btnIndex];
                              return (
                                <div
                                  key={btnIndex}
                                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-center text-sm font-medium shadow-sm hover:bg-blue-600 transition-colors cursor-default"
                                >
                                  {btn.text}
                                </div>
                              );
                            })}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Buttons Editor */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      Düzenle
                    </span>
                  </div>

                  {buttons.map((btn, btnIndex) => {
                    // Check if next button should be on same row (inline)
                    const nextBtn = buttons[btnIndex + 1];
                    const isLastInRow = !nextBtn || nextBtn.position === 'below' || btn.position === 'below';

                    return (
                      <div key={btnIndex}>
                        <div className="flex items-center gap-2">
                          {/* Button Preview */}
                          <div className="flex-1 group relative bg-white dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2.5 hover:border-blue-400 dark:hover:border-blue-600 transition-all">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-sm truncate">{btn.text}</div>
                                  <div className="text-xs text-zinc-500 truncate">{btn.url}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditButtonDialog(btnIndex)}
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Düzenle"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeButton(btnIndex)}
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Position Badge */}
                          <div className="flex-shrink-0">
                            {btn.position === 'below' ? (
                              <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-xs">
                                <ArrowDown className="w-3 h-3 mr-1" />
                                Alt
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs">
                                <ArrowRight className="w-3 h-3 mr-1" />
                                Yan
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Quick Add Buttons */}
                        <div className="flex items-center justify-center gap-2 my-2">
                          {!isLastInRow && (
                            <button
                              onClick={() => openAddButtonDialog('inline', btnIndex)}
                              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 hover:bg-green-200 dark:hover:bg-green-950/50 transition-all text-xs font-medium text-green-700 dark:text-green-400"
                            >
                              <Plus className="w-3 h-3" />
                              Yanına Ekle
                              <ArrowRight className="w-3 h-3 opacity-50" />
                            </button>
                          )}
                          <button
                            onClick={() => openAddButtonDialog('below', btnIndex)}
                            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-950/30 hover:bg-orange-200 dark:hover:bg-orange-950/50 transition-all text-xs font-medium text-orange-700 dark:text-orange-400"
                          >
                            <Plus className="w-3 h-3" />
                            Altına Ekle
                            <ArrowDown className="w-3 h-3 opacity-50" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="space-y-3 pt-4 border-t">
            {/* Message Type Selector */}
            <div className="flex gap-2">
              <Button
                variant={messageType === 'all' ? 'default' : 'outline'}
                onClick={() => setMessageType('all')}
                className="flex-1"
                size="sm"
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
                size="sm"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Kullanıcı Seç ({selectedUsers.size})
              </Button>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={loading}
              className="w-full"
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

      {/* Add/Edit Button Dialog - Modern */}
      <Dialog open={showAddButtonDialog} onOpenChange={setShowAddButtonDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                {isEditMode ? (
                  <Pencil className="w-5 h-5 text-white" />
                ) : (
                  <Plus className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {isEditMode ? 'Buton Düzenle' : 'Yeni Buton Ekle'}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? 'Buton bilgilerini güncelleyin'
                    : 'Mesajınıza interaktif buton ekleyin'
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Position Selector */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Buton Konumu</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewButtonPosition('inline')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      newButtonPosition === 'inline'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <ArrowRight className={`w-5 h-5 ${newButtonPosition === 'inline' ? 'text-green-600' : 'text-zinc-400'}`} />
                    </div>
                    <div className="text-sm font-semibold mb-1">Yan Yana</div>
                    <div className="text-xs text-zinc-500">Önceki butonun yanına</div>
                  </button>
                  <button
                    onClick={() => setNewButtonPosition('below')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      newButtonPosition === 'below'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <ArrowDown className={`w-5 h-5 ${newButtonPosition === 'below' ? 'text-orange-600' : 'text-zinc-400'}`} />
                    </div>
                    <div className="text-sm font-semibold mb-1">Alt Alta</div>
                    <div className="text-xs text-zinc-500">Yeni satırda</div>
                  </button>
                </div>
              </div>
            )}

            {/* Button Text */}
            <div className="space-y-2">
              <Label htmlFor="buttonText" className="text-sm font-semibold">
                Buton Metni *
              </Label>
              <div className="relative">
                <Square className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="buttonText"
                  placeholder="örn: Web Sitemiz, Telegram Kanalı, Destek"
                  value={newButtonText}
                  onChange={(e) => setNewButtonText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      document.getElementById('buttonUrl')?.focus();
                    }
                  }}
                  className="pl-10 h-11"
                  autoFocus
                />
              </div>
              <p className="text-xs text-zinc-500">Kullanıcının göreceği metin</p>
            </div>

            {/* Button URL */}
            <div className="space-y-2">
              <Label htmlFor="buttonUrl" className="text-sm font-semibold">
                Bağlantı Adresi (URL) *
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  id="buttonUrl"
                  placeholder="örn: https://example.com"
                  value={newButtonUrl}
                  onChange={(e) => setNewButtonUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      confirmAddButton();
                    }
                  }}
                  className="pl-10 h-11"
                />
              </div>
              <p className="text-xs text-zinc-500">Butona tıklandığında açılacak link</p>
            </div>

            {/* Preview */}
            {newButtonText && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Önizleme</Label>
                <div className="p-4 bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-900/50 dark:to-zinc-900/30 rounded-lg border">
                  <div className="bg-white dark:bg-zinc-950 rounded-lg p-3 border shadow-sm">
                    <div className="px-4 py-2 bg-blue-500 text-white rounded-lg text-center text-sm font-medium">
                      {newButtonText}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddButtonDialog(false)}
              className="flex-1"
            >
              İptal
            </Button>
            <Button
              onClick={confirmAddButton}
              disabled={!newButtonText.trim() || !newButtonUrl.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isEditMode ? (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Güncelle
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ekle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
