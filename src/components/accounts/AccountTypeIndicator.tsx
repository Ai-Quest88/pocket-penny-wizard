import { Badge } from "@/components/ui/badge"
import { Banknote, CreditCard, PiggyBank, TrendingUp, Building2, Car, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountTypeIndicatorProps {
  type: string
  category?: string
  accountType: 'asset' | 'liability'
  className?: string
}

export function AccountTypeIndicator({ type, category, accountType, className }: AccountTypeIndicatorProps) {
  const getIcon = () => {
    if (accountType === 'liability') {
      return <CreditCard className="h-3 w-3" />
    }
    
    switch (category) {
      case 'savings_account':
        return <PiggyBank className="h-3 w-3" />
      case 'checking_account':
        return <Banknote className="h-3 w-3" />
      case 'term_deposit':
        return <TrendingUp className="h-3 w-3" />
      case 'stocks':
      case 'bonds':
      case 'mutual_funds':
        return <TrendingUp className="h-3 w-3" />
      case 'residential':
      case 'commercial':
        return <Home className="h-3 w-3" />
      case 'car':
      case 'motorcycle':
        return <Car className="h-3 w-3" />
      default:
        return <Building2 className="h-3 w-3" />
    }
  }

  const getVariant = () => {
    if (accountType === 'liability') return 'destructive'
    
    switch (category) {
      case 'savings_account':
      case 'checking_account':
      case 'term_deposit':
        return 'default'
      case 'stocks':
      case 'bonds':
      case 'mutual_funds':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const isTransactional = ['savings_account', 'checking_account'].includes(category || '')

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={getVariant()} className="flex items-center gap-1">
        {getIcon()}
        {type}
      </Badge>
      {isTransactional && (
        <Badge variant="outline" className="text-xs">
          Transactional
        </Badge>
      )}
    </div>
  )
}