import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

/** Placeholder shaped like the plate card and the meals card, so nothing jumps when data arrives. */
export default function DayLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-6"
    >
      <Card variant="plate">
        <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
          {/* Same size and rim as the real plate (232px, 18px rim) so nothing jumps when the day loads. */}
          <Spinner className="size-[232px] shrink-0 text-primary [animation-duration:2.4s]" thickness={1.86} aria-hidden="true" role="presentation" />
          <div className="flex w-full flex-1 flex-col gap-4">
            <Skeleton className="h-6 w-32 bg-border" />
            <Skeleton className="h-8 bg-border" />
            <Skeleton className="h-8 bg-border" />
            <Skeleton className="h-8 bg-border" />
          </div>
        </CardContent>
      </Card>
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-5 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
