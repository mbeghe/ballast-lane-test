export const LABEL_SOURCES = {
  DATASET: 'dataset',
  AI: 'ai',
  MANUAL: 'manual',
  UNMAPPABLE: 'unmappable',
} as const;

export type LabelSource = (typeof LABEL_SOURCES)[keyof typeof LABEL_SOURCES];