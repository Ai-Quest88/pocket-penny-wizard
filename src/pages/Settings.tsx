import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

export default function Settings() {
  const { toast } = useToast()
  const { session } = useAuth()
  const [resetConfirmation, setResetConfirmation] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  const handleSave = () => {
    toast({
      title: "Success",
      description: "Settings saved successfully",
    })
  }

  const handleDatabaseReset = async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to reset data",
        variant: "destructive",
      })
      return
    }

    if (resetConfirmation !== "RESET ALL DATA") {
      toast({
        title: "Error",
        description: "Please type 'RESET ALL DATA' to confirm",
        variant: "destructive",
      })
      return
    }

    setIsResetting(true)
    
    try {
      // Check if user has any data before reset
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)

      const { data: assets } = await supabase
        .from('assets')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)

      const { data: liabilities } = await supabase
        .from('liabilities')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)

      if (!transactions?.length && !assets?.length && !liabilities?.length) {
        toast({
          title: "Info",
          description: "No data found to reset",
        })
        setIsResetting(false)
        setResetConfirmation("")
        return
      }

      // Perform reset operations in correct order (due to foreign key constraints)
      const resetOperations = [
        // Delete transactions first (they reference other tables)
        supabase.from('transactions').delete().eq('user_id', session.user.id),
        
        // Delete budgets
        supabase.from('budgets').delete().eq('user_id', session.user.id),
        
        // Delete notifications
        supabase.from('notifications').delete().eq('user_id', session.user.id),
        
        // Delete assets and liabilities
        supabase.from('assets').delete().eq('user_id', session.user.id),
        supabase.from('liabilities').delete().eq('user_id', session.user.id),
        
        // Delete accounts
        supabase.from('accounts').delete().eq('user_id', session.user.id),
        
        // Delete categories and related data
        supabase.from('category_buckets').delete().eq('user_id', session.user.id),
        supabase.from('categories').delete().eq('user_id', session.user.id),
        supabase.from('category_groups').delete().eq('user_id', session.user.id),
        
        // Delete entities and households last
        supabase.from('entities').delete().eq('user_id', session.user.id),
        supabase.from('households').delete().eq('owner_id', session.user.id),
      ]

      // Execute all reset operations
      for (const operation of resetOperations) {
        const { error } = await operation
        if (error) {
          console.error('Reset operation failed:', error)
          // Continue with other operations even if one fails
        }
      }

      toast({
        title: "Success",
        description: "All user data has been reset successfully",
      })
      
      // Reload the page to reflect changes
      window.location.reload()
      
    } catch (error) {
      console.error('Database reset error:', error)
      toast({
        title: "Error",
        description: "Failed to reset database. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
      setResetConfirmation("")
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="grid gap-6 max-w-2xl">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" placeholder="Your name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your account
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications about your account
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Currency Settings</h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Input id="currency" placeholder="USD" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-destructive/50">
          <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-destructive font-medium">Reset All Data</Label>
              <p className="text-sm text-muted-foreground">
                This will permanently delete ALL your data including transactions, accounts, assets, liabilities, budgets, and categories. This action cannot be undone.
              </p>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action will permanently delete ALL your financial data including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All transactions and transaction history</li>
                      <li>All accounts, assets, and liabilities</li>
                      <li>All budgets and financial goals</li>
                      <li>All categories and classification rules</li>
                      <li>All entities and households</li>
                      <li>All notifications and settings</li>
                    </ul>
                    <p className="font-semibold text-destructive">
                      This action cannot be undone and your data cannot be recovered.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="resetConfirm">Type "RESET ALL DATA" to confirm:</Label>
                      <Input
                        id="resetConfirm"
                        value={resetConfirmation}
                        onChange={(e) => setResetConfirmation(e.target.value)}
                        placeholder="RESET ALL DATA"
                        className="font-mono"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setResetConfirmation("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDatabaseReset}
                    disabled={resetConfirmation !== "RESET ALL DATA" || isResetting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isResetting ? "Resetting..." : "Reset All Data"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        <Button onClick={handleSave} className="w-full md:w-auto">
          Save Changes
        </Button>
      </div>
    </div>
  )
}