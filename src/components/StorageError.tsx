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
          Nothing has been deleted or overwritten. Either the app couldn&apos;t be reached, or your diary file in
          the app&apos;s data folder is damaged. If retrying doesn&apos;t help, whoever runs this app can restore that
          file from a backup.
        </p>
        <Button variant="outline" onClick={() => void diaryStore.reload()}>
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
