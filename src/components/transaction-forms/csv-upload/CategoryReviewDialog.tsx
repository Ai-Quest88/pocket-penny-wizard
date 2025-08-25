import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Brain, CheckCircle, AlertCircle, Clock, HelpCircle } from "lucide-react";
import { addUserCategoryRule } from "@/utils/transactionCategories";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useCategories } from "@/hooks/useCategories";

interface Transaction {
  description: string;
  amount: number;
  date: string;
  currency: string;
  category: string;
  category_id?: string | null;
  user_id: string;
  asset_account_id?: string | null;
  liability_account_id?: string | null;
  aiConfidence?: number;
}

interface TransactionReview extends Transaction {
  originalIndex: number;
  userCategory?: string;
  createRule?: boolean;
}

interface CategoryReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  onConfirm: (reviewedTransactions: Transaction[], shouldCreateRules?: boolean) => void;
  isApplying?: boolean;
}

export const CategoryReviewDialog = ({ 
  open, 
  onOpenChange, 
  transactions, 
  onConfirm, 
  isApplying = false 
}: CategoryReviewDialogProps) => {
  const { session } = useAuth();
  const { categoryData } = useCategories();
  const [reviewedTransactions, setReviewedTransactions] = useState<TransactionReview[]>(() => 
    transactions.map((transaction, index) => ({
      ...transaction,
      originalIndex: index,
      userCategory: transaction.category,
      createRule: transaction.category === 'Uncategorized' // Default to true for uncategorized
    }))
  );

  // Fetch user's categories from database
  const { data: userCategories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['user-categories', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      console.log('Fetching categories for user:', session.user.id);
      
      const { data: cats, error } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', session.user.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      console.log('Fetched categories:', cats);
      return (cats || []).map((cat: any) => cat.name);
    },
    enabled: !!session?.user && open,
  });

  // Note: Categories are now created by AI discovery during upload process

  // Helper to get category hierarchy components from transaction category name
  const getCategoryComponents = (transaction: Transaction) => {
    const categoryName = transaction.category || 'Uncategorized';
    
    if (!categoryData || categoryName === 'Uncategorized') {
      return {
        group: 'Uncategorized',
        bucket: 'Uncategorized', 
        category: categoryName
      };
    }
    
    // Search through all category groups to find the hierarchy for this category name
    for (const groupArray of Object.values(categoryData)) {
      for (const group of groupArray) {
        for (const bucket of group.buckets || []) {
          for (const category of bucket.categories || []) {
            if (category.name === categoryName) {
              return {
                group: group.name,
                bucket: bucket.name,
                category: category.name
              };
            }
          }
        }
      }
    }
    
    // If category exists but not found in hierarchy, show category name with AI suggestion
    return {
      group: 'Will be organized by AI',
      bucket: 'Will be organized by AI',
      category: categoryName
    };
  };

  // Use user's categories if available, include uncategorized
  const validCategories = userCategories.length > 0 
    ? [...userCategories, 'Uncategorized']
    : ['Uncategorized'];

  console.log('User categories:', userCategories);
  console.log('Valid categories for dropdown:', validCategories);
  console.log('Categories loading:', categoriesLoading);
  console.log('Categories error:', categoriesError);
  console.log('Sample transaction category:', reviewedTransactions[0]?.category);
  console.log('Sample transaction userCategory:', reviewedTransactions[0]?.userCategory);

  // If no categories found and not loading, offer to seed
  const shouldOfferSeeding = !categoriesLoading && userCategories.length === 0 && !categoriesError;

  const handleCategoryChange = (index: number, category: string) => {
    setReviewedTransactions(prev => 
      prev.map((t, i) => 
        i === index 
          ? { 
              ...t, 
              userCategory: category,
              createRule: category !== 'Uncategorized' // Auto-enable rule creation for categorized items
            } 
          : t
      )
    );
  };

  const handleRuleToggle = (index: number, createRule: boolean) => {
    setReviewedTransactions(prev => 
      prev.map((t, i) => 
        i === index ? { ...t, createRule } : t
      )
    );
  };

  const handleConfirm = () => {
    // Convert reviewed transactions to final format
    const finalTransactions = reviewedTransactions.map(transaction => ({
      ...transaction,
      userCategory: transaction.userCategory || transaction.category,
    }));

    // Check if any rules should be created
    const shouldCreateRules = reviewedTransactions.some(t => t.createRule);

    console.log('CategoryReviewDialog confirming:', {
      transactionCount: finalTransactions.length,
      shouldCreateRules,
      changedCategories: reviewedTransactions.filter(t => t.userCategory && t.userCategory !== t.category).length
    });

    onConfirm(finalTransactions, shouldCreateRules);
  };

  const categorizedCount = reviewedTransactions.filter(t => 
    (t.userCategory || t.category) !== 'Uncategorized'
  ).length;
  
  const uncategorizedCount = reviewedTransactions.length - categorizedCount;
  const rulesCount = reviewedTransactions.filter(t => t.createRule).length;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              Review AI Categorization
            </DialogTitle>
          </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Categories Warning */}
          {shouldOfferSeeding && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-yellow-900">No Categories Found</h3>
                  <p className="text-sm text-yellow-700">
                    You don't have any categories set up yet. Would you like to create default categories?
                  </p>
                </div>
                 <Button 
                   onClick={() => {
                     console.log('Seed categories functionality temporarily disabled');
                     // TODO: Implement seed categories functionality
                   }}
                   variant="outline" 
                   size="sm"
                   className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                   disabled
                 >
                   Create Categories (Coming Soon)
                 </Button>
              </div>
            </Card>
          )}

          {/* Summary */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-blue-900">Categorization Summary</h3>
                <div className="flex items-center gap-4 text-sm text-blue-700">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>{categorizedCount} categorized</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uncategorizedCount} need review</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    <span>{rulesCount} rules to create</span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary">
                {transactions.length} transactions
              </Badge>
            </div>
          </Card>

          {/* Transaction Table */}
          <div className="flex-1 border rounded-md">
            <ScrollArea className="h-[50vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 cursor-help">
                          Description
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The transaction description from your bank or financial institution</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="w-32">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 cursor-help">
                          Amount
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The transaction amount in your account's currency</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="w-32">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 cursor-help">
                          Date
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>When the transaction occurred</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                     <TableHead className="w-32">
                       <Tooltip>
                         <TooltipTrigger className="flex items-center gap-1 cursor-help">
                           AI Group
                           <HelpCircle className="h-3 w-3 text-muted-foreground" />
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>AI-suggested category group (highest level)</p>
                         </TooltipContent>
                       </Tooltip>
                     </TableHead>
                     <TableHead className="w-32">
                       <Tooltip>
                         <TooltipTrigger className="flex items-center gap-1 cursor-help">
                           AI Bucket
                           <HelpCircle className="h-3 w-3 text-muted-foreground" />
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>AI-suggested category bucket (middle level)</p>
                         </TooltipContent>
                       </Tooltip>
                     </TableHead>
                     <TableHead className="w-40">
                       <Tooltip>
                         <TooltipTrigger className="flex items-center gap-1 cursor-help">
                           AI Category
                           <HelpCircle className="h-3 w-3 text-muted-foreground" />
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>AI-suggested category (lowest level)</p>
                         </TooltipContent>
                       </Tooltip>
                     </TableHead>
                     <TableHead className="w-56">
                       <Tooltip>
                         <TooltipTrigger className="flex items-center gap-1 cursor-help">
                           Override Category
                           <HelpCircle className="h-3 w-3 text-muted-foreground" />
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Change the category if needed</p>
                         </TooltipContent>
                       </Tooltip>
                     </TableHead>
                    <TableHead className="w-24">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1 cursor-help">
                          Auto-Learn
                          <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Create a smart rule to automatically categorize similar future transactions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {reviewedTransactions.map((transaction, index) => {
                     const isUncategorized = (transaction.userCategory || transaction.category) === 'Uncategorized';
                     const categoryChanged = transaction.userCategory !== transaction.category;
                     const categoryComponents = getCategoryComponents(transaction);
                     
                     return (
                       <TableRow 
                         key={index} 
                         className={isUncategorized ? 'bg-amber-50' : 'bg-green-50'}
                       >
                         <TableCell>
                           <div className="space-y-1">
                             <div className="font-medium text-sm">{transaction.description}</div>
                             {categoryChanged && (
                               <div className="flex items-center gap-1 text-xs text-blue-600">
                                 <Clock className="h-3 w-3" />
                                 <span>Changed from "{transaction.category}"</span>
                               </div>
                             )}
                           </div>
                         </TableCell>
                         <TableCell className="text-right font-mono">
                           ${Math.abs(transaction.amount).toFixed(2)}
                         </TableCell>
                         <TableCell className="text-sm">
                           {new Date(transaction.date).toLocaleDateString()}
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             <Brain className="h-4 w-4 text-blue-500" />
                             <span className="text-sm font-medium text-blue-700">
                               {categoryComponents.group}
                             </span>
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-medium text-purple-700">
                               {categoryComponents.bucket}
                             </span>
                           </div>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-medium text-green-700">
                               {categoryComponents.category}
                             </span>
                             {transaction.aiConfidence && (
                               <Badge 
                                 variant={transaction.aiConfidence > 0.8 ? "default" : "secondary"}
                                 className="text-xs ml-2"
                               >
                                 {Math.round(transaction.aiConfidence * 100)}%
                               </Badge>
                             )}
                           </div>
                         </TableCell>
                         <TableCell>
                           <Select
                             value={validCategories.includes(transaction.userCategory || transaction.category) 
                               ? (transaction.userCategory || transaction.category)
                               : 'Uncategorized'
                             }
                             onValueChange={(value) => handleCategoryChange(index, value)}
                           >
                             <SelectTrigger className="w-full h-8 bg-background border border-input">
                               <SelectValue placeholder="Override category" />
                             </SelectTrigger>
                             <SelectContent className="max-h-48 overflow-y-auto z-[100] bg-background border border-input">
                               {validCategories.map((category) => (
                                 <SelectItem key={category} value={category}>
                                   {category}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </TableCell>
                        <TableCell>
                          {(transaction.userCategory || transaction.category) !== 'Uncategorized' && (
                            <div className="flex items-center justify-center">
                              <Checkbox
                                id={`rule-${index}`}
                                checked={transaction.createRule || false}
                                onCheckedChange={(checked) => handleRuleToggle(index, checked as boolean)}
                                title="Create rule for similar transactions"
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {uncategorizedCount > 0 ? (
                <span className="text-amber-600">
                  {uncategorizedCount} transaction{uncategorizedCount !== 1 ? 's' : ''} still need{uncategorizedCount === 1 ? 's' : ''} categorization
                </span>
              ) : (
                <span className="text-green-600">All transactions are categorized!</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isApplying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isApplying}
                className="min-w-[120px]"
              >
                {isApplying ? "Processing..." : "Accept & Upload"}
              </Button>
            </div>
          </div>
        </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};