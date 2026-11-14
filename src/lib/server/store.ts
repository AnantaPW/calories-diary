import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/*
 * JSON file storage. Every file lives under DATA_DIR (default: ./data in the
 * project). Writes go to a temporary file that is renamed over the old one,
 * so a crash mid-save never leaves half-written JSON, and writes to the same
 * file are queued so quick successive changes can't overwrite each other.
 */

/**
 * The data folder: DATA_DIR from the environment, or ./data in the project.
 * Marked for the bundler to ignore: it's read at runtime, and tracing it
 * would copy people's diaries into the build output.
 */
export const DATA_DIR = path.resolve(
  /* turbopackIgnore: true */ process.cwd(),
  process.env.DATA_DIR || "data",
);

/** Data files are readable by their owner only (ignored on Windows). */
const FILE_MODE = 0o600;
const DIR_MODE = 0o700;

export type ReadResult<T> =
  | { status: "ok"; value: T }
  | { status: "missing" }
  | { status: "corrupt" };

/** Thrown when a file exists but can't be parsed, so it must not be overwritten. */
export class CorruptFileError extends Error {
  constructor(public readonly file: string) {
    super(`Data file can't be read: ${file}`);
  }
}

/** Resolves a path inside DATA_DIR and refuses anything that would escape it. */
export function dataPath(...parts: string[]): string {
  const full = path.resolve(/* turbopackIgnore: true */ DATA_DIR, ...parts);
  if (full !== DATA_DIR && !full.startsWith(DATA_DIR + path.sep)) {
    throw new Error("Path outside the data folder");
  }
  return full;
}

export async function readJson<T>(file: string): Promise<ReadResult<T>> {
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { status: "missing" };
    throw err;
  }
  try {
    return { status: "ok", value: JSON.parse(raw) as T };
  } catch {
    return { status: "corrupt" };
  }
}

async function writeJsonAtomic(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true, mode: DIR_MODE });
  const temp = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  try {
    await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: FILE_MODE });
    await rename(temp, file);
  } catch (err) {
    await rm(temp, { force: true });
    throw err;
  }
}

const queues = new Map<string, Promise<unknown>>();

/** Deletes a file after any queued write to it, so an in-flight save can't bring it back. */
export function removeJson(file: string): Promise<void> {
  const run = (queues.get(file) ?? Promise.resolve()).catch(() => {}).then(() => rm(file, { force: true }));
  const tail = run.catch(() => {});
  queues.set(file, tail);
  void tail.then(() => {
    if (queues.get(file) === tail) queues.delete(file);
  });
  return run;
}

/**
 * Read-modify-write one file, one change at a time per file.
 * `change` receives the current value (or `fallback` when the file doesn't
 * exist yet) and returns the next value plus a result for the caller.
 * Throws CorruptFileError instead of overwriting a file it can't read.
 */
export function updateJson<T, R>(
  file: string,
  fallback: () => T,
  change: (current: T) => { next: T; result: R } | Promise<{ next: T; result: R }>,
): Promise<R> {
  const previous = queues.get(file) ?? Promise.resolve();
  const run = previous
    .catch(() => {})
    .then(async () => {
      const current = await readJson<T>(file);
      if (current.status === "corrupt") throw new CorruptFileError(file);
      const { next, result } = await change(current.status === "ok" ? current.value : fallback());
      await writeJsonAtomic(file, next);
      return result;
    });
  const tail = run.catch(() => {});
  queues.set(file, tail);
  void tail.then(() => {
    if (queues.get(file) === tail) queues.delete(file);
  });
  return run;
}
