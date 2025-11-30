import { Card } from "@/components/ui/card";
import { CFODashboard } from "@/components/cfo/CFODashboard";
import { CFOAlerts } from "@/components/cfo/CFOAlerts";
import { GoalTracker } from "@/components/cfo/GoalTracker";
import { PersonalCFOChat } from "@/components/cfo/PersonalCFOChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Target, Bell, MessageSquare } from "lucide-react";

const CFO = () => {
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <Brain className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
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