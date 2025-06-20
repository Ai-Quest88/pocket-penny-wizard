
import React from 'react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AutoMappingAlertProps {
  autoMappedColumns: Record<string, string>
  onAcceptMapping: () => void
}

export const AutoMappingAlert: React.FC<AutoMappingAlertProps> = ({
  autoMappedColumns,
  onAcceptMapping
}) => {
  if (Object.keys(autoMappedColumns).length === 0) return null

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <p className="font-medium">Auto-detected column mappings:</p>
          <ul className="text-sm space-y-1">
            {Object.entries(autoMappedColumns).map(([field, column]) => (
              <li key={field}>
                <strong>{field}:</strong> {column}
              </li>
            ))}
          </ul>
          <Button onClick={onAcceptMapping} size="sm" variant="outline">
            Accept Auto-Mapping
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
