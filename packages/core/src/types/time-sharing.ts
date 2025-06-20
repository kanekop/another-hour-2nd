import { AHTimeConfig } from './index';

/**
 * 時間共有の同期モード
 */
export type SyncMode = 'realtime' | 'scheduled' | 'manual';

/**
 * 参加者の役割
 */
export enum ParticipantRole {
    Owner = 'owner',
    Editor = 'editor',
    Viewer = 'viewer'
}

/**
 * 時間共有の参加者
 */
export interface TimeShareParticipant {
    id: string;
    name: string;
    email?: string;
    role: ParticipantRole;
    joinedAt: Date;
    lastSync?: Date;
}

/**
 * 時間共有設定
 */
export interface TimeShareConfig {
    id: string;
    name: string;
    participants: TimeShareParticipant[];
    syncMode: SyncMode;
    timeConfig: AHTimeConfig;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}

/**
 * 同期イベント
 */
export interface SyncEvent {
    id: string;
    shareConfigId: string;
    participantId: string;
    eventType: 'join' | 'leave' | 'update' | 'sync';
    timestamp: Date;
    data?: any;
} 