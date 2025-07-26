import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Edit, Download, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import 'highlight.js/styles/github.css';

interface DocumentationViewerProps {
  docName: string;
  onEdit?: () => void;
  showEditButton?: boolean;
}

// Static documentation content - in production, this would come from an API
const documentationContent: Record<string, string> = {
  'DOCUMENTATION': `# Finsight - Documentation

This directory contains comprehensive documentation for the Finsight project, organized by audience and purpose.

## Document Overview

### 📋 **requirements.md** - Technical Requirements Specification
**Audience**: Developers, Architects, QA Engineers  
**Purpose**: Complete technical and functional requirements for system implementation  

### 🏗️ **tech-spec.md** - Technical Specification Document
**Audience**: Developers, Architects, DevOps Engineers  
**Purpose**: Detailed system architecture and implementation guidelines  

### 💼 **business-plan.md** - Strategic Business Plan
**Audience**: Investors, Executives, Business Stakeholders  
**Purpose**: Business strategy, financial projections, and investment roadmap  

### 📈 **marketing-plan.md** - Comprehensive Marketing Strategy
**Audience**: Marketing Team, Growth Managers, Partnership Teams  
**Purpose**: Customer acquisition, brand positioning, and marketing campaigns  

### 📊 **sprc.md** - Master Application Specification & Requirements
**Audience**: All Stakeholders  
**Purpose**: Comprehensive overview combining business and technical aspects  

## Document Usage Guide

### For Different Teams:

**🧑‍💻 Development Team**:
- Primary: \`requirements.md\` and \`tech-spec.md\`
- Reference: \`sprc.md\` for complete context

**💰 Investors/Board Members**:
- Primary: \`business-plan.md\`
- Reference: \`sprc.md\` for technical understanding

**📊 Marketing Team**:
- Primary: \`marketing-plan.md\`
- Reference: \`business-plan.md\` for market strategy alignment`,

  'requirements': `# Finsight - Requirements Specification Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current Feature Requirements](#current-feature-requirements)
3. [User Requirements & Use Cases](#user-requirements--use-cases)
4. [Functional Requirements](#functional-requirements)
5. [Non-Functional Requirements](#non-functional-requirements)

---

## Project Overview

### Application Purpose
**Finsight** is a comprehensive personal finance management platform designed specifically for Australian users. The application provides intelligent transaction categorization, multi-entity financial management, and advanced analytics through a modern web and mobile interface.

### Core Technical Objectives
- **Automated Processing**: AI-powered transaction categorization with 95%+ accuracy
- **Multi-Entity Support**: Native support for personal, business, family, and trust finances
- **Australian Optimization**: Purpose-built for Australian banking formats and financial structures
- **Real-Time Analytics**: Comprehensive reporting and financial insights
- **Scalable Architecture**: Cloud-native design supporting rapid user growth

### Key System Capabilities
- Transaction management with bulk import and AI categorization
- Asset and liability tracking with historical valuation
- Multi-currency support with real-time exchange rates
- Advanced budgeting and financial forecasting
- Comprehensive reporting suite with interactive visualizations
- Mobile-first responsive design with offline capabilities

## Current Feature Requirements

### 1. User Management & Authentication

#### Technical Requirements
**Authentication System**: Supabase Auth integration with email/password authentication
**Session Management**: JWT-based sessions with automatic refresh and timeout
**User Profiles**: Comprehensive user profile management with preferences
**Security**: Password complexity requirements, session security, and audit logging

#### Functional Requirements
- User registration with email verification
- Secure login with session persistence across devices
- Password reset functionality with secure email links
- User profile management with customizable preferences
- Account deactivation and data deletion capabilities
- Multi-device session synchronization`,

  'business-plan': `# Finsight - Business Plan

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Market Analysis](#market-analysis)
3. [Business Model](#business-model)
4. [Financial Projections](#financial-projections)

---

## Executive Summary

### Vision Statement
**Finsight** aims to become Australia's premier personal finance management platform, addressing the unique needs of Australian users through intelligent automation, multi-entity support, and comprehensive financial tracking capabilities.

### Mission
To empower Australians to take control of their financial future through innovative technology that simplifies financial management, provides intelligent insights, and supports the unique complexities of Australian financial structures.

### Core Value Proposition
- **Australian-First Design**: Purpose-built for Australian banking systems, tax structures, and financial patterns
- **AI-Powered Intelligence**: 95%+ accurate transaction categorization using Google Gemini
- **Multi-Entity Management**: Native support for personal, business, family, and trust finances
- **Comprehensive Analytics**: Advanced reporting beyond basic budgeting tools

### Business Opportunity
- **Market Size**: 10.7M Australian households + 2.4M small businesses
- **Revenue Potential**: $500,000 ARR by Q4 2025, $2M+ by Q4 2026
- **Growth Strategy**: Freemium model scaling to enterprise solutions
- **Competitive Advantage**: Australian specialization in underserved market`,

  'marketing-plan': `# Finsight - Marketing Plan

## Table of Contents
1. [Marketing Overview](#marketing-overview)
2. [Target Market Analysis](#target-market-analysis)
3. [Customer Personas](#customer-personas)
4. [Competitive Positioning](#competitive-positioning)

---

## Marketing Overview

### Marketing Mission
To position Finsight as Australia's premier personal finance management platform through targeted digital marketing, strategic partnerships, and community building that drives sustainable user acquisition and engagement.

### Marketing Objectives
- **Brand Awareness**: Achieve 25% aided brand awareness in target demographic by Q4 2026
- **User Acquisition**: 150,000 registered users by Q4 2026
- **Market Position**: #1 Australian personal finance app by user satisfaction and feature richness
- **Customer Acquisition Cost**: Maintain CAC <$50 across all channels

### Unique Value Proposition
**"The only personal finance app built specifically for Australians, with AI that understands your money like you do."**

**Key Differentiators**:
- Australian banking format optimization
- Multi-entity financial management (personal, business, family, trusts)
- 95%+ accurate AI categorization with Australian context
- Modern, mobile-first user experience`,

  'tech-spec': `# Finsight - Technical Specification

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema & Data Models](#database-schema--data-models)
3. [API & Integration Layer](#api--integration-layer)
4. [Component Architecture](#component-architecture)

---

## System Architecture

### Frontend Technology Stack
\`\`\`
React 18.3.1 (Main Framework)
├── TypeScript 5.5.3        (Type safety & developer experience)
├── Vite 5.4.1              (Build tool & development server)
├── TailwindCSS 3.4.11      (Utility-first CSS framework)
├── shadcn/ui                (Modern component library)
├── Radix UI primitives      (Accessible, unstyled components)
├── React Router DOM 6.26.2  (Client-side routing)
├── TanStack React Query 5.56.2 (Server state management)
├── React Hook Form 7.53.0   (Form handling)
├── Zod 3.23.8              (Schema validation)
├── Recharts 2.12.7         (Data visualization)
├── React Dropzone 14.3.8   (File upload handling)
├── Date-fns 3.6.0          (Date manipulation)
└── Lucide React 0.462.0    (Icon library)
\`\`\`

### Backend Infrastructure
**Supabase (Backend-as-a-Service)**
- **PostgreSQL Database**: Primary data storage with Row Level Security
- **Supabase Auth**: Authentication & session management
- **Edge Functions**: Deno-based serverless compute for AI processing
- **Storage**: File upload & document storage
- **Real-time**: WebSocket connections for live data updates`,

  'sprc': `# Finsight - Application Specification & Requirements (SPRC)

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Core Features & Functionality](#core-features--functionality)
4. [Database Schema](#database-schema)

## Project Overview

### Application Summary
**Finsight** is a comprehensive personal finance management application designed specifically for Australian users. It provides advanced multi-entity financial tracking with AI-powered transaction categorization, multi-currency support, and sophisticated reporting capabilities.

### Key Value Propositions
1. **Australian Market Specialization**: Built specifically for Australian banking systems, tax structures, and financial patterns
2. **Intelligent Automation**: AI-powered transaction categorization achieving 95%+ accuracy using Google Gemini
3. **Multi-Entity Architecture**: Native support for individuals, families, businesses, trusts, and super funds
4. **Comprehensive Analytics**: Advanced reporting and forecasting capabilities beyond basic budgeting tools
5. **Modern Technology Stack**: Cloud-native, mobile-first design with real-time capabilities

### Target Market
- **Primary**: 10.7M Australian households seeking intelligent financial management
- **Secondary**: 2.4M small businesses requiring multi-entity financial tracking
- **Tertiary**: 28,000+ financial advisors managing client portfolios

The application represents a significant opportunity in the underserved Australian personal finance market, particularly following the shutdown of Mint and the limited Australian-focused alternatives currently available.`
};

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({
  docName,
  onEdit,
  showEditButton = true
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDocumentation();
  }, [docName]);

  const loadDocumentation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In production, this would be an API call to fetch the actual markdown file
      const docContent = documentationContent[docName];
      
      if (!docContent) {
        setError(`Documentation "${docName}" not found`);
        return;
      }
      
      setContent(docContent);
    } catch (err) {
      setError(`Failed to load documentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Documentation content has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `${docName}.md has been downloaded.`,
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading documentation...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Documentation</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={loadDocumentation} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">{docName.replace('-', ' ').toUpperCase()}</h1>
              <Badge variant="outline" className="mt-1">
                Documentation
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContent}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            
            {showEditButton && onEdit && (
              <Button
                variant="default"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://github.com/Ai-Quest88/pocket-penny-wizard/blob/main/docs/${docName}.md`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      <Card className="p-6">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ children }) => (
                  <>
                    <h1 className="text-3xl font-bold text-foreground mb-4">{children}</h1>
                    <Separator className="my-6" />
                  </>
                ),
                h2: ({ children }) => (
                  <>
                    <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{children}</h2>
                    <Separator className="my-4" />
                  </>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="text-muted-foreground mb-4 leading-relaxed">{children}</p>
                ),
                code: ({ inline, children, ...props }) => {
                  if (inline) {
                    return (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto" {...props}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 py-2 bg-muted/50 rounded-r">
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-1 text-muted-foreground">
                    {children}
                  </ol>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full border-collapse border border-border rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border bg-muted p-3 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border p-3 text-muted-foreground">
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};

export default DocumentationViewer; 