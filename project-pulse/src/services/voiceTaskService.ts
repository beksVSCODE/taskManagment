import { VoiceTaskDraft, VoiceTaskConfirmPayload, Task } from '@/types';
import { api } from './apiClient';

function mapDraft(r: Record<string, unknown>): VoiceTaskDraft {
    return {
        transcript: (r.transcript as string) || '',
        assigneeRaw: r.assigneeRaw as string | undefined,
        assigneeId: r.assigneeId ? String(r.assigneeId) : undefined,
        title: (r.title as string) || '',
        description: (r.description as string) || undefined,
        dueDate: (r.dueDate as string) || undefined,
        priority: (r.priority as Task['priority']) || undefined,
        confidence: (r.confidence as number) || 0,
        warnings: (r.warnings as string[]) || [],
        missingFields: (r.missingFields as string[]) || [],
        assigneeCandidates: ((r.assigneeCandidates as Array<Record<string, unknown>>) || []).map(c => ({
            id: String(c.id),
            fullName: (c.fullName as string) || '',
            score: (c.score as number) || 0,
        })),
    };
}

function mapTask(t: Record<string, unknown>): Task {
    return {
        id: String(t.id),
        projectId: String(t.projectId),
        projectName: t.projectName as string | undefined,
        title: t.title as string,
        description: (t.description as string) || '',
        status: t.status as Task['status'],
        priority: t.priority as Task['priority'],
        creatorId: t.creatorId ? String(t.creatorId) : '',
        creatorName: t.creatorName as string | undefined,
        pmId: t.pmId ? String(t.pmId) : undefined,
        pmName: t.pmName as string | undefined,
        assigneeIds: ((t.assigneeIds as number[]) || []).map(String),
        assigneeNames: t.assigneeNames as string[] | undefined,
        watcherIds: [],
        startDate: t.startDate as string | undefined,
        dueDate: (t.dueDate as string) || '',
        createdAt: (t.createdAt as string) || new Date().toISOString(),
        completedAt: t.completedAt as string | undefined,
        isOverdue: t.isOverdue as boolean | undefined,
        tags: [],
        tagNames: (t.tagNames as string[]) || [],
        subtasks: [],
        subtaskCount: (t.subtaskCount as number) || 0,
        completedSubtaskCount: (t.completedSubtaskCount as number) || 0,
        comments: [],
        attachments: [],
        auditLog: [],
    };
}

export const voiceTaskService = {
    parse: async (projectId: string, audio: Blob, transcript?: string): Promise<VoiceTaskDraft> => {
        const formData = new FormData();
        formData.append('audio', audio, 'voice-task.webm');
        if (transcript && transcript.trim()) {
            formData.append('transcript', transcript.trim());
        }
        const result = await api.postForm<Record<string, unknown>>(`/projects/${projectId}/tasks/voice/parse`, formData);
        return mapDraft(result);
    },

    confirm: async (projectId: string, payload: VoiceTaskConfirmPayload): Promise<Task> => {
        const body = {
            assigneeId: Number(payload.assigneeId),
            title: payload.title,
            description: payload.description,
            dueDate: payload.dueDate,
            priority: payload.priority,
            transcript: payload.transcript,
            confidence: payload.confidence,
        };
        const result = await api.post<Record<string, unknown>>(`/projects/${projectId}/tasks/voice/confirm`, body);
        return mapTask(result);
    },
};
