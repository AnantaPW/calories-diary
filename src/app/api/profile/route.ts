import { calculateDailyTarget, DEFAULT_PROFILE, recordTargetChange } from "@/lib/calories";
import { isDateKey } from "@/lib/date";
import { changeUserData } from "@/lib/server/guardedWrite";
import { jsonError, requireSession } from "@/lib/server/session";
import { parseProfile } from "@/lib/validate";

/** Saves the profile and records a target change from `today` (the person's local date). */
export async function PUT(request: Request) {
  // Session and same-site check come before reading anything from the request.
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const profile = parseProfile(body?.profile);
  if (!profile) return jsonError(400, "Some profile values are out of range.");
  const today = typeof body?.today === "string" && isDateKey(body.today) ? body.today : null;
  if (!today) return jsonError(400, "Missing today's date.");

  return changeUserData(request, (data) => ({
    ...data,
    profile,
    targets: recordTargetChange(
      data.targets,
      calculateDailyTarget(data.profile ?? DEFAULT_PROFILE),
      calculateDailyTarget(profile),
      today,
    ),
  }));
}
