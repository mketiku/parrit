import { create } from 'zustand';
import { createBaseSlice, type BaseSlice } from './slices/baseSlice';
import { createPeopleSlice, type PeopleSlice } from './slices/peopleSlice';
import { createBoardsSlice, type BoardsSlice } from './slices/boardsSlice';
import {
  createLifecycleSlice,
  type LifecycleSlice,
} from './slices/lifecycleSlice';
import { createSessionSlice, type SessionSlice } from './slices/sessionSlice';
import {
  createAlgorithmSlice,
  type AlgorithmSlice,
} from './slices/algorithmSlice';
import {
  createTemplateSlice,
  type TemplateSlice,
} from './slices/templateSlice';
import {
  createExportImportSlice,
  type ExportImportSlice,
} from './slices/exportImportSlice';

export { AVATAR_COLORS } from './slices/helpers';

export type PairingStore = BaseSlice &
  PeopleSlice &
  BoardsSlice &
  LifecycleSlice &
  SessionSlice &
  AlgorithmSlice &
  TemplateSlice &
  ExportImportSlice;

export const usePairingStore = create<PairingStore>()((...a) => ({
  ...createBaseSlice(...a),
  ...createPeopleSlice(...a),
  ...createBoardsSlice(...a),
  ...createLifecycleSlice(...a),
  ...createSessionSlice(...a),
  ...createAlgorithmSlice(...a),
  ...createTemplateSlice(...a),
  ...createExportImportSlice(...a),
}));
