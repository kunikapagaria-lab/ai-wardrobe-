import { create } from "zustand";

interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmRequest {
  open: boolean;
  resolve: ((value: boolean) => void) | null;
  request: (req: ConfirmRequest) => Promise<boolean>;
  close: (value: boolean) => void;
}

const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirm",
  danger: false,
  resolve: null,
  request: (req) =>
    new Promise((resolve) => {
      set({ open: true, resolve, confirmLabel: "Confirm", danger: false, ...req });
    }),
  close: (value) => {
    get().resolve?.(value);
    set({ open: false, resolve: null });
  },
}));

export const confirm = (req: ConfirmRequest) => useConfirmStore.getState().request(req);

export { useConfirmStore };
