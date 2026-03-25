import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Project, User, Priority, VoiceTaskDraft } from '@/types';
import { useConfirmVoiceTask, useParseVoiceTask, useUsers } from '@/hooks/useData';
import { Mic, Square, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project;
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

function toIsoDate(input: string): string | undefined {
  if (!input) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const m = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${d}`;
  }
  return undefined;
}

export function VoiceTaskModal({ open, onClose, project }: Props) {
  const { toast } = useToast();
  const { data: users = [] } = useUsers();
  const parseVoice = useParseVoiceTask();
  const confirmVoice = useConfirmVoiceTask();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [draft, setDraft] = useState<VoiceTaskDraft | null>(null);

  const [assigneeId, setAssigneeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');

  const teamMembers = useMemo(() => (
    users.filter(u => u.department === project.department || u.id === project.pmId)
  ), [users, project.department, project.pmId]);

  useEffect(() => {
    if (!open) {
      setIsRecording(false);
      setAudioBlob(null);
      setTranscript('');
      setDraft(null);
      setAssigneeId('');
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('MEDIUM');
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);

      const Win = window as Window & {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      };

      const Recognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = 'ru-RU';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (event) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0]?.transcript ?? '';
          }
          setTranscript(text.trim());
        };
        recognition.onerror = () => {
          // ignore and fallback to backend-only mode
        };
        recognition.start();
        recognitionRef.current = recognition;
      } else {
        toast({
          title: 'Автораспознавание недоступно',
          description: 'Запишите аудио и при необходимости вставьте transcript вручную',
        });
      }
    } catch (e) {
      toast({
        title: 'Не удалось начать запись',
        description: e instanceof Error ? e.message : 'Проверьте доступ к микрофону',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleParse = () => {
    if (!audioBlob && !transcript.trim()) {
      toast({
        title: 'Нужно аудио или transcript',
        description: 'Запишите голос или вставьте распознанный текст вручную',
        variant: 'destructive',
      });
      return;
    }
    parseVoice.mutate(
      { projectId: project.id, audio: audioBlob ?? new Blob([], { type: 'audio/webm' }), transcript },
      {
        onSuccess: (d) => {
          setDraft(d);
          setAssigneeId(d.assigneeId ?? d.assigneeCandidates[0]?.id ?? '');
          setTitle(d.title ?? '');
          setDescription(d.description ?? '');
          setDueDate(toIsoDate(d.dueDate ?? '') ?? '');
          setPriority((d.priority as Priority) ?? 'MEDIUM');
        },
        onError: (e) => {
          const message = e instanceof Error ? e.message : 'Ошибка парсинга голосовой команды';
          console.error('[VoiceTask parse] error:', e);
          toast({
            title: 'ИИ парсинг недоступен',
            description: message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleConfirm = () => {
    if (!assigneeId || !title.trim() || !dueDate) {
      toast({ title: 'Заполните assignee, title и дедлайн', variant: 'destructive' });
      return;
    }

    confirmVoice.mutate(
      {
        projectId: project.id,
        payload: {
          assigneeId,
          title: title.trim(),
          description,
          dueDate,
          priority,
          transcript: draft?.transcript,
          confidence: draft?.confidence,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Задача создана из голосовой команды' });
          onClose();
        },
      },
    );
  };

  const isLowConfidence = (draft?.confidence ?? 1) < 0.65;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Голосовая задача</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
            {!isRecording ? (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="w-4 h-4" />
                Начать запись
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopRecording} className="gap-2">
                <Square className="w-4 h-4" />
                Остановить
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleParse}
              disabled={(!audioBlob && !transcript.trim()) || parseVoice.isPending}
              className="gap-2"
            >
              {parseVoice.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Распознать и разобрать
            </Button>
          </div>

          <div>
            <Label>Transcript</Label>
            <Textarea value={transcript} onChange={e => setTranscript(e.target.value)} rows={3} className="mt-1.5" />
          </div>

          {draft && (
            <>
              {isLowConfidence && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Низкий confidence: {draft.confidence.toFixed(2)}. Проверьте поля перед созданием.
                  </AlertDescription>
                </Alert>
              )}

              {draft.warnings.length > 0 && (
                <Alert>
                  <AlertDescription>{draft.warnings.join(' · ')}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Исполнитель *</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Выберите исполнителя" /></SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Дедлайн *</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label>Название *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1.5" />
              </div>

              <div>
                <Label>Описание</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1.5" />
              </div>

              <div>
                <Label>Приоритет</Label>
                <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Низкий</SelectItem>
                    <SelectItem value="MEDIUM">Средний</SelectItem>
                    <SelectItem value="HIGH">Высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleConfirm} disabled={!draft || confirmVoice.isPending} className="gap-2">
            {confirmVoice.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Подтвердить и создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
