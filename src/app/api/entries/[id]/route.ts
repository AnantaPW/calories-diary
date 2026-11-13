import { changeUserData } from "@/lib/server/guardedWrite";
import { jsonError, requireSession } from "@/lib/server/session";
import { isEntryId } from "@/lib/validate";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Session and same-site check come before reading anything from the request.
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  if (!isEntryId(id)) return jsonError(400, "Unknown entry.");
  return changeUserData(request, (data) => ({
    ...data,
    entries: data.entries.filter((e) => e.id !== id),
  }));
}
