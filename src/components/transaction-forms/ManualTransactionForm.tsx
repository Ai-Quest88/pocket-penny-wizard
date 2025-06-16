
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { categories, currencies } from "@/types/transaction-forms"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import type { Transaction, ManualTransactionFormProps } from "@/types/transaction-forms"

export const ManualTransactionForm: React.FC<ManualTransactionFormProps> = ({ onTransactionAdded }) => {
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

  // Fetch cash/savings accounts with their associated entities
  const { data: accountsWithEntities = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts-with-entities', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

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
        console.error('Error fetching accounts:', assetsError);
        throw assetsError;
      }

      return assets.map(asset => ({
        id: asset.id,
        name: asset.name,
        type: asset.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        accountNumber: asset.account_number,
        entityName: asset.entities.name,
        entityType: asset.entities.type,
        currentBalance: Number(asset.value) // This will be calculated dynamically in the UI
      }));
    },
    enabled: !!session?.user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || !description || !category || !account) {
      return
    }

    setIsSubmitting(true)

    try {
      // Save transaction with account_id
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          description,
          amount: parseFloat(amount),
          category,
          date: format(date, 'yyyy-MM-dd'),
          currency,
          comment: comment || null,
          account_id: account // Use the account ID directly
        })
        .select();

      if (error) {
        console.error('Error inserting transaction:', error);
        throw error;
      }

      console.log("Successfully inserted transaction:", data);

      toast({
        title: "Success",
        description: "Transaction added successfully. Account balance will update automatically.",
      });

      // Invalidate account balances to trigger recalculation
      await queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Reset form
      setAmount('')
      setDescription('')
      setCategory('')
      setAccount('')
      setComment('')
      setDate(new Date())
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

  // Comprehensive filtering to prevent empty values
  const validCategories = categories.filter(cat => cat && typeof cat === 'string' && cat.trim() !== "");
  const validCurrencies = currencies.filter(curr => 
    curr && 
    curr.code && 
    typeof curr.code === 'string' && 
    curr.code.trim() !== "" &&
    curr.name &&
    typeof curr.name === 'string' &&
    curr.name.trim() !== ""
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Transaction
        </CardTitle>
        <CardDescription>
          Manually add a new transaction to your records. Account balances will update automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {validCategories.map((cat) => {
                    if (!cat || cat.trim() === "") {
                      return null;
                    }
                    return (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    );
                  })}
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
                  {validCurrencies.map((curr) => {
                    if (!curr.code || curr.code.trim() === "") {
                      return null;
                    }
                    return (
                      <SelectItem key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name}
                      </SelectItem>
                    );
                  })}
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
                {accountsWithEntities.length === 0 && !accountsLoading ? (
                  <SelectItem value="no-accounts" disabled>
                    No cash accounts found. Create accounts in Assets first.
                  </SelectItem>
                ) : (
                  accountsWithEntities.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} - {acc.entityName} ({acc.type})
                      {acc.accountNumber && ` - ${acc.accountNumber}`}
                      <span className="text-muted-foreground ml-2">
                        (Balance calculated from transactions)
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {accountsWithEntities.length === 0 && !accountsLoading && (
              <p className="text-sm text-muted-foreground">
                You need to create cash accounts under entities first. Go to Assets → Add Asset.
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
            <Button type="button" variant="outline" onClick={() => {
              setAmount('')
              setDescription('')
              setCategory('')
              setAccount('')
              setComment('')
              setDate(new Date())
            }}>
              Clear
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !amount || !description || !category || !account || accountsWithEntities.length === 0}
            >
              {isSubmitting ? 'Adding...' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
