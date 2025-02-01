import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { AccountManager } from "@/components/AccountManager"
import { useState } from "react"

const Accounts = () => {
  const [isAddingAccount, setIsAddingAccount] = useState(false)

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Accounts</h1>
            <p className="text-muted-foreground">Manage your financial accounts</p>
          </div>
          <Sheet open={isAddingAccount} onOpenChange={setIsAddingAccount}>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Account
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Add New Account</SheetTitle>
              </SheetHeader>
              <div className="mt-8">
                <AccountManager onAccountAdded={() => setIsAddingAccount(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </header>

        <AccountManager />
      </div>
    </div>
  )
}

export default Accounts