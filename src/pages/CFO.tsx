import { Card } from "@/components/ui/card";
import { CFODashboard } from "@/components/cfo/CFODashboard";
import { CFOAlerts } from "@/components/cfo/CFOAlerts";
import { GoalTracker } from "@/components/cfo/GoalTracker";
import { PersonalCFOChat } from "@/components/cfo/PersonalCFOChat";
import { TransactionFileAnalyzer } from "@/components/cfo/TransactionFileAnalyzer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, Bell, MessageSquare, Upload } from "lucide-react";
import { UnifiedCsvUpload } from "@/components/transaction-forms/UnifiedCsvUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const CFO = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isCompiling, setIsCompiling] = useState(false);

  const handleUploadComplete = async () => {
    if (!session) return;

    setIsCompiling(true);
    try {
      // Trigger knowledge compilation after successful upload
      const { error } = await supabase.functions.invoke('compile-user-knowledge', {
        body: { userId: session.user.id }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Transactions uploaded and AI knowledge updated successfully.",
      });
    } catch (error) {
      console.error('Knowledge compilation error:', error);
      toast({
        title: "Upload Successful",
        description: "Transactions uploaded. AI knowledge will update shortly.",
        variant: "default"
      });
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Your Personal AI CFO</h1>
          <p className="text-muted-foreground">
            Intelligent financial guidance powered by your complete financial history
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-2">
            <Brain className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <CFODashboard />
        </TabsContent>

        <TabsContent value="chat">
          <Card className="p-6">
            <PersonalCFOChat />
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <div className="space-y-6">
            <Card className="p-6">
              <TransactionFileAnalyzer />
            </Card>
            
            <div id="upload-section">
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Upload & Save Transactions</h2>
                    <p className="text-muted-foreground">
                      Upload your transactions from CSV files. The AI will automatically categorize them and save to your account.
                    </p>
                  </div>
                  <UnifiedCsvUpload onComplete={handleUploadComplete} />
                  {isCompiling && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      Updating AI knowledge...
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="goals">
          <GoalTracker />
        </TabsContent>

        <TabsContent value="alerts">
          <CFOAlerts />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CFO;