import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Globe, DollarSign } from "lucide-react";
import { Entity } from "@/types/entities";
import { getCurrentFinancialYear, getFinancialYearDisplayName } from "@/utils/financialYearUtils";

interface FinancialYearDisplayProps {
  entity: Entity;
}

export function FinancialYearDisplay({ entity }: FinancialYearDisplayProps) {
  const currentFY = getCurrentFinancialYear(entity.primaryCountry);
  const displayName = getFinancialYearDisplayName(currentFY, entity.primaryCountry);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Financial Year Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>Primary Country</span>
            </div>
            <div className="font-medium">{entity.primaryCountry}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Primary Currency</span>
            </div>
            <div className="font-medium">{entity.primaryCurrency}</div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Financial Year</span>
              <Badge variant="secondary">{displayName}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Start Date:</span>
                <div className="font-medium">
                  {currentFY.startDate.toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">End Date:</span>
                <div className="font-medium">
                  {currentFY.endDate.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 