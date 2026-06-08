import type { DebateSpeaker } from '@/types';
import { tokens } from '@/lib/tokens';

export type PersonaName = DebateSpeaker;

export interface PersonaConfig {
  key: PersonaName;
  name: string;
  label: string;
  role: string;
  icon: PersonaIconName;
  text: string;
  border: string;
  bg: string;
  glow: string;
  ring: string;
  hex: { primary: string; deep: string };
}

export type PersonaIconName = 'bull' | 'bear' | 'moderator' | 'sector' | 'risk' | 'synthesizer';

export const PERSONA: Record<PersonaName, PersonaConfig> = {
  moderator: {
    key: 'moderator',
    name: '主持人',
    label: 'MOD',
    role: '议程主持',
    icon: 'moderator',
    text: 'text-ink-2',
    border: 'border-ink-3/30',
    bg: 'bg-gradient-to-r from-surface-2 to-surface-1',
    glow: 'shadow-glow-primary',
    ring: 'ring-ink-3/40',
    hex: { primary: tokens.ink[2] ?? '#94a3b8', deep: '#475569' },
  },
  bull: {
    key: 'bull',
    name: '乐观派',
    label: 'BULL',
    role: '多头分析师',
    icon: 'bull',
    text: 'text-primary',
    border: 'border-primary/30',
    bg: 'bg-gradient-to-r from-primary/[0.06] to-primary/[0.02]',
    glow: 'shadow-glow-primary',
    ring: 'ring-primary/50',
    hex: { primary: '#22d3ee', deep: tokens.primary.DEFAULT },
  },
  bear: {
    key: 'bear',
    name: '谨慎派',
    label: 'BEAR',
    role: '空头分析师',
    icon: 'bear',
    text: 'text-warning',
    border: 'border-warning/30',
    bg: 'bg-gradient-to-r from-warning/[0.06] to-warning/[0.02]',
    glow: 'shadow-glow-warning',
    ring: 'ring-warning/50',
    hex: { primary: '#fbbf24', deep: tokens.warning },
  },
  sector: {
    key: 'sector',
    name: '行业专家',
    label: 'SECTOR',
    role: '行业视角',
    icon: 'sector',
    text: 'text-chart-6',
    border: 'border-chart-6/30',
    bg: 'bg-gradient-to-r from-chart-6/[0.06] to-surface-1',
    glow: 'shadow-glow-primary',
    ring: 'ring-chart-6/50',
    hex: { primary: '#34d399', deep: tokens.chart[6] },
  },
  risk: {
    key: 'risk',
    name: '风控官',
    label: 'RISK',
    role: '风险审查',
    icon: 'risk',
    text: 'text-chart-4',
    border: 'border-chart-4/30',
    bg: 'bg-gradient-to-r from-chart-4/[0.06] to-surface-1',
    glow: 'shadow-glow-warning',
    ring: 'ring-chart-4/50',
    hex: { primary: '#fb923c', deep: tokens.chart[4] },
  },
  synthesizer: {
    key: 'synthesizer',
    name: '总结',
    label: 'FINAL',
    role: '终局研判',
    icon: 'synthesizer',
    text: 'text-chart-5',
    border: 'border-chart-5/40',
    bg: 'bg-gradient-to-r from-chart-5/[0.08] to-chart-5/[0.02]',
    glow: 'shadow-glow-primary',
    ring: 'ring-chart-5/50',
    hex: { primary: '#a78bfa', deep: tokens.chart[5] },
  },
};

export const PERSONA_ORDER: PersonaName[] = [
  'moderator',
  'bull',
  'bear',
  'sector',
  'risk',
  'synthesizer',
];

export type DebatePhaseKey = 'open' | 'opening' | 'cross_exam' | 'rebuttal' | 'fact_check' | 'closing' | 'synthesis';

export const PHASE_ORDER: DebatePhaseKey[] = [
  'open',
  'opening',
  'cross_exam',
  'rebuttal',
  'fact_check',
  'closing',
  'synthesis',
];

export const PHASE_LABEL: Record<DebatePhaseKey, string> = {
  open: '开场',
  opening: '立论',
  cross_exam: '质询',
  rebuttal: '反驳',
  fact_check: '核实',
  closing: '结辩',
  synthesis: '终判',
};

export const PHASE_SUBTITLE: Record<DebatePhaseKey, string> = {
  open: '议程介绍 · 利益披露',
  opening: '双方开篇陈词',
  cross_exam: '你来我往 · 直面质询',
  rebuttal: '驳论交锋 · 数据亮剑',
  fact_check: '数据核实 · 风险揭示',
  closing: '总结陈词 · 立场回归',
  synthesis: '终局研判 · 投资建议',
};
