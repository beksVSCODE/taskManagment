import { useEffect, useState } from 'react';
import { telegramApi } from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Send, Unlink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TelegramStatus {
    linked: boolean;
    enabled: boolean;
    chatId?: string;
}

export function TelegramSettings() {
    const [status, setStatus] = useState<TelegramStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [linkData, setLinkData] = useState<{ deepLink: string; expiresAt: string } | null>(null);
    const [requesting, setRequesting] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [confirmUnlink, setConfirmUnlink] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    // Auto-refresh: поллинг пока ссылка показана (пользователь открыл Telegram и нажал START)
    useEffect(() => {
        if (!linkData || status?.linked) return;
        const timer = setInterval(async () => {
            try {
                const fresh = await telegramApi.getStatus();
                if (fresh.linked) {
                    setStatus(fresh);
                    setLinkData(null);
                    setToastMessage('🎉 Telegram успешно подключён!');
                }
            } catch {
                // ошибки поллинга игнорируем
            }
        }, 3000);
        return () => clearInterval(timer);
    }, [linkData, status?.linked]);

    const loadStatus = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await telegramApi.getStatus();
            setStatus(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки статуса');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestLink = async () => {
        try {
            setRequesting(true);
            setError(null);
            const data = await telegramApi.requestLink();
            setLinkData(data);
            setToastMessage('✅ Ссылка создана, действительна 20 минут');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при создании ссылки');
        } finally {
            setRequesting(false);
        }
    };

    const handleCopyLink = () => {
        if (linkData) {
            navigator.clipboard.writeText(linkData.deepLink);
            setToastMessage('📋 Ссылка скопирована в буфер обмена');
        }
    };

    const handleToggleEnabled = async (enabled: boolean) => {
        try {
            setError(null);
            await telegramApi.setEnabled(enabled);
            setStatus(prev => prev ? { ...prev, enabled } : null);
            setToastMessage(enabled ? '✅ Уведомления включены' : '⏸️ Уведомления отключены');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при изменении настройки');
        }
    };

    const handleUnlink = async () => {
        try {
            setUnlinking(true);
            setError(null);
            await telegramApi.unlink();
            setStatus(prev => prev ? { ...prev, linked: false, enabled: false } : null);
            setLinkData(null);
            setConfirmUnlink(false);
            setToastMessage('❌ Telegram отключен');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при отключении');
        } finally {
            setUnlinking(false);
        }
    };

    if (loading) {
        return (
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Telegram уведомления</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-10 bg-gray-200 rounded" />
                        <div className="h-6 bg-gray-200 rounded w-2/3" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    📱 Telegram уведомления
                </CardTitle>
                <CardDescription>
                    Получайте уведомления о задачах прямо в Telegram
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {toastMessage && (
                    <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800">
                            {toastMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Статус подключения */}
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Статус:</span>
                        <div className="flex items-center gap-2">
                            {status?.linked ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-green-600 font-medium">
                                        Подключен ({status.chatId})
                                    </span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    <span className="text-sm text-orange-600">
                                        Не подключен
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {status?.linked && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Уведомления:</span>
                            <button
                                onClick={() => handleToggleEnabled(!status.enabled)}
                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    status.enabled
                                        ? 'bg-green-200 text-green-800 hover:bg-green-300'
                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            >
                                {status.enabled ? '✓ Включены' : '○ Отключены'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Действия */}
                <div className="space-y-2">
                    {!status?.linked ? (
                        <>
                            <Button
                                onClick={handleRequestLink}
                                disabled={requesting}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                {requesting ? 'Создание ссылки...' : 'Подключить Telegram'}
                            </Button>

                            {linkData && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-900 font-medium mb-2">
                                        Ссылка создана (действительна 20 мин):
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={linkData.deepLink}
                                            readOnly
                                            className="flex-1 text-xs p-2 bg-white border border-blue-300 rounded font-mono overflow-hidden text-ellipsis"
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCopyLink}
                                            className="text-xs"
                                        >
                                            Копировать
                                        </Button>
                                    </div>
                                    <p className="text-xs text-blue-700 mt-2">
                                        или кликните на кнопку выше для перехода в Telegram
                                    </p>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="default"
                                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <a href={linkData.deepLink} target="_blank" rel="noreferrer">
                                            Открыть в Telegram →
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-2">
                            {!confirmUnlink ? (
                                <Button
                                    onClick={() => setConfirmUnlink(true)}
                                    disabled={unlinking}
                                    variant="destructive"
                                    className="w-full"
                                >
                                    <Unlink className="h-4 w-4 mr-2" />
                                    Отключить Telegram
                                </Button>
                            ) : (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                                    <p className="text-sm text-red-800 font-medium">
                                        Вы уверены? Уведомления Telegram будут отключены.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleUnlink}
                                            disabled={unlinking}
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1"
                                        >
                                            {unlinking ? 'Отключение...' : 'Да, отключить'}
                                        </Button>
                                        <Button
                                            onClick={() => setConfirmUnlink(false)}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                        >
                                            Отмена
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <p className="text-xs text-gray-500">
                    💡 После подключения вы будете получать уведомления о новых задачах,
                    изменениях статуса и просроченных задачах прямо в мессенджер.
                </p>
            </CardContent>
        </Card>
    );
}
