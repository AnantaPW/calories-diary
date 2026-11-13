"use client";

import { diaryStore } from "@/lib/client/diaryStore";

/** Shown instead of data when the diary couldn't be loaded from the server. */
export default function StorageError() {
  return (
    <div className="card" role="alert">
      <h2 className="font-semibold">Your diary couldn&apos;t be loaded</h2>
      <p className="mt-2 text-sm text-muted">
        Nothing has been deleted or overwritten. Either the app couldn&apos;t be reached, or your
        diary file in the app&apos;s data folder is damaged. If retrying doesn&apos;t help, whoever
        runs this app can restore that file from a backup.
      </p>
      <button type="button" className="btn-quiet mt-4" onClick={() => void diaryStore.reload()}>
        Try again
      </button>
    </div>
  );
}
