import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#8CA891", "#A8DADC", "#457B9D", "#E63946"];

const data = [
  { name: "Housing", value: 1200 },
  { name: "Food", value: 400 },
  { name: "Transport", value: 300 },
  { name: "Others", value: 500 },
];

export const ExpenseChart = () => {
  return (
    <Card className="p-6 h-[400px] animate-fadeIn">
      <h3 className="text-lg font-semibold text-text mb-4">Expense Breakdown</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};