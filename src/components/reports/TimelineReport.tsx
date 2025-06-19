
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { format } from "date-fns"
import { Search, Calendar, DollarSign, MessageCircle } from "lucide-react"
import { useState } from "react"

interface TimelineItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  comment?: string;
  type: 'income' | 'expense';
}

export function TimelineReport() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['timeline-report', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false })
        .limit(100);

      return (transactions || []).map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: Number(transaction.amount),
        category: transaction.category,
        comment: transaction.comment,
        type: Number(transaction.amount) >= 0 ? 'income' as const : 'expense' as const
      }));
    },
    enabled: !!session?.user,
  });

  const filteredData = timelineData?.filter(item =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.comment && item.comment.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Financial Timeline</h2>
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading timeline data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Financial Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Store financial memories including transactions with notes, images, and attachments.
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search transactions, categories, or comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
        </div>
      </Card>

      {/* Timeline Items */}
      <div className="space-y-4">
        {filteredData.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No timeline items found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try adjusting your search criteria or add some transactions to get started
            </p>
          </Card>
        ) : (
          filteredData.map((item) => (
            <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <DollarSign className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{item.description}</h4>
                      <p className="text-sm text-muted-foreground capitalize">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        item.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {item.comment && (
                    <div className="flex items-start gap-2 mt-3 p-3 bg-muted/30 rounded-lg">
                      <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{item.comment}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredData.length >= 100 && (
        <div className="text-center">
          <Button variant="outline">Load More Transactions</Button>
        </div>
      )}
    </div>
  );
}
