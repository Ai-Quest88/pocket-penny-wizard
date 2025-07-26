import React, { useState, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Eye, Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import '@uiw/react-md-editor/markdown-editor.css';

interface DocumentationEditorProps {
  docName: string;
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  onCancel?: () => void;
  isReadOnly?: boolean;
}

const DocumentationEditor: React.FC<DocumentationEditorProps> = ({
  docName,
  initialContent = '',
  onSave,
  onCancel,
  isReadOnly = false
}) => {
  const [content, setContent] = useState<string>(initialContent);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setContent(initialContent);
    setHasChanges(false);
  }, [initialContent]);

  useEffect(() => {
    setHasChanges(content !== initialContent);
  }, [content, initialContent]);

  const handleSave = async () => {
    if (!hasChanges || !onSave) return;

    setSaving(true);
    try {
      await onSave(content);
      setHasChanges(false);
      toast({
        title: "Documentation saved",
        description: `${docName}.md has been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: `Failed to save ${docName}.md. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }
    
    setContent(initialContent);
    setHasChanges(false);
    onCancel?.();
  };

  const handleContentChange = (value?: string) => {
    setContent(value || '');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">
                Editing: {docName.replace('-', ' ').toUpperCase()}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isReadOnly ? "secondary" : "outline"}>
                  {isReadOnly ? "Read Only" : "Editable"}
                </Badge>
                {hasChanges && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Unsaved Changes
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
            >
              {previewMode ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            
            {!isReadOnly && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {isReadOnly && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This document is in read-only mode. Changes cannot be saved to the actual documentation files 
            from the web interface for security reasons. Use this editor to preview changes and copy content.
          </AlertDescription>
        </Alert>
      )}

      {hasChanges && !isReadOnly && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Don't forget to save your work before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      {/* Editor */}
      <Card className="p-0 overflow-hidden">
        <div className="min-h-[600px]">
          <MDEditor
            value={content}
            onChange={handleContentChange}
            preview={previewMode ? 'preview' : 'edit'}
            hideToolbar={isReadOnly}
            data-color-mode="light"
            height={600}
            textareaProps={{
              placeholder: 'Start writing your documentation...',
              style: {
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              },
              disabled: isReadOnly,
            }}
          />
        </div>
      </Card>

      {/* Footer Info */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Characters: {content.length}</span>
            <span>Lines: {content.split('\n').length}</span>
            <span>Words: {content.split(/\s+/).filter(Boolean).length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges ? (
              <Badge variant="destructive" className="text-xs">
                Modified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Saved
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DocumentationEditor; 