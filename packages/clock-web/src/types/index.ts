import { ClockAngles, AHTime, ClockState } from '@another-hour/core';

// Clock Web固有の型定義
export interface ClockSettingsData {
    duration: number;
    startHour: number;
}

export interface ClockUIElements {
    hourHand: SVGLineElement;
    minuteHand: SVGLineElement;
    secondHand: SVGLineElement;
    ahTime: HTMLElement;
    realTime: HTMLElement;
    phaseName: HTMLElement;
    body: HTMLBodyElement;
} 