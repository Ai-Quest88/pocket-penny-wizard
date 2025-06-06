
import { Card } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface NetWorthWidgetProps {
  entityId?: string;
}

// Fetch net worth data from Supabase
const fetchNetWorthData = async (entityId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Fetch assets
  let assetsQuery = supabase
    .from('assets')
    .select('value, entity_id');

  if (entityId) {
    assetsQuery = assetsQuery.eq('entity_id', entityId);
  }

  const { data: assets, error: assetsError } = await assetsQuery;
  if (assetsError) throw assetsError;

  // Fetch liabilities
  let liabilitiesQuery = supabase
    .from('liabilities')
    .select('amount, entity_id');

  if (entityId) {
    liabilitiesQuery = liabilitiesQuery.eq('entity_id', entityId);
  }

  const { data: liabilities, error: liabilitiesError } = await liabilitiesQuery;
  if (liabilitiesError) throw liabilitiesError;

  const totalAssets = assets?.reduce((sum, asset) => sum + Number(asset.value), 0) || 0;
  const totalLiabilities = liabilities?.reduce((sum, liability) => sum + Number(liability.amount), 0) || 0;
  const netWorth = totalAssets - totalLiabilities;

  // For demo purposes, assume 5% growth from previous period
  const previousNetWorth = netWorth * 0.95;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    previousNetWorth
  };
}

export function NetWorthWidget({ entityId }: NetWorthWidgetProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['netWorth', entityId],
    queryFn: () => fetchNetWorthData(entityId),
  });

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded" />
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-6 space-y-4">
        <div className="text-center text-muted-foreground">
          Unable to load net worth data
        </div>
      </Card>
    )
  }

  const netWorthChange = data.previousNetWorth > 0 
    ? ((data.netWorth - data.previousNetWorth) / data.previousNetWorth) * 100 
    : 0;
  const isPositiveChange = netWorthChange >= 0

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Net Worth Overview</h3>
        <DollarSign className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Net Worth</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              ${data.netWorth.toLocaleString()}
            </span>
            {netWorthChange !== 0 && (
              <div className={`flex items-center ${isPositiveChange ? 'text-green-500' : 'text-red-500'}`}>
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm ml-1">
                  {Math.abs(netWorthChange).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Assets</p>
            <p className="text-lg font-semibold text-green-600">
              ${data.totalAssets.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-red-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Liabilities</p>
            <p className="text-lg font-semibold text-red-600">
              ${data.totalLiabilities.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
