import { TransactionList } from "@/components/TransactionList"
import { CashFlowChart } from "@/components/CashFlowChart"
import { NetWorthWidget } from "@/components/NetWorthWidget"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { CategoryPieChart } from "@/components/CategoryPieChart"
import { EmptyState } from "@/components/EmptyState"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencySelector } from "@/components/transactions/CurrencySelector"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { Banknote, TrendingUp, Upload } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"
interface DashboardProps {
  entityId?: string;
}

function getWeekStart(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().split("T")[0];
}

const Dashboard = () => {
  const { displayCurrency, setDisplayCurrency, isRatesLoading } = useCurrency();
  const { session } = useAuth();
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const navigate = useNavigate();

  const { data: transactionCount = 0, isLoading: countLoading } = useQuery({
    queryKey: ['transaction-count', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return 0;
      const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!session?.user?.id,
  });

  const hasRealData = !countLoading && transactionCount > 0;
  const isEmpty = !countLoading && transactionCount === 0;

  // This week's spending (for "This week" card)
  const weekStart = getWeekStart(new Date());
  const { data: weekSpending = 0 } = useQuery({
    queryKey: ["dashboard-week-spending", session?.user?.id, weekStart, selectedEntityType],
    queryFn: async () => {
      if (!session?.user?.id) return 0;
      let query = supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", session.user.id)
        .gte("date", weekStart)
        .lt("amount", 0);
      if (selectedEntityType !== "all") {
        const { data: accountIds } = await supabase.from("assets").select("id").eq("entity_id", selectedEntityType);
        const ids = accountIds?.map((a) => a.id) ?? [];
        if (ids.length) query = query.in("asset_account_id", ids);
        else return 0;
      }
      const { data, error } = await query;
      if (error) return 0;
      const sum = (data ?? []).reduce((s, r) => s + Math.abs(Number(r.amount)), 0);
      return sum;
    },
    enabled: !!session?.user?.id && hasRealData,
  });

  // Fetch entities from Supabase
  const { data: entities = [], isLoading: entitiesLoading } = useQuery({
    queryKey: ['entities', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching entities:', error);
        throw error;
      }

      return data.map(entity => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        description: entity.description || '',
        taxIdentifier: entity.tax_identifier || '',
        countryOfResidence: entity.country_of_residence,
        dateAdded: entity.date_added,
        dateOfBirth: entity.date_of_birth || '',
        registrationNumber: entity.registration_number || '',
        incorporationDate: entity.incorporation_date || '',
      })) as (FamilyMember | BusinessEntity)[];
    },
    enabled: !!session?.user,
  });

  if (isEmpty) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            title="See where your money goes"
            description="Import your first bank statement and watch your finances come to life. It takes about 30 seconds."
            primaryAction={{
              label: "Import bank statement",
              onClick: () => navigate("/transactions?openUpload=1"),
            }}
            secondaryAction={{
              label: "Or add one by hand",
              onClick: () => navigate("/transactions?openManual=1"),
            }}
            icon={<Upload className="h-12 w-12" />}
            className="min-h-[60vh]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-text">Your money at a glance</h1>
                  <p className="text-text-muted">Track your spending and savings</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Global Currency Selector - only when we have data */}
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Display Currency</span>
                  <CurrencySelector
                    displayCurrency={displayCurrency}
                    onCurrencyChange={setDisplayCurrency}
                    variant="compact"
                  />
                </div>
              </div>
              
              {/* Entity Filter - only when multiple entities */}
              {entities.length > 1 && (
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">View</span>
                  <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                    <SelectTrigger className="w-[180px]" data-testid="dashboard-entity-filter">
                      <SelectValue placeholder="Filter by entity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {entitiesLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : (
                        entities.map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {isRatesLoading && (
            <Card className="p-3 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700" />
                <span className="text-sm">Updating exchange rates...</span>
              </div>
            </Card>
          )}
          
        </header>

        <Card className="p-4">
          <h2 className="text-sm font-medium text-muted-foreground">This week</h2>
          <p className="text-2xl font-semibold mt-1">
            {weekSpending > 0
              ? `You spent ${new Intl.NumberFormat(undefined, { style: "currency", currency: displayCurrency }).format(weekSpending)}`
              : "No spending recorded this week."}
          </p>
        </Card>

        <NetWorthWidget entityId={selectedEntityType === "all" ? undefined : selectedEntityType} />

        <Card className="p-6">
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transactions" data-testid="dashboard-tab-transactions">Transactions</TabsTrigger>
              <TabsTrigger value="budget" data-testid="dashboard-tab-budget">Budget</TabsTrigger>
              <TabsTrigger value="cash-flow" data-testid="dashboard-tab-cash-flow">Cash Flow</TabsTrigger>
              <TabsTrigger value="categories" data-testid="dashboard-tab-categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="mt-6">
              <div className="bg-white rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Recent Transactions
                  <span className="text-sm text-muted-foreground">({displayCurrency})</span>
                  {selectedEntityType !== "all" && (
                    <span className="text-sm text-blue-600">
                      - {entities.find(e => e.id === selectedEntityType)?.name}
                    </span>
                  )}
                </h3>
                <TransactionList
                  entityId={selectedEntityType === "all" ? undefined : selectedEntityType}
                  showBalance={false}
                  readOnly={true}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="budget" className="mt-6">
              <IncomeExpenseAnalysis entityId={selectedEntityType === "all" ? undefined : selectedEntityType} />
            </TabsContent>
            
            <TabsContent value="cash-flow" className="mt-6">
              <div className="bg-white rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  Monthly Cash Flow
                  <span className="text-sm text-muted-foreground">({displayCurrency})</span>
                  {selectedEntityType !== "all" && (
                    <span className="text-sm text-blue-600">
                      - {entities.find(e => e.id === selectedEntityType)?.name}
                    </span>
                  )}
                </h3>
                <CashFlowChart entityId={selectedEntityType === "all" ? undefined : selectedEntityType} />
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="bg-white rounded-lg">
                <CategoryPieChart entityId={selectedEntityType === "all" ? undefined : selectedEntityType} />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
