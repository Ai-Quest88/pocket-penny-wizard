import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, X, Edit2, Loader2 } from "lucide-react"
import { categories } from "@/types/transaction-forms"
import { ScrollArea } from "@/components/ui/scroll-area"

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
  const successRate = suggestions.length > 0 ? Math.round((categorizedCount / suggestions.length) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span>AI Categorization Results</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {categorizedCount}/{suggestions.length} categorized ({successRate}%)
              </Badge>
            </div>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Review and modify the AI suggestions below. You can change any category before applying.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-3 py-4">
            {modifiedSuggestions.map((suggestion) => {
              const finalCategory = suggestion.userCategory || suggestion.suggestedCategory
              const isModified = suggestion.userCategory && suggestion.userCategory !== suggestion.suggestedCategory
              const isUncategorized = finalCategory === 'Uncategorized'

              return (
                <Card key={suggestion.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{suggestion.description}</p>
                        <Badge variant="outline" className="text-xs">
                          ${Math.abs(suggestion.amount).toFixed(2)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-muted-foreground">From:</span>
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.originalCategory}
                        </Badge>
                        <span className="text-sm text-muted-foreground">→</span>
                        <Badge 
                          variant={isUncategorized ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {suggestion.suggestedCategory}
                        </Badge>
                        {isModified && (
                          <>
                            <Edit2 className="h-3 w-3 text-blue-500" />
                            <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                              Modified
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={finalCategory}
                        onValueChange={(value) => handleCategoryChange(suggestion.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {!isUncategorized && !isModified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
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
              {categorizedCount} will be categorized, {suggestions.length - categorizedCount} will remain uncategorized
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
                'Apply Changes'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}