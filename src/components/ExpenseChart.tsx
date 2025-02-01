import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
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

export const ExpenseChart = () => {
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  const { data: exchangeRates, isLoading } = useQuery({
    queryKey: ["exchangeRates", displayCurrency],
    queryFn: () => fetchExchangeRates(displayCurrency),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const convertedData = originalData.map(item => ({
    ...item,
    value: exchangeRates 
      ? item.value / exchangeRates[item.currency] * exchangeRates[displayCurrency]
      : item.value
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
            data={convertedData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {convertedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};