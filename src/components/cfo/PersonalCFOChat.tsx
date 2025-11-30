import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Brain } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const PersonalCFOChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Personal AI CFO. I have complete knowledge of your financial history, spending patterns, and goals. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = useMutation({
    mutationFn: async (userMessage: string) => {
      const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
      setMessages(newMessages);
      setInput('');

      const { data, error } = await supabase.functions.invoke('cfo-chat', {
        body: { messages: newMessages }
      });

      if (error) throw error;
      return data.message;
    },
    onSuccess: (assistantMessage) => {
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    },
    onError: () => {
      toast.error('Failed to get response from AI CFO');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;
    sendMessage.mutate(input.trim());
  };

  const quickActions = [
    "Review my spending this month",
    "How am I doing with my savings?",
    "What should I focus on financially?",
    "Analyze my expense trends"
  ];

  return (
    <div className="h-[600px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h3 className="font-semibold">Your Personal CFO</h3>
          <p className="text-xs text-muted-foreground">
            Powered by your complete financial history
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4 mb-4">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {sendMessage.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {quickActions.map((action, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => sendMessage.mutate(action)}
              disabled={sendMessage.isPending}
            >
              {action}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your CFO anything about your finances..."
          className="resize-none"
          rows={3}
          disabled={sendMessage.isPending}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!input.trim() || sendMessage.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};