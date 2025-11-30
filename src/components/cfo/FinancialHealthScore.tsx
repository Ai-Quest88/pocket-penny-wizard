import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";

interface FinancialHealthScoreProps {
  savingsRate: number;
  netWorth: number;
  activeGoals: number;
}

export const FinancialHealthScore = ({ savingsRate, netWorth, activeGoals }: FinancialHealthScoreProps) => {
  // Calculate health score (0-100)
  const savingsScore = Math.min(savingsRate * 2, 40); // Max 40 points
  const netWorthScore = netWorth > 0 ? Math.min(30, 30) : 0; // Max 30 points
  const goalsScore = Math.min(activeGoals * 10, 30); // Max 30 points

  const totalScore = Math.round(savingsScore + netWorthScore + goalsScore);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Financial Health Score
        </CardTitle>
        <CardDescription>
          Your overall financial wellness based on savings, net worth, and goal tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-4xl font-bold ${getScoreColor(totalScore)}`}>
                {totalScore}/100
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getScoreLabel(totalScore)}
              </p>
            </div>
            <div className="text-right text-sm">
              <div className="space-y-1">
                <div>Savings: {Math.round(savingsScore)}/40</div>
                <div>Net Worth: {Math.round(netWorthScore)}/30</div>
                <div>Goals: {Math.round(goalsScore)}/30</div>
              </div>
            </div>
          </div>

          <Progress value={totalScore} className="h-3" />

          <div className="text-sm text-muted-foreground space-y-1">
            {totalScore < 80 && (
              <ul className="list-disc list-inside space-y-1">
                {savingsRate < 20 && (
                  <li>Increase your savings rate to 15-20% to improve your score</li>
                )}
                {netWorth <= 0 && (
                  <li>Focus on building positive net worth by reducing debts and growing assets</li>
                )}
                {activeGoals < 3 && (
                  <li>Set clear financial goals to track your progress</li>
                )}
              </ul>
            )}
            {totalScore >= 80 && (
              <p className="text-green-600 dark:text-green-400">
                ✓ You're doing great! Keep maintaining these healthy financial habits.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};