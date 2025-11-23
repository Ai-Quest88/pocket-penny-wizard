import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendHorizontal, Bot, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export const SmartAssistantChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI financial assistant. I have access to your transaction data, budgets, assets, and liabilities. Ask me anything about your finances!"
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    
    // Add user message
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    
    setIsLoading(true)
    
    // Add placeholder for assistant response
    setMessages(prev => [...prev, { role: "assistant", content: "" }])
    
    try {
      const conversationHistory = messages.slice(1) // Exclude initial greeting
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get response from AI assistant')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue
            if (!line.startsWith('data: ')) continue

            const jsonStr = line.slice(6).trim()
            if (jsonStr === '[DONE]') continue

            try {
              const parsed = JSON.parse(jsonStr)
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text
              
              if (content) {
                accumulatedText += content
                // Update the last message (assistant's response) in real-time
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: accumulatedText
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // Skip invalid JSON
              console.warn('Failed to parse SSE chunk:', e)
            }
          }
        }
      }

      if (!accumulatedText) {
        throw new Error('No response received from AI')
      }

    } catch (error) {
      console.error("Failed to get response:", error)
      // Update last message with error
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: "I apologize, but I encountered an error processing your request. Please try again."
        }
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold">AI Financial Assistant</h2>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
                {message.role === "assistant" && !message.content && isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{message.content}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          placeholder="Ask about your spending, budgets, savings, or get financial advice..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
          disabled={isLoading}
        />
        <Button 
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizontal className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  )
}