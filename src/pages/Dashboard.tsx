import { TransactionList } from "@/components/TransactionList"
import { CashFlowChart } from "@/components/CashFlowChart"
import { NetWorthWidget } from "@/components/NetWorthWidget"
import { IncomeExpenseAnalysis } from "@/components/budgets/IncomeExpenseAnalysis"
import { CategoryPieChart } from "@/components/CategoryPieChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { HistoricalValueChart } from "@/components/assets-liabilities/HistoricalValueChart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CurrencySelector } from "@/components/transactions/CurrencySelector"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useAuth } from "@/contexts/AuthContext"
import { useState } from "react"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { Banknote, TrendingUp } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

const mockData = {
  assetHistory: [
    { date: "2024-01-01", value: 50000 },
    { date: "2024-02-01", value: 52000 },
    { date: "2024-03-01", value: 55000 },
  ],
  liabilityHistory: [
    { date: "2024-01-01", value: 20000 },
    { date: "2024-02-01", value: 19500 },
    { date: "2024-03-01", value: 19000 },
  ],
};

interface DashboardProps {
  entityId?: string;
}

const Dashboard = () => {
  const { displayCurrency, setDisplayCurrency, isRatesLoading } = useCurrency();
  const { session } = useAuth();
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");

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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold text-text">Financial Overview</h1>
                  <p className="text-text-muted">Track your spending and savings across currencies</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Global Currency Selector */}
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
              
              {/* Entity Filter */}
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Entity Filter</span>
                <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {entitiesLoading ? (
                      <SelectItem value="loading" disabled>Loading entities...</SelectItem>
                    ) : (
                      entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name} ({entity.type === 'individual' ? 'Individual' : 
                                         entity.type === 'company' ? 'Company' : 
                                         entity.type === 'trust' ? 'Trust' :
                                         entity.type === 'super_fund' ? 'Super Fund' : 'Other'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Currency Loading Indicator */}
          {isRatesLoading && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                <span className="text-sm">Updating exchange rates...</span>
              </div>
            </Card>
          )}
          
        </header>

        <NetWorthWidget entityId={selectedEntityType === "all" ? undefined : selectedEntityType} />

        <Card className="p-6">
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
              <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="historical">Net Worth History</TabsTrigger>
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

            <TabsContent value="historical" className="mt-6">
              <HistoricalValueChart 
                assetHistory={mockData.assetHistory}
                liabilityHistory={mockData.liabilityHistory}
                entityId={selectedEntityType === "all" ? undefined : selectedEntityType}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
