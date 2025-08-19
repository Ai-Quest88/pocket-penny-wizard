import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Brain, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface DiscoveredCategory {
  name: string;
  description: string;
  confidence: number;
  merchant_patterns: string[];
  suggested_group: string;
  suggested_bucket: string;
}

interface CategoryGroup {
  name: string;
  description: string;
  color: string;
  icon: string;
  buckets: {
    name: string;
    description: string;
    color: string;
    icon: string;
    categories: DiscoveredCategory[];
  }[];
}

interface AICategoryDiscoveryProps {
  transactions: Array<{
    description: string;
    amount: number;
    date?: string;
  }>;
  onCategoriesDiscovered: (categories: CategoryGroup[]) => void;
  onComplete: () => void;
}

export const AICategoryDiscovery = ({ 
  transactions, 
  onCategoriesDiscovered, 
  onComplete 
}: AICategoryDiscoveryProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'discovering' | 'grouping' | 'complete'>('idle');
  const [discoveredCategories, setDiscoveredCategories] = useState<CategoryGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startDiscovery = async () => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use AI category discovery.",
        variant: "destructive"
      });
      return;
    }

    if (transactions.length === 0) {
      toast({
        title: "No Transactions",
        description: "Please upload some transactions first.",
        variant: "destructive"
      });
      return;
    }

    setIsDiscovering(true);
    setError(null);
    setProgress(0);
    setStage('discovering');

    try {
      // Step 1: Discover categories
      setProgress(25);
      const { data: discoveryData, error: discoveryError } = await supabase.functions.invoke(
        'discover-categories',
        {
          body: { transactions },
          headers: {
            authorization: `Bearer ${session.access_token}`
          }
        }
      );

      if (discoveryError) {
        throw new Error(discoveryError.message);
      }

      if (!discoveryData.success) {
        throw new Error(discoveryData.error || 'Category discovery failed');
      }

      setDiscoveredCategories(discoveryData.categories);
      setProgress(50);
      setStage('grouping');

      // Step 2: Group categories (optional - can be done later)
      setProgress(75);
      
      // Step 3: Complete
      setProgress(100);
      setStage('complete');
      
      toast({
        title: "Categories Discovered!",
        description: `AI found ${discoveryData.categories.length} category groups with ${discoveryData.categories.reduce((sum, g) => sum + g.buckets.length, 0)} buckets.`,
      });

      onCategoriesDiscovered(discoveryData.categories);

    } catch (err) {
      console.error('Category discovery failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStage('idle');
      
      toast({
        title: "Discovery Failed",
        description: "AI category discovery failed. You can still manually organize categories.",
        variant: "destructive"
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'idle': return <Brain className="h-6 w-6" />;
      case 'discovering': return <Loader2 className="h-6 w-6 animate-spin" />;
      case 'grouping': return <Sparkles className="h-6 w-6" />;
      case 'complete': return <CheckCircle className="h-6 w-6 text-green-600" />;
      default: return <Brain className="h-6 w-6" />;
    }
  };

  const getStageText = () => {
    switch (stage) {
      case 'idle': return 'Ready to discover categories';
      case 'discovering': return 'AI analyzing your transactions...';
      case 'grouping': return 'Organizing categories...';
      case 'complete': return 'Categories discovered successfully!';
      default: return 'Ready to discover categories';
    }
  };

  if (stage === 'complete') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Categories Discovered Successfully
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discoveredCategories.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{group.icon}</span>
                    <h4 className="font-semibold">{group.name}</h4>
                    <Badge variant="secondary">{group.buckets.length} buckets</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                  <div className="space-y-1">
                    {group.buckets.map((bucket, bucketIndex) => (
                      <div key={bucketIndex} className="ml-4 text-sm">
                        <span className="text-lg">{bucket.icon}</span>
                        <span className="ml-1 font-medium">{bucket.name}</span>
                        <span className="ml-2 text-muted-foreground">
                          ({bucket.categories.length} categories)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={onComplete} className="w-full">
              Continue to Transaction Review
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Category Discovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Let AI analyze your transactions and automatically discover spending categories, 
          organize them into logical groups, and learn your spending patterns.
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {isDiscovering && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getStageIcon()}
              <span className="text-sm font-medium">{getStageText()}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-xs text-muted-foreground text-center">
              {progress}% complete
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Transactions to analyze:</span>
            <Badge variant="outline">{transactions.length}</Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <strong>What AI will do:</strong>
            <ul className="mt-1 ml-4 space-y-1">
              <li>• Analyze transaction descriptions and amounts</li>
              <li>• Discover spending patterns and categories</li>
              <li>• Group similar categories into logical buckets</li>
              <li>• Learn merchant patterns for future categorization</li>
              <li>• Create a personalized category structure</li>
            </ul>
          </div>
        </div>

        <Button 
          onClick={startDiscovery} 
          disabled={isDiscovering || transactions.length === 0}
          className="w-full"
        >
          {isDiscovering ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Discovering Categories...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Start AI Discovery
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          This process typically takes 10-30 seconds depending on the number of transactions.
        </div>
      </CardContent>
    </Card>
  );
};
