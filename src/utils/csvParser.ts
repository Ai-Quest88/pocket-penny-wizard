export interface ParsedTransaction {
  description: string;
  amount: string;
  category: string;
  date: string;
}

export const parseCSV = (content: string): ParsedTransaction[] => {
  const lines = content.split('\n');
  if (lines.length < 2) return [];

  // Skip header row and process data rows
  return lines.slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
      const [date, description, amount] = line.split(',').map(field => field.trim());
      return {
        description: description || '',
        amount: amount || '0',
        category: 'Other', // Default category
        date: date || new Date().toISOString().split('T')[0]
      };
    });
};