import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHouseholdsWithMembers } from '../../integrations/supabase/households';
import { Household } from '../../types/households';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Users, User } from 'lucide-react';

interface HouseholdListProps {
  onHouseholdSelect?: (household: Household) => void;
  showMemberCount?: boolean;
  showMembers?: boolean;
  className?: string;
}

export const HouseholdList: React.FC<HouseholdListProps> = ({
  onHouseholdSelect,
  showMemberCount = true,
  showMembers = false,
  className = '',
}) => {
  const { data: households, isLoading, error } = useQuery({
    queryKey: ['households'],
    queryFn: getHouseholdsWithMembers,
  });

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
        <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
        <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-4 text-red-600 ${className}`}>
        Error loading households
      </div>
    );
  }

  if (!households || households.length === 0) {
    return (
      <div className={`text-center p-4 text-gray-500 ${className}`}>
        No households found
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {households.map((household) => (
        <Card 
          key={household.id}
          className={`cursor-pointer transition-colors hover:bg-gray-50 ${
            onHouseholdSelect ? 'hover:shadow-md' : ''
          }`}
          onClick={() => onHouseholdSelect?.(household)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{household.name}</CardTitle>
              {showMemberCount && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-500" />
                   <Badge variant="secondary">
                     {household.entities.length} member{household.entities.length !== 1 ? 's' : ''}
                   </Badge>
                </div>
              )}
            </div>
            {household.description && (
              <p className="text-sm text-gray-600">{household.description}</p>
            )}
          </CardHeader>
           {showMembers && household.entities.length > 0 && (
             <CardContent className="pt-0">
               <div className="space-y-1">
                 {household.entities.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-gray-400" />
                     <span className="text-sm">
                       {member.name}
                     </span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}; 