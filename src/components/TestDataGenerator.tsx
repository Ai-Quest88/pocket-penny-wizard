import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TestTube, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

const TestDataGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const { session } = useAuth()

  const generateTestTransactions = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to generate test data")
      return
    }

    setIsGenerating(true)
    try {
      // Generate sample transactions with various categories and some uncategorized
      const testTransactions = [
        {
          user_id: session.user.id,
          description: "Grocery Store Purchase",
          amount: -85.50,
          date: "2024-01-15",
          category: "Groceries",
          currency: "USD"
        },
        {
          user_id: session.user.id,
          description: "Coffee Shop",
          amount: -4.25,
          date: "2024-01-16",
          category: "Uncategorized",
          currency: "USD"
        },
        {
          user_id: session.user.id,
          description: "Salary Deposit",
          amount: 3500.00,
          date: "2024-01-17",
          category: "Salary",
          currency: "USD"
        },
        {
          user_id: session.user.id,
          description: "Gas Station",
          amount: -45.80,
          date: "2024-01-18",
          category: "Uncategorized",
          currency: "USD"
        },
        {
          user_id: session.user.id,
          description: "Restaurant Dinner",
          amount: -67.90,
          date: "2024-01-19",
          category: "Restaurants",
          currency: "USD"
        },
        {
          user_id: session.user.id,
          description: "Online Purchase Amazon",
          amount: -23.99,
          date: "2024-01-20",
          category: "Uncategorized",
          currency: "USD"
        },
        {
          user_id: session.user.id,
          description: "Freelance Payment",
          amount: 850.00,
          date: "2024-01-21",
          category: "Freelance",
          currency: "USD"
        },
        {
          user_id: session.user.id,
          description: "Utility Bill Electric",
          amount: -120.45,
          date: "2024-01-22",
          category: "Utilities",
          currency: "USD"
        }
      ]

      const { error } = await supabase
        .from("transactions")
        .insert(testTransactions)

      if (error) {
        console.error("Error inserting test transactions:", error)
        toast.error("Failed to generate test transactions")
      } else {
        toast.success(`Generated ${testTransactions.length} test transactions`)
      }
    } catch (error) {
      console.error("Error generating test data:", error)
      toast.error("Failed to generate test transactions")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={generateTestTransactions}
      disabled={isGenerating}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <TestTube className="h-4 w-4" />
      )}
      {isGenerating ? "Generating..." : "Generate Test Data"}
    </Button>
  )
}

export default TestDataGenerator