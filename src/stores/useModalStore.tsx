import {create} from 'zustand';

type ModalStateType = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const initialState: Omit<ModalStateType, 'openModal' | 'closeModal'> = {
  isOpen: false,
};

export const useModalStore = create<ModalStateType>((set) => ({
  ...initialState,
  openModal: () => set({isOpen: true}),
  closeModal: () => set({isOpen: false}),
}));
