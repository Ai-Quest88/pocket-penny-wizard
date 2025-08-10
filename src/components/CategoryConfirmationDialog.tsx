import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, X, Edit2, Loader2, Brain, AlertCircle, Sparkles } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"

interface CategorySuggestion {
  id: string
  description: string
  amount: number
  originalCategory: string
  suggestedCategory: string
  userCategory?: string
}

interface CategoryConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestions: CategorySuggestion[]
  onConfirm: (confirmedSuggestions: CategorySuggestion[]) => void
  isApplying: boolean
}

export const CategoryConfirmationDialog = ({
  open,
  onOpenChange,
  suggestions,
  onConfirm,
  isApplying
}: CategoryConfirmationDialogProps) => {
  const [modifiedSuggestions, setModifiedSuggestions] = useState<CategorySuggestion[]>(suggestions)
  const { session } = useAuth();

  // Fetch user's categories from database
  const { data: userCategories = [] } = useQuery({
    queryKey: ['user-categories', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data: cats } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', session.user.id)
        .order('sort_order', { ascending: true });

      return (cats || []).map((cat: any) => cat.name);
    },
    enabled: !!session?.user && open,
  });

  // Use user's categories if available, fallback to uncategorized
  const validCategories = userCategories.length > 0 
    ? userCategories.filter(cat => cat !== 'Uncategorized')
    : [];

  const handleCategoryChange = (transactionId: string, newCategory: string) => {
    setModifiedSuggestions(prev =>
      prev.map(suggestion =>
        suggestion.id === transactionId
          ? { ...suggestion, userCategory: newCategory }
          : suggestion
      )
    )
  }

  const handleConfirm = () => {
    onConfirm(modifiedSuggestions)
  }

  const categorizedCount = suggestions.filter(s => s.suggestedCategory !== 'Uncategorized').length
  const uncategorizedCount = suggestions.filter(s => s.suggestedCategory === 'Uncategorized').length
  const successRate = suggestions.length > 0 ? Math.round((categorizedCount / suggestions.length) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Categorization Results
          </DialogTitle>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">AI Analysis Complete</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {categorizedCount} successful, {uncategorizedCount} need review
                </p>
              </div>
              <Badge variant={successRate > 50 ? "default" : "secondary"}>
                {successRate}% Success
              </Badge>
            </div>

            {uncategorizedCount > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Rules Will Be Created</p>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Manual categorizations will create automatic rules for future transactions
                </p>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-3 py-4">
            {modifiedSuggestions.map((suggestion) => {
              const finalCategory = suggestion.userCategory || suggestion.suggestedCategory
              const isModified = suggestion.userCategory && suggestion.userCategory !== suggestion.suggestedCategory
              const isUncategorized = finalCategory === 'Uncategorized'

              return (
                <Card key={suggestion.id} className="p-4">
                  <div className="space-y-3">
                    {/* Transaction Details */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{suggestion.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            ${Math.abs(suggestion.amount).toFixed(2)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            ID: {suggestion.id.slice(-8)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* AI Suggestion Section */}
                    <div className={`rounded-lg p-3 border ${isUncategorized ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium text-foreground">AI Analysis Result:</p>
                          </div>
                          
                          {isUncategorized ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <Badge variant="secondary" className="text-sm">
                                  Could not categorize
                                </Badge>
                              </div>
                              <p className="text-xs text-amber-700 dark:text-amber-300">
                                Transaction pattern not recognized - manual categorization will create a rule
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <Badge variant="default" className="text-sm">
                                  {suggestion.suggestedCategory}
                                </Badge>
                              </div>
                              <p className="text-xs text-green-700 dark:text-green-300">
                                Successfully categorized by AI
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Category Selection */}
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">
                              {isUncategorized ? 'Select Category:' : 'Override Category:'}
                            </p>
                            <Select
                              value={finalCategory === 'Uncategorized' ? '' : finalCategory}
                              onValueChange={(value) => handleCategoryChange(suggestion.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder={isUncategorized ? "Choose category..." : "Change category..."} />
                              </SelectTrigger>
                              <SelectContent>
                                {validCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {!isUncategorized && !isModified && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {isModified && (
                            <div className="flex items-center gap-1">
                              <Edit2 className="h-4 w-4 text-blue-500" />
                              <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                                Modified
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between p-6 pt-0 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {uncategorizedCount > 0 && `${uncategorizedCount} transaction${uncategorizedCount > 1 ? 's' : ''} will create new rules`}
            </div>
            <Button
              onClick={handleConfirm}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Applying Changes...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Categories & Create Rules
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}