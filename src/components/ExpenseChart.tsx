import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchExchangeRates } from "@/utils/currencyUtils";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#8CA891", "#A8DADC", "#457B9D", "#E63946"];

const originalData = [
  { name: "Housing", value: 1200, currency: "USD" },
  { name: "Food", value: 400, currency: "EUR" },
  { name: "Transport", value: 300, currency: "GBP" },
  { name: "Others", value: 500, currency: "USD" },
];

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥"
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const totalValue = payload[0].payload.total;
    const percentage = ((data.value / totalValue) * 100).toFixed(1);
    
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {percentage}% ({currencySymbols[data.displayCurrency]}{data.value.toFixed(2)})
        </p>
      </div>
    );
  }
  return null;
};

export const ExpenseChart = () => {
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  const { data: exchangeRates, isLoading } = useQuery({
    queryKey: ["exchangeRates", displayCurrency],
    queryFn: () => fetchExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const convertedData = originalData.map(item => ({
    ...item,
    displayCurrency,
    value: exchangeRates 
      ? item.value / exchangeRates[item.currency] * exchangeRates[displayCurrency]
      : item.value
  }));

  // Calculate total for percentage calculations
  const total = convertedData.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = convertedData.map(item => ({
    ...item,
    total // Add total to each item for tooltip access
  }));

  return (
    <Card className="p-6 h-[400px] animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text">
          Expense Breakdown ({currencySymbols[displayCurrency]}{displayCurrency})
        </h3>
        <div className="w-32">
          <Select
            value={displayCurrency}
            onValueChange={setDisplayCurrency}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(currencySymbols).map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currencySymbols[currency]} {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {dataWithTotal.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};