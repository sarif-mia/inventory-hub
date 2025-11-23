import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "react-countup";

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down";
}

export const StatCard = ({ title, value, change, icon: Icon, trend }: StatCardProps) => {
  const isNumeric = typeof value === "number" || (typeof value === "string" && !isNaN(Number(value)));

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">
              {isNumeric ? (
                <CountUp
                  end={typeof value === "string" ? parseFloat(value) : value}
                  duration={2}
                  separator=","
                />
              ) : (
                value
              )}
            </p>
            <p className={cn(
              "text-xs mt-2 font-medium",
              trend === "up" ? "text-green-600" : "text-red-600"
            )}>
              {change}
            </p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-110">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
