
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import ImportTransactions from "./ImportTransactions"
import { TransactionList } from "@/components/TransactionList"

const Transactions = () => {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Manage your transactions</p>
          </div>
          <Sheet open={isAddingTransaction} onOpenChange={setIsAddingTransaction}>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Transaction
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add New Transaction</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ImportTransactions onSuccess={() => setIsAddingTransaction(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <TransactionList />
      </div>
    </div>
  )
}

export default Transactions
