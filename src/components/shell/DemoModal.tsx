/**
 * DemoModal — a demonstration "popup" using the shadcn Dialog primitive (Phase C ·
 * Part A, step 4). It exists so LO authors can see what the modal chrome looks like
 * (title, description, dismissable). The Dialog primitive (Base UI) already provides
 * the accessible dialog role, focus trap, Escape-to-close, and focus restore — we
 * only supply filler content.
 */
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function DemoModal() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Open demo popup</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Demo popup</DialogTitle>
          <DialogDescription>
            This is placeholder modal chrome. A real Learning Object might use a dialog for a
            glossary entry, a hint, or a confirmation.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Focus is trapped while the dialog is open, Escape closes it, and focus returns to the
          trigger — all handled by the primitive.
        </p>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
