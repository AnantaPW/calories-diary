"use client";

import type { ReactNode } from "react";
import { useMediaQuery } from "@/hooks/useClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CloseIcon } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * One wrapper for every overlay: a bottom drawer on phones, a centred dialog
 * from 640px. Base UI handles Escape, the focus trap and returning focus.
 */
export default function Sheet({ open, onClose, title, children }: Props) {
  const wide = useMediaQuery("(min-width: 640px)");
  const onOpenChange = (next: boolean) => {
    if (!next) onClose();
  };

  if (wide) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="type-section pr-10">{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-b-none rounded-t-[20px] [--drawer-inset:0px]">
        <DrawerHeader className="flex-row items-start justify-between gap-3 text-left">
          <DrawerTitle className="type-section pt-2">{title}</DrawerTitle>
          <DrawerClose render={<Button variant="ghost" size="icon" aria-label="Close" />}>
            <CloseIcon />
          </DrawerClose>
        </DrawerHeader>
        <div className="overflow-y-auto overscroll-contain px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
