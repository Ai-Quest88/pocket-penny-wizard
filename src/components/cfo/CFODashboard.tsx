import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialHealthScore } from "./FinancialHealthScore";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Target, Brain } from "lucide-react";

export const CFODashboard = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['cfo-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_financial_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const knowledge = profile?.knowledge_document || {};

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const savingsRate = parseFloat(knowledge.spendingBehavior?.savingsRate || '0');
  const netWorth = knowledge.financialPosition?.netWorth || 0;
  const monthlyIncome = knowledge.spendingBehavior?.averageMonthlyIncome || 0;
  const monthlyExpenses = knowledge.spendingBehavior?.averageMonthlyExpenses || 0;

  return (
    <div className="space-y-6">
      <FinancialHealthScore 
        savingsRate={savingsRate}
        netWorth={netWorth}
        activeGoals={knowledge.activeGoals?.length || 0}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${netWorth.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Assets minus liabilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
            {savingsRate > 15 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {savingsRate > 15 ? 'Excellent!' : 'Could be improved'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {knowledge.activeGoals?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Financial goals tracking
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Your Financial Personality
          </CardTitle>
          <CardDescription>Based on your spending patterns and behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">
                {profile?.spending_personality || 'Analyzing...'}
              </h4>
              <p className="text-sm text-muted-foreground">
                You have {knowledge.merchantKnowledge?.length || 0} learned merchant preferences 
                and {knowledge.recentLearnings?.length || 0} category corrections that help me 
                understand your financial habits better.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Monthly Income</span>
                <p className="font-semibold">${monthlyIncome.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Monthly Expenses</span>
                <p className="font-semibold">${monthlyExpenses.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};