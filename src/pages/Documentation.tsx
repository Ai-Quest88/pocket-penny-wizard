import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import DocumentationViewer from '@/components/documentation/DocumentationViewer';
import DocumentationEditor from '@/components/documentation/DocumentationEditor';
import { 
  BookOpen, 
  FileText, 
  Building2, 
  TrendingUp, 
  Wrench, 
  Database,
  ArrowLeft,
  Info,
  Users,
  Target,
  DollarSign
} from 'lucide-react';

// Documentation metadata
const documentationFiles = [
  {
    id: 'DOCUMENTATION',
    name: 'Documentation Guide',
    description: 'Overview of all documentation files and usage guidelines',
    icon: BookOpen,
    category: 'Overview',
    audience: 'All Stakeholders',
    size: '5KB',
    lastUpdated: '2025-01-26'
  },
  {
    id: 'requirements',
    name: 'Technical Requirements',
    description: 'Complete technical and functional requirements specification',
    icon: FileText,
    category: 'Technical',
    audience: 'Developers, QA Engineers',
    size: '40KB',
    lastUpdated: '2025-01-26'
  },
  {
    id: 'tech-spec',
    name: 'Technical Specification',
    description: 'System architecture and implementation guidelines',
    icon: Wrench,
    category: 'Technical',
    audience: 'Developers, Architects',
    size: '24KB',
    lastUpdated: '2025-01-26'
  },
  {
    id: 'business-plan',
    name: 'Business Plan',
    description: 'Business strategy, financial projections, and investment roadmap',
    icon: Building2,
    category: 'Business',
    audience: 'Investors, Executives',
    size: '30KB',
    lastUpdated: '2025-01-26'
  },
  {
    id: 'marketing-plan',
    name: 'Marketing Plan',
    description: 'Marketing strategy and customer acquisition plans',
    icon: TrendingUp,
    category: 'Business',
    audience: 'Marketing Team',
    size: '29KB',
    lastUpdated: '2025-01-26'
  },
  {
    id: 'sprc',
    name: 'Master Specification',
    description: 'Comprehensive application specification and requirements',
    icon: Database,
    category: 'Overview',
    audience: 'All Stakeholders',
    size: '23KB',
    lastUpdated: '2025-01-26'
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Technical': return Wrench;
    case 'Business': return DollarSign;
    case 'Overview': return Info;
    default: return FileText;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Business': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Overview': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const Documentation: React.FC = () => {
  const { docName } = useParams<{ docName: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  
  const mode = searchParams.get('mode') || 'view';
  const currentDoc = docName ? documentationFiles.find(doc => doc.id === docName) : null;

  const handleDocumentSelect = (docId: string) => {
    navigate(`/docs/${docId}`);
    setIsEditing(false);
  };

  const handleEditMode = () => {
    setIsEditing(true);
    setSearchParams({ mode: 'edit' });
  };

  const handleViewMode = () => {
    setIsEditing(false);
    setSearchParams({ mode: 'view' });
  };

  const handleSaveDocument = async (content: string) => {
    // In a real application, this would save to the server
    console.log('Saving document:', docName, content);
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, just show success
    setIsEditing(false);
    setSearchParams({ mode: 'view' });
  };

  // Documentation overview/index page
  if (!docName) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Documentation Center</h1>
                <p className="text-muted-foreground">
                  Comprehensive documentation for the Finsight platform
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{documentationFiles.length} Documents</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Multiple Audiences</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Live Documentation</span>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentationFiles.map((doc) => {
              const IconComponent = doc.icon;
              const CategoryIcon = getCategoryIcon(doc.category);
              
              return (
                <Card 
                  key={doc.id}
                  className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
                  onClick={() => handleDocumentSelect(doc.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">{doc.size}</p>
                      </div>
                    </div>
                    
                    <Badge className={getCategoryColor(doc.category)} variant="secondary">
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {doc.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {doc.description}
                  </p>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{doc.audience}</span>
                    </div>
                    <span>Updated {doc.lastUpdated}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card className="mt-8 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => handleDocumentSelect('requirements')}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Technical Requirements
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => handleDocumentSelect('business-plan')}
              >
                <Building2 className="h-4 w-4 mr-2" />
                View Business Plan
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => handleDocumentSelect('DOCUMENTATION')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Documentation Guide
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Individual document view/edit
  if (!currentDoc) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Document Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested documentation file could not be found.
            </p>
            <Button onClick={() => navigate('/docs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documentation
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)]">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/docs')}
            className="w-full justify-start mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Button>
          
          <Separator className="my-4" />
          
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-2">
              {documentationFiles.map((doc) => {
                const IconComponent = doc.icon;
                const isActive = doc.id === docName;
                
                return (
                  <Button
                    key={doc.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => handleDocumentSelect(doc.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <IconComponent className="h-4 w-4 flex-shrink-0" />
                      <div className="text-left flex-1 min-w-0">
                        <div className="font-medium truncate">{doc.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {doc.category}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6">
          {isEditing || mode === 'edit' ? (
            <DocumentationEditor
              docName={docName}
              onSave={handleSaveDocument}
              onCancel={handleViewMode}
              isReadOnly={true} // Set to true for security - files are read-only from web interface
            />
          ) : (
            <DocumentationViewer
              docName={docName}
              onEdit={handleEditMode}
              showEditButton={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation; 