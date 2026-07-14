import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("skeleton rounded-xl", className)} style={style} />;
}

export function WardrobeGridSkeleton() {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
      {Array.from({ length: 14 }).map((_, i) => (
        <Skeleton key={i} className="w-full" style={{ aspectRatio: "5/7" }} />
      ))}
    </div>
  );
}
