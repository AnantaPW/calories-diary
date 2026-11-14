"use client";

import { diaryStore } from "@/lib/client/diaryStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/** Shown instead of data when the diary couldn't be loaded from the server. */
export default function StorageError() {
  return (
    <Alert>
      <AlertTitle>Your diary couldn&apos;t be loaded</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>
          Nothing was deleted. The app may be offline, or your diary file may be damaged. If retrying
          doesn&apos;t help, ask the app&apos;s admin to restore it from a backup.
        </p>
        <Button variant="outline" onClick={() => void diaryStore.reload()}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
