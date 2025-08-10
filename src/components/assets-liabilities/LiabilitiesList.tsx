import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Liability } from "@/types/assets-liabilities"
import { useState, useEffect } from "react"
import { FamilyMember, BusinessEntity } from "@/types/entities"
import { EditLiabilityDialog } from "./EditLiabilityDialog"
import { Trash2, Link, CreditCard, Building2, DollarSign, Percent } from "lucide-react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { AccountTypeIndicator } from "@/components/accounts/AccountTypeIndicator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LiabilitiesListProps {
  liabilities: Liability[]
  onEditLiability?: (id: string, updatedLiability: Omit<Liability, "id">) => void
  onDeleteLiability?: (id: string) => void
}

export function LiabilitiesList({ liabilities, onEditLiability, onDeleteLiability }: LiabilitiesListProps) {
  const [entities, setEntities] = useState<(FamilyMember | BusinessEntity)[]>([])
  const { formatCurrency } = useCurrency()

  useEffect(() => {
    const savedEntities = localStorage.getItem('entities')
    if (savedEntities) {
      setEntities(JSON.parse(savedEntities))
    }
  }, [])

  const formatCategory = (category: string) => {
    return category.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
  }

  const getEntityName = (entityId: string) => {
    const entity = entities.find(e => e.id === entityId)
    return entity ? entity.name : entityId
  }

  const isTransactionalAccount = (category: string) => {
    return ['credit_card'].includes(category)
  }

  const getCreditUtilization = (amount: number, creditLimit: number) => {
    return (amount / creditLimit) * 100
  }

  return (
    <div className="space-y-6">
      {/* Credit Accounts Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold">Credit Accounts</h3>
          <Badge variant="outline" className="text-xs">
            Can link to transactions
          </Badge>
        </div>
        <div className="grid gap-4">
          {liabilities.filter(liability => isTransactionalAccount(liability.category)).map((liability) => (
            <Card key={liability.id} className="p-4 border-l-4 border-l-red-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{liability.name}</h3>
                    <div className="flex items-center">
                      <Link className="h-4 w-4 text-red-600" />
                      <span className="sr-only">Linked to transactions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <AccountTypeIndicator 
                      type={liability.type} 
                      category={liability.category}
                      accountType="liability"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">{getEntityName(liability.entityId)}</span>
                    </div>
                    {liability.accountNumber && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Account: {liability.accountNumber}</span>
                      </div>
                    )}
                    {liability.creditLimit && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Credit Utilization</span>
                          <span className="font-medium">{getCreditUtilization(liability.amount, liability.creditLimit).toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={getCreditUtilization(liability.amount, liability.creditLimit)} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Available: {formatCurrency(liability.creditLimit - liability.amount)}</span>
                          <span>Limit: {formatCurrency(liability.creditLimit)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onEditLiability && (
                    <EditLiabilityDialog 
                      liability={liability} 
                      onEditLiability={onEditLiability}
                    />
                  )}
                  {onDeleteLiability && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Liability</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{liability.name}"? This action cannot be undone and will affect transaction history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteLiability(liability.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(liability.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {liability.creditLimit ? "Outstanding" : "Total Owed"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Loan Liabilities Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Loans & Mortgages</h3>
        </div>
        <div className="grid gap-4">
          {liabilities.filter(liability => liability.type === 'loan' || liability.type === 'mortgage').map((liability) => (
            <Card key={liability.id} className="p-4 border-l-4 border-l-orange-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{liability.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <AccountTypeIndicator 
                      type={liability.type} 
                      category={liability.category}
                      accountType="liability"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">{getEntityName(liability.entityId)}</span>
                    </div>
                    {liability.interestRate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Percent className="h-3 w-3" />
                        <span>Interest Rate: {liability.interestRate}%</span>
                      </div>
                    )}
                    {liability.monthlyPayment && (
                      <div className="text-sm text-muted-foreground">
                        Monthly Payment: {formatCurrency(liability.monthlyPayment)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onEditLiability && (
                    <EditLiabilityDialog 
                      liability={liability} 
                      onEditLiability={onEditLiability}
                    />
                  )}
                  {onDeleteLiability && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Liability</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{liability.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteLiability(liability.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(liability.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Other Liabilities Section */}
      {liabilities.filter(liability => !['credit', 'loan', 'mortgage'].includes(liability.type)).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Other Liabilities</h3>
          </div>
          <div className="grid gap-4">
            {liabilities.filter(liability => !['credit', 'loan', 'mortgage'].includes(liability.type)).map((liability) => (
              <Card key={liability.id} className="p-4 border-l-4 border-l-gray-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{liability.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <AccountTypeIndicator 
                        type={liability.type} 
                        category={liability.category}
                        accountType="liability"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="font-medium">{getEntityName(liability.entityId)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onEditLiability && (
                      <EditLiabilityDialog 
                        liability={liability} 
                        onEditLiability={onEditLiability}
                      />
                    )}
                    {onDeleteLiability && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Liability</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{liability.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteLiability(liability.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-red-600">
                        {formatCurrency(liability.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Amount Owed</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
