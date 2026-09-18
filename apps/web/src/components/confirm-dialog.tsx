import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prompt line shown as the title, e.g. "logout" or "rm comment". */
  command: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
};

/**
 * Shared confirmation dialog on the shadcn Dialog primitives, skinned with
 * utilities (same approach as the cmd+k palette). Replaces
 * native window.confirm so confirms match the rest of the UI.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  command,
  description,
  confirmLabel = 'confirm',
  cancelLabel = 'cancel',
  pending,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-[min(440px,calc(100vw-32px))] gap-3.5 rounded-xl border border-border bg-card p-6 text-left font-mono shadow-[0_18px_60px_rgba(0,0,0,0.35)] [&_[data-slot=dialog-close]]:hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 font-normal'>
            <span className='text-primary'>~ %</span>
            <span>{command}</span>
          </DialogTitle>
          <DialogDescription className='text-sm leading-relaxed text-muted-foreground'>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className='gap-2 sm:gap-2'>
          <button
            type='button'
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary'
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            type='button'
            className='cursor-pointer rounded-md border border-border bg-secondary px-3.5 py-1.75 text-sm leading-snug text-foreground transition-[border-color,color] duration-100 hover:border-primary hover:text-primary border-primary bg-primary text-primary-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground hover:brightness-95'
            disabled={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
