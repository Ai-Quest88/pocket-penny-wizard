import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { currencies } from "@/types/transaction-forms"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

interface ManualTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ManualTransactionDialog: React.FC<ManualTransactionDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [date, setDate] = useState<Date>(new Date())
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [account, setAccount] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { session } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch both assets and liabilities to create a combined accounts list
  const { data: allAccounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['all-accounts', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      // Fetch cash assets (savings, checking accounts)
      const { data: assets, error: assetsError } = await supabase
        .from('assets')
        .select(`
          id,
          name,
          type,
          category,
          account_number,
          value,
          entities!inner(
            id,
            name,
            type
          )
        `)
        .eq('user_id', session.user.id)
        .eq('type', 'cash')
        .in('category', ['savings_account', 'checking_account', 'term_deposit'])
        .order('name');

      if (assetsError) {
        console.error('Error fetching assets:', assetsError);
        throw assetsError;
      }

      // Fetch liabilities (credit cards, loans)
      const { data: liabilities, error: liabilitiesError } = await supabase
        .from('liabilities')
        .select(`
          id,
          name,
          type,
          category,
          account_number,
          amount,
          entities!inner(
            id,
            name,
            type
          )
        `)
        .eq('user_id', session.user.id)
        .order('name');

      if (liabilitiesError) {
        console.error('Error fetching liabilities:', liabilitiesError);
        throw liabilitiesError;
      }

      // Combine assets and liabilities into one list
      const combinedAccounts = [
        ...assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          accountNumber: asset.account_number,
          entityName: asset.entities?.[0]?.name || 'Unknown',
          entityType: asset.entities?.[0]?.type || 'Unknown',
          accountType: 'asset' as const,
          displayType: 'Asset'
        })),
        ...liabilities.map(liability => ({
          id: liability.id,
          name: liability.name,
          type: liability.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          accountNumber: liability.account_number,
          entityName: liability.entities?.[0]?.name || 'Unknown',
          entityType: liability.entities?.[0]?.type || 'Unknown',
          accountType: 'liability' as const,
          displayType: 'Liability'
        }))
      ];

      return combinedAccounts;
    },
    enabled: !!session?.user && open,
  });

  // Fetch user's categories from Supabase
  const { data: userCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['user-categories', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data: groups } = await supabase
        .from('category_groups')
        .select('id,key,name,sort_order')
        .order('sort_order', { ascending: true });

      const { data: buckets } = await supabase
        .from('category_buckets')
        .select('id,name,group_id,sort_order')
        .eq('user_id', session.user.id)
        .order('sort_order', { ascending: true });

      const { data: cats } = await supabase
        .from('categories')
        .select('id,name,bucket_id,is_transfer,sort_order')
        .eq('user_id', session.user.id)
        .order('sort_order', { ascending: true });

      // Flatten all categories into a simple array
      const allCategories: string[] = [];
      (cats || []).forEach((cat: any) => {
        allCategories.push(cat.name);
      });

      return allCategories;
    },
    enabled: !!session?.user && open,
  });

  const resetForm = () => {
    setAmount('')
    setDescription('')
    setCategory('')
    setAccount('')
    setComment('')
    setDate(new Date())
    setCurrency('USD')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description || !category || !account) {
      return
    }

    setIsSubmitting(true)

    try {
      // Find the selected account to determine if it's an asset or liability
      const selectedAccount = allAccounts.find(acc => acc.id === account);
      
      if (!selectedAccount) {
        throw new Error('Selected account not found');
      }

      // Prepare transaction data with appropriate account field
      const transactionData = {
        user_id: session.user.id,
        description,
        amount: parseFloat(amount),
        category,
        date: format(date, 'yyyy-MM-dd'),
        currency,
        comment: comment || null,
        asset_account_id: selectedAccount.accountType === 'asset' ? account : null,
        liability_account_id: selectedAccount.accountType === 'liability' ? account : null
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select();

      if (error) {
        console.error('Error inserting transaction:', error);
        throw error;
      }

      console.log("Successfully inserted transaction:", data);

      toast({
        title: "Success",
        description: "Transaction added successfully.",
      });

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['assets'] });
      await queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      
      // Reset form and close dialog
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false)
    }
  }

  // Use user's categories if available, fallback to uncategorized
  const validCategories = userCategories.length > 0 
    ? userCategories
    : ['Uncategorized'];

  // Enhanced filtering with comprehensive validation for currencies
  const validCurrencies = currencies
    .filter(curr => {
      const isValid = curr && 
        curr.code && 
        curr.name &&
        typeof curr.code === 'string' && 
        typeof curr.name === 'string' &&
        curr.code.trim().length > 0 &&
        curr.name.trim().length > 0;
      
      if (!isValid) {
        console.warn("Filtering out invalid currency:", curr);
      }
      
      return isValid;
    })
    .map(curr => ({
      ...curr,
      code: curr.code.trim(),
      name: curr.name.trim()
    }))
    .filter(curr => curr.code.length > 0 && curr.name.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Transaction Manually
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Transaction description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category {categoriesLoading && '(Loading...)'}</Label>
              <Select value={category} onValueChange={setCategory} disabled={categoriesLoading} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {validCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {validCurrencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">Account *</Label>
            <Select value={account} onValueChange={setAccount} disabled={accountsLoading} required>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {allAccounts.length === 0 && !accountsLoading ? (
                  <SelectItem value="no-accounts" disabled>
                    No accounts found. Create accounts in Assets or Liabilities first.
                  </SelectItem>
                ) : (
                  allAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} - {acc.entityName} ({acc.type}) [{acc.displayType}]
                      {acc.accountNumber && ` - ${acc.accountNumber}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {allAccounts.length === 0 && !accountsLoading && (
              <p className="text-sm text-muted-foreground">
                You need to create accounts under Assets (savings, checking) or Liabilities (credit cards, loans) first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Additional notes about this transaction"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={resetForm}>
              Clear
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !amount || !description || !category || !account || allAccounts.length === 0}
            >
              {isSubmitting ? 'Adding...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}