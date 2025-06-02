
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface SearchFilters {
  searchTerm: string;
  category: string;
  dateRange: string;
  amountRange: string;
}

interface TransactionSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  totalResults: number;
}

export const TransactionSearch = ({ onFiltersChange, totalResults }: TransactionSearchProps) => {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: "",
    category: "",
    dateRange: "",
    amountRange: ""
  });

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      searchTerm: "",
      category: "",
      dateRange: "",
      amountRange: ""
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <div className="space-y-4 p-4 border-b">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search transactions by description..."
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pl-10"
          />
        </div>
        
        <Select value={filters.category || "all"} onValueChange={(value) => updateFilters({ category: value === "all" ? "" : value })}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Food & Dining">Food & Dining</SelectItem>
            <SelectItem value="Transportation">Transportation</SelectItem>
            <SelectItem value="Shopping">Shopping</SelectItem>
            <SelectItem value="Bills & Utilities">Bills & Utilities</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Entertainment">Entertainment</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.dateRange || "all"} onValueChange={(value) => updateFilters({ dateRange: value === "all" ? "" : value })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.amountRange || "all"} onValueChange={(value) => updateFilters({ amountRange: value === "all" ? "" : value })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Amount" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Amounts</SelectItem>
            <SelectItem value="income">Income Only</SelectItem>
            <SelectItem value="expense">Expenses Only</SelectItem>
            <SelectItem value="small">Under $100</SelectItem>
            <SelectItem value="medium">$100 - $1000</SelectItem>
            <SelectItem value="large">Over $1000</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalResults} transaction{totalResults !== 1 ? 's' : ''} found
        </span>
        {hasActiveFilters && (
          <div className="flex gap-1">
            {filters.searchTerm && (
              <Badge variant="secondary" className="text-xs">
                "{filters.searchTerm}"
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="text-xs">
                {filters.category}
              </Badge>
            )}
            {filters.dateRange && (
              <Badge variant="secondary" className="text-xs">
                {filters.dateRange}
              </Badge>
            )}
            {filters.amountRange && (
              <Badge variant="secondary" className="text-xs">
                {filters.amountRange}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
