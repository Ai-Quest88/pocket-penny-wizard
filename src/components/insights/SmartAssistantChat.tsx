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

// This is a simplified mock of smart responses
const getSmartResponse = async (message: string, data: any) => {
  // Mock response based on keywords
  if (message.toLowerCase().includes("debt")) {
    return `Here are some general suggestions about managing expenses:
1. Consider consolidating multiple payments into a single payment
2. Create a priority list for your expenses
3. Set up a monthly budget to track spending
4. Look for ways to reduce regular expenses`
  }
  
  if (message.toLowerCase().includes("save") || message.toLowerCase().includes("saving")) {
    return `Here are some general suggestions about saving:
1. Set up automatic transfers for savings
2. Review your recurring subscriptions
3. Look for cashback opportunities on regular purchases
4. Consider high-interest savings options`
  }
  
  return `Here are some general financial suggestions:
1. Track your monthly expenses regularly
2. Set clear financial goals
3. Review your spending patterns
4. Consider setting aside funds for unexpected expenses`
}

export const SmartAssistantChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm your smart assistant. I can help analyze your financial data and provide general suggestions. What would you like to know?"
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
      const response = await getSmartResponse(userMessage, {})
      
      // Add AI response
      setMessages(prev => [...prev, { role: "assistant", content: response }])
    } catch (error) {
      console.error("Failed to get response:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold">Smart Assistant</h2>
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
          placeholder="Ask a question..."
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