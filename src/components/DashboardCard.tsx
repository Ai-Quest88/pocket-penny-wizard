import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  'data-testid'?: string;
}

export const DashboardCard = ({ title, value, trend, className, 'data-testid': dataTestId }: DashboardCardProps) => {
  return (
    <Card className={cn("p-6 animate-fadeIn", className)} data-testid={dataTestId}>
      <h3 className="text-sm font-medium text-text-muted mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-semibold text-text">{value}</p>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-danger"
            )}
          >
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </Card>
  );
};