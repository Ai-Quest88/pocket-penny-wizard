
import React from 'react'

interface PreviewTableProps {
  headers: string[]
  preview: Record<string, string>[]
}

export const PreviewTable: React.FC<PreviewTableProps> = ({
  headers,
  preview
}) => {
  const validHeaders = headers.filter(header => {
    return header && 
           typeof header === 'string' && 
           header.trim() !== '' && 
           header.trim() !== 'undefined' && 
           header.trim() !== 'null' &&
           header.length > 0
  })

  // Filter out balance column from display
  const displayHeaders = validHeaders.filter(header => 
    !header.toLowerCase().includes('balance')
  )

  if (preview.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Preview</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              {displayHeaders.map(header => (
                <th key={`preview-header-${header}`} className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, index) => (
              <tr key={`preview-row-${index}`}>
                {displayHeaders.map(header => (
                  <td key={`preview-cell-${index}-${header}`} className="border border-gray-300 px-3 py-2 text-sm">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
