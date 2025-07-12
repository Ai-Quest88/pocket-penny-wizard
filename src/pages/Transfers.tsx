import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Search } from "lucide-react"
import { useState } from "react"
import { TransferTransactionList } from "@/components/TransferTransactionList"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

const Transfers = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const { isAuthenticated, session } = useAuth()
  const navigate = useNavigate()

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Transfers</h1>
            </div>
            <p className="text-muted-foreground">
              Track and manage your transfer transactions - find potential internal transfers between accounts
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="text-sm">
                Transfer Category Only
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Internal Transfer Detection
              </Badge>
            </div>
          </div>
        </header>

        {/* Search and Filter Section */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transfer descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <ArrowLeftRight className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Internal Transfer Detection
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                This page shows all transactions categorized as "Transfer". Look for matching amounts and dates 
                to identify internal transfers between your accounts. Internal transfers should ideally have 
                corresponding debit and credit entries with the same amount.
              </p>
            </div>
          </div>
        </Card>

        {/* Custom Transaction List for Transfers */}
        <TransferTransactionList 
          searchTerm={searchTerm}
          dateFilter={dateFilter}
        />
      </div>
    </div>
  )
}

export default Transfers