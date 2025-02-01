import { Card } from "@/components/ui/card"
import { DashboardCard } from "./DashboardCard"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const dummyPropertiesData = [
  {
    id: 1,
    name: "Primary Residence",
    currentValue: 750000,
    previousValue: 720000,
    purchasePrice: 650000,
    purchaseDate: "2020-01-15",
    outstandingLoan: 520000,
    historicalValues: [
      { month: 'Jan', value: 720000 },
      { month: 'Feb', value: 725000 },
      { month: 'Mar', value: 728000 },
      { month: 'Apr', value: 735000 },
      { month: 'May', value: 742000 },
      { month: 'Jun', value: 750000 },
    ]
  },
  {
    id: 2,
    name: "Investment Property",
    currentValue: 450000,
    previousValue: 430000,
    purchasePrice: 380000,
    purchaseDate: "2021-03-20",
    outstandingLoan: 290000,
    historicalValues: [
      { month: 'Jan', value: 430000 },
      { month: 'Feb', value: 435000 },
      { month: 'Mar', value: 440000 },
      { month: 'Apr', value: 442000 },
      { month: 'May', value: 445000 },
      { month: 'Jun', value: 450000 },
    ]
  }
]

const colors = ["#2563eb", "#16a34a"]

export function PropertyValueEstimate() {
  const totalValue = dummyPropertiesData.reduce((sum, property) => sum + property.currentValue, 0)
  const previousTotalValue = dummyPropertiesData.reduce((sum, property) => sum + property.previousValue, 0)
  const valueChange = ((totalValue - previousTotalValue) / previousTotalValue) * 100

  // Combine historical values for all properties into one dataset
  const combinedHistoricalData = dummyPropertiesData[0].historicalValues.map((item, index) => {
    const dataPoint: any = { month: item.month }
    dummyPropertiesData.forEach((property, propertyIndex) => {
      dataPoint[property.name] = property.historicalValues[index].value
    })
    return dataPoint
  })

  return (
    <div className="space-y-6">
      <DashboardCard
        title="Total Property Value"
        value={`$${totalValue.toLocaleString()}`}
        trend={{
          value: Number(valueChange.toFixed(1)),
          isPositive: valueChange > 0
        }}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dummyPropertiesData.map((property, index) => {
          const equity = property.currentValue - property.outstandingLoan
          const equityPercentage = (equity / property.currentValue) * 100
          const appreciation = property.currentValue - property.purchasePrice
          const appreciationPercentage = (appreciation / property.purchasePrice) * 100

          return (
            <Card key={property.id} className="p-6 space-y-6">
              <h3 className="text-xl font-semibold">{property.name}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Purchase Price</h4>
                  <p className="text-lg font-semibold">${property.purchasePrice.toLocaleString()}</p>
                  <span className="text-sm text-muted-foreground">
                    Purchased on {new Date(property.purchaseDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Outstanding Loan</h4>
                  <p className="text-lg font-semibold text-red-600">
                    ${property.outstandingLoan.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Current Equity</h4>
                  <p className="text-lg font-semibold text-green-600">${equity.toLocaleString()}</p>
                  <span className="text-sm text-muted-foreground">{equityPercentage.toFixed(1)}% of property value</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Total Appreciation</h4>
                  <p className="text-lg font-semibold">
                    ${appreciation.toLocaleString()}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    {appreciationPercentage.toFixed(1)}% since purchase
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Value Trends</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedHistoricalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Legend />
              {dummyPropertiesData.map((property, index) => (
                <Line
                  key={property.id}
                  type="monotone"
                  dataKey={property.name}
                  stroke={colors[index]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}