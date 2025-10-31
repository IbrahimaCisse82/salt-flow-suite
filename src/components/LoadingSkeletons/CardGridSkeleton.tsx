import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface CardGridSkeletonProps {
  cards?: number;
  columns?: number;
}

export const CardGridSkeleton = ({ 
  cards = 6, 
  columns = 3 
}: CardGridSkeletonProps) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4"
  }[columns] || "grid-cols-3";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-full mt-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
