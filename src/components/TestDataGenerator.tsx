import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TestTube, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface TestDataGeneratorProps {
  onDataGenerated: (data: any[], headers: string[]) => void
}

const TestDataGenerator = ({ onDataGenerated }: TestDataGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateTestCsvData = async () => {
    setIsGenerating(true)
    try {
      // Generate sample CSV data for testing upload functionality
      const headers = ["Date", "Description", "Amount", "Currency"]
      const rawData = [
        ["2024-01-15", "Grocery Store Purchase", "-85.50", "USD"],
        ["2024-01-16", "Coffee Shop Downtown", "-4.25", "USD"],
        ["2024-01-17", "Salary Deposit", "3500.00", "USD"],
        ["2024-01-18", "Gas Station Fill Up", "-45.80", "USD"],
        ["2024-01-19", "Restaurant Dinner", "-67.90", "USD"],
        ["2024-01-20", "Amazon Online Purchase", "-23.99", "USD"],
        ["2024-01-21", "Freelance Payment", "850.00", "USD"],
        ["2024-01-22", "Electric Utility Bill", "-120.45", "USD"],
        ["2024-01-23", "Starbucks Coffee", "-5.75", "USD"],
        ["2024-01-24", "Uber Ride", "-18.50", "USD"],
        ["2024-01-25", "Grocery Store", "-92.30", "USD"],
        ["2024-01-26", "Netflix Subscription", "-15.99", "USD"]
      ]

      // Convert to object format expected by the upload handler
      const csvData = rawData.map(row => ({
        [headers[0]]: row[0], // Date
        [headers[1]]: row[1], // Description
        [headers[2]]: row[2], // Amount
        [headers[3]]: row[3], // Currency
      }))

      // Call the parent component's handler
      onDataGenerated(csvData, headers)
      toast.success(`Generated ${csvData.length} test transactions for upload processing`)
    } catch (error) {
      console.error("Error generating test data:", error)
      toast.error("Failed to generate test data")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={generateTestCsvData}
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