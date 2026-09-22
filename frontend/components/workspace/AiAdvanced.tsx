"use client";

import { useState } from "react";
import { Loader2, CheckSquare, MessageCircleQuestion, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ChecklistItem, LegalQuestion } from "@nyaylens/shared";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AiAdvancedProps {
  documentId: string;
  onPageSelect: (page: number) => void;
  type: "checklist" | "consult";
}

export function AiAdvanced({ documentId, onPageSelect, type }: AiAdvancedProps) {
  const [data, setData] = useState<ChecklistItem[] | LegalQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      if (type === "checklist") {
        const response = await apiClient.post<ChecklistItem[]>(`/documents/${documentId}/checklist`, {});
        setData(response);
      } else {
        const response = await apiClient.post<LegalQuestion[]>(`/documents/${documentId}/legal-questions`, {});
        setData(response);
      }
    } catch (err: any) {
      setError(err.message || `Failed to generate ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const PageBadge = ({ page }: { page?: number }) => {
    if (!page) return null;
    return (
      <Badge 
        variant="secondary" 
        className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors shrink-0"
        onClick={() => onPageSelect(page)}
      >
        Pg {page}
      </Badge>
    );
  };

  if (!data && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        {type === "checklist" ? (
          <CheckSquare className="h-12 w-12 text-slate-300 mb-4" />
        ) : (
          <MessageCircleQuestion className="h-12 w-12 text-slate-300 mb-4" />
        )}
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {type === "checklist" ? "Action Checklist" : "Legal Professional Consult"}
        </h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">
          {type === "checklist" 
            ? "Generate a concrete task list of obligations and deadlines found in this document."
            : "Generate highly specific questions to ask your attorney based on the risks in this document."}
        </p>
        <Button onClick={handleGenerate} className="gap-2">
          {type === "checklist" ? <CheckSquare className="h-4 w-4" /> : <MessageCircleQuestion className="h-4 w-4" />}
          Generate Now
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Generating advanced insights...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Generation Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={handleGenerate} variant="outline" size="sm" className="mt-3">Try Again</Button>
        </Alert>
      )}

      {data && !isLoading && type === "checklist" && (
        <div className="space-y-4">
          {(data as ChecklistItem[]).length > 0 ? (data as ChecklistItem[]).map((item, idx) => (
            <Card key={idx} className="shadow-sm">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex justify-between gap-2 items-start">
                  <div className="flex gap-3 items-start">
                    <input type="checkbox" className="mt-1.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
                    <p className="text-sm font-medium text-slate-900 leading-snug">{item.task}</p>
                  </div>
                  <PageBadge page={item.source_page} />
                </div>
                <div className="flex items-center gap-2 mt-1 ml-7">
                  {item.assignee && <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Who: {item.assignee}</Badge>}
                  {item.deadline && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Due: {item.deadline}</Badge>}
                </div>
              </CardContent>
            </Card>
          )) : (
            <p className="text-sm text-slate-500 italic p-4 text-center">No clear actionable items found in this document.</p>
          )}
        </div>
      )}

      {data && !isLoading && type === "consult" && (
        <div className="space-y-4">
          {(data as LegalQuestion[]).length > 0 ? (data as LegalQuestion[]).map((item, idx) => (
            <Card key={idx} className="shadow-sm border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base font-semibold text-slate-900">{item.question}</CardTitle>
                  <PageBadge page={item.source_page} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-600 italic border border-slate-100">
                  <span className="font-semibold text-slate-700 not-italic block mb-1">Context:</span>
                  {item.context}
                </div>
              </CardContent>
            </Card>
          )) : (
            <p className="text-sm text-slate-500 italic p-4 text-center">No major legal questions identified for this document.</p>
          )}
        </div>
      )}
    </ScrollArea>
  );
}
