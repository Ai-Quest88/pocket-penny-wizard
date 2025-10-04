// CategorizationSourceBadge - Shows the source and confidence of categorization
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CategorizationSourceBadgeProps {
  source: 'user_history' | 'system_keywords' | 'ai' | 'uncategorized' | 'user_rule' | 'system_rule' | 'fallback';
  confidence: number;
  className?: string;
}

export const CategorizationSourceBadge: React.FC<CategorizationSourceBadgeProps> = ({
  source,
  confidence,
  className = ''
}) => {
  const getSourceConfig = () => {
    switch (source) {
      case 'user_history':
        return {
          icon: '🧠',
          label: 'User History',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Learned from your previous transactions'
        };
      case 'system_keywords':
        return {
          icon: '🔑',
          label: 'System Keywords',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Matched by system keyword rules'
        };
      case 'ai':
        return {
          icon: '🤖',
          label: 'AI Categorization',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          description: 'Categorized by AI analysis'
        };
      case 'uncategorized':
        return {
          icon: '❓',
          label: 'Uncategorized',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'No categorization found'
        };
      case 'user_rule':
        return {
          icon: '👤',
          label: 'User Rule',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          description: 'Matched by your custom rule'
        };
      case 'system_rule':
        return {
          icon: '⚙️',
          label: 'System Rule',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'Matched by system rule'
        };
      case 'fallback':
        return {
          icon: '🔄',
          label: 'Fallback',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Fallback categorization'
        };
      default:
        return {
          icon: '❓',
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Unknown source'
        };
    }
  };

  const config = getSourceConfig();
  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="outline" 
        className={`${config.color} text-xs font-medium`}
        title={config.description}
      >
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
      <span className="text-xs text-gray-600 font-medium">
        {confidencePercent}%
      </span>
    </div>
  );
};

// Helper component for displaying multiple badges
export const CategorizationSourceBadges: React.FC<{
  sources: Array<{
    source: CategorizationSourceBadgeProps['source'];
    confidence: number;
  }>;
  className?: string;
}> = ({ sources, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {sources.map((item, index) => (
        <CategorizationSourceBadge
          key={index}
          source={item.source}
          confidence={item.confidence}
        />
      ))}
    </div>
  );
};
