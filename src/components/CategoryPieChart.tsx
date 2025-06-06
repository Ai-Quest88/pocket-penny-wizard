
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { useState } from "react"
import { categoryBuckets } from "@/types/transaction-forms"

interface CategoryPieChartProps {
  entityId?: string;
}

// Finance-themed color palette
const FINANCE_COLORS = {
  // Expense categories (warmer tones)
  livingExpenses: "#DC2626", // Red - essential expenses
  lifestyle: "#EA580C", // Orange - discretionary spending
  financial: "#0891B2", // Blue - financial activities
  other: "#7C3AED", // Purple - miscellaneous
  
  // Subcategory variations
  food: "#DC2626",
  transport: "#B91C1C", 
  bills: "#991B1B",
  shopping: "#7F1D1D",
  entertainment: "#EA580C",
  health: "#C2410C",
  travel: "#9A3412",
  education: "#7C2D12",
  income: "#059669", // Green - positive income
  banking: "#0891B2",
  investment: "#0E7490",
  insurance: "#155E75",
  gifts: "#7C3AED",
  charity: "#6D28D9",
}

// Mock data for demonstration - in real app this would come from transactions
const getMockDataForPeriod = (period: string) => {
  const baseData = [
    { name: "Living Expenses", value: 4200, color: FINANCE_COLORS.livingExpenses },
    { name: "Lifestyle", value: 2800, color: FINANCE_COLORS.lifestyle },
    { name: "Financial", value: 3500, color: FINANCE_COLORS.financial },
    { name: "Other", value: 1200, color: FINANCE_COLORS.other },
  ];

  // Adjust values based on period for demo
  if (period === "yearly") {
    return baseData.map(item => ({
      ...item,
      value: item.value * 12
    }));
  }

  return baseData;
};

const getCategoryBreakdown = (period: string) => {
  // Mock category breakdown data with finance-themed colors
  const breakdown = [
    { name: "Food", value: 1800, bucket: "Living Expenses", color: FINANCE_COLORS.food },
    { name: "Transport", value: 1200, bucket: "Living Expenses", color: FINANCE_COLORS.transport },
    { name: "Bills", value: 800, bucket: "Living Expenses", color: FINANCE_COLORS.bills },
    { name: "Shopping", value: 400, bucket: "Living Expenses", color: FINANCE_COLORS.shopping },
    { name: "Entertainment", value: 1200, bucket: "Lifestyle", color: FINANCE_COLORS.entertainment },
    { name: "Health", value: 600, bucket: "Lifestyle", color: FINANCE_COLORS.health },
    { name: "Travel", value: 800, bucket: "Lifestyle", color: FINANCE_COLORS.travel },
    { name: "Education", value: 200, bucket: "Lifestyle", color: FINANCE_COLORS.education },
    { name: "Income", value: 2000, bucket: "Financial", color: FINANCE_COLORS.income },
    { name: "Banking", value: 800, bucket: "Financial", color: FINANCE_COLORS.banking },
    { name: "Investment", value: 500, bucket: "Financial", color: FINANCE_COLORS.investment },
    { name: "Insurance", value: 200, bucket: "Financial", color: FINANCE_COLORS.insurance },
    { name: "Gifts", value: 600, bucket: "Other", color: FINANCE_COLORS.gifts },
    { name: "Charity", value: 600, bucket: "Other", color: FINANCE_COLORS.charity },
  ];

  if (period === "yearly") {
    return breakdown.map(item => ({
      ...item,
      value: item.value * 12
    }));
  }

  return breakdown;
};

export const CategoryPieChart = ({ entityId }: CategoryPieChartProps) => {
  const [timeFrame, setTimeFrame] = useState<string>("monthly")
  const [viewType, setViewType] = useState<string>("buckets")

  const bucketData = getMockDataForPeriod(timeFrame);
  const categoryData = getCategoryBreakdown(timeFrame);

  const chartData = viewType === "buckets" ? bucketData : categoryData;

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Category Breakdown</h3>
        <div className="flex gap-2">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="View type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buckets">Buckets</SelectItem>
              <SelectItem value="categories">Categories</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <Card className="p-3 border bg-background shadow-lg">
                      <p className="font-medium text-foreground">{data.name}</p>
                      {data.bucket && (
                        <p className="text-sm text-muted-foreground">Bucket: {data.bucket}</p>
                      )}
                      <p className="text-sm font-semibold">
                        ${data.value.toLocaleString()}
                      </p>
                    </Card>
                  )
                }
                return null
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
