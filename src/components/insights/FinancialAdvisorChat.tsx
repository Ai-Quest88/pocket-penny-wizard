import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendHorizontal, Bot } from "lucide-react"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// This is a simplified mock of financial advice responses
// In a real app, this would be connected to an AI service
const getFinancialAdvice = async (message: string, data: any) => {
  // Mock response based on keywords
  if (message.toLowerCase().includes("debt")) {
    return `Based on your current financial situation, here are some recommendations for managing your debt:
1. Consider consolidating your high-interest debts into a single lower-interest loan
2. Prioritize paying off debts with the highest interest rates first
3. Create a strict budget to allocate more funds toward debt repayment
4. Look into balance transfer credit cards with 0% introductory APR`
  }
  
  if (message.toLowerCase().includes("save") || message.toLowerCase().includes("saving")) {
    return `Looking at your spending patterns, here are ways to increase your savings:
1. Set up automatic transfers to your savings account
2. Review and cut unnecessary subscription services
3. Consider using cash-back credit cards for essential purchases
4. Look into high-yield savings accounts for better interest rates`
  }
  
  return `Here are some general financial recommendations:
1. Maintain an emergency fund of 3-6 months of expenses
2. Review your investment portfolio regularly
3. Stay within 30% of your income for housing expenses
4. Consider increasing your retirement contributions`
}

export function FinancialAdvisorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm your financial advisor. Ask me anything about your finances, and I'll provide personalized advice based on your financial data."
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput("")
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    
    setIsLoading(true)
    try {
      // Get AI response
      const response = await getFinancialAdvice(userMessage, {})
      
      // Add AI response
      setMessages(prev => [...prev, { role: "assistant", content: response }])
    } catch (error) {
      console.error("Failed to get financial advice:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold">Financial Advisor</h2>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="Ask about your finances..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
        />
        <Button 
          onClick={handleSendMessage}
          disabled={isLoading}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}