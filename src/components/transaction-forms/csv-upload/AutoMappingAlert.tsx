
import React from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle } from "lucide-react"

interface AutoMappingAlertProps {
  autoMapped: Record<string, string>
  hasRequiredMappings: boolean
}

export const AutoMappingAlert: React.FC<AutoMappingAlertProps> = ({
  autoMapped,
  hasRequiredMappings
}) => {
  if (Object.keys(autoMapped).length === 0) return null

  return (
    <Alert>
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Headers detected and automatically mapped:</p>
          <ul className="text-sm space-y-1">
            {Object.entries(autoMapped).map(([field, column]) => (
              <li key={field}>
                <strong>{field}:</strong> {column}
              </li>
            ))}
          </ul>
          {hasRequiredMappings ? (
            <p className="text-green-600 font-medium">✓ All required fields mapped successfully!</p>
          ) : (
            <p className="text-amber-600">Some required fields need manual mapping below.</p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
