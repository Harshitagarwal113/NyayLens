"use client";

import { DocumentAnalysisData } from "@nyaylens/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, AlertTriangle, Scale, Calendar, Users, DollarSign, Activity } from "lucide-react";
import { AiChat } from "./AiChat";
import { AiAdvanced } from "./AiAdvanced";

interface AiPanelProps {
  documentId: string;
  analysis: DocumentAnalysisData;
  onPageSelect: (page: number) => void;
}

export function AiPanel({ documentId, analysis, onPageSelect }: AiPanelProps) {
  
  const PageBadge = ({ page }: { page?: number }) => {
    if (!page) return null;
    return (
      <Badge 
        variant="secondary" 
        className="cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onPageSelect(page);
        }}
      >
        Pg {page}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2 shrink-0">
        <Activity className="h-5 w-5 text-blue-600" />
        <h2 className="font-semibold text-slate-900">AI Intelligence</h2>
      </div>

      <Tabs defaultValue="summary" className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="px-4 pt-3 border-b border-slate-200 shrink-0">
          <TabsList className="w-full justify-start h-auto p-1 bg-slate-100/50 flex-wrap overflow-x-auto overflow-y-hidden pb-2 mb-[-8px]">
            <TabsTrigger value="summary" className="text-xs sm:text-sm py-2 shrink-0">Summary</TabsTrigger>
            <TabsTrigger value="clauses" className="text-xs sm:text-sm py-2 shrink-0">Clauses</TabsTrigger>
            <TabsTrigger value="attention" className="text-xs sm:text-sm py-2 shrink-0">Risks</TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs sm:text-sm py-2 shrink-0">Action Items</TabsTrigger>
            <TabsTrigger value="consult" className="text-xs sm:text-sm py-2 shrink-0">Consult</TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm py-2 shrink-0">Q&A</TabsTrigger>
          </TabsList>
        </div>

        {/* SUMMARY TAB */}
        <TabsContent value="summary" className="flex-1 overflow-y-auto p-4 m-0 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Document Type</h3>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-slate-900">{analysis.document_type || "Unknown"}</span>
            </div>
          </div>

          {analysis.document_summary && (
            <div className="space-y-2 bg-blue-50/50 border border-blue-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 uppercase tracking-wider">Overview</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{analysis.document_summary}</p>
            </div>
          )}

          {analysis.parties?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4 w-4" /> Parties
              </h3>
              <div className="grid gap-3">
                {analysis.parties.map((party: any, idx: number) => (
                  <div key={idx} className="flex flex-col p-3 border rounded-lg bg-slate-50">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-slate-900">{party.name}</span>
                      <PageBadge page={party.page} />
                    </div>
                    <span className="text-sm text-slate-600 mt-1">{party.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.important_dates?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Important Dates
              </h3>
              <div className="grid gap-2">
                {analysis.important_dates.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{item.date}</span>
                      <span className="text-xs text-slate-500">{item.significance}</span>
                    </div>
                    <PageBadge page={item.page} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.important_amounts?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Important Amounts
              </h3>
              <div className="grid gap-2">
                {analysis.important_amounts.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{item.amount}</span>
                      <span className="text-xs text-slate-500">{item.context}</span>
                    </div>
                    <PageBadge page={item.page} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* CLAUSES TAB */}
        <TabsContent value="clauses" className="flex-1 overflow-y-auto p-4 m-0">
          <div className="space-y-4">
            {analysis.important_clauses?.length > 0 ? analysis.important_clauses.map((clause: any, idx: number) => (
              <Card key={idx} className="shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Scale className="h-4 w-4 text-blue-600" />
                    {clause.clause_name}
                  </CardTitle>
                  <PageBadge page={clause.page} />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">{clause.summary}</p>
                </CardContent>
              </Card>
            )) : (
              <p className="text-sm text-slate-500 italic">No important clauses identified.</p>
            )}
          </div>
        </TabsContent>

        {/* ATTENTION TAB */}
        <TabsContent value="attention" className="flex-1 overflow-y-auto p-4 m-0">
          <div className="space-y-4">
            {analysis.attention_areas?.length > 0 ? analysis.attention_areas.map((area: any, idx: number) => {
              const isHighRisk = area.severity === "high" || area.risk_level === "high";
              return (
                <Card key={idx} className={`shadow-sm border-l-4 ${isHighRisk ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${isHighRisk ? 'text-red-500' : 'text-yellow-500'}`} />
                          {area.category || "Attention Required"}
                        </CardTitle>
                        <Badge variant="outline" className={`w-fit text-xs ${isHighRisk ? 'text-red-700 bg-red-50 border-red-200' : 'text-yellow-700 bg-yellow-50 border-yellow-200'}`}>
                          {area.severity || area.risk_level || "Medium"} Severity
                        </Badge>
                      </div>
                      <PageBadge page={area.source_page || area.page} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {area.description && <p className="text-sm font-medium text-slate-900">{area.description}</p>}
                    {area.explanation && <p className="text-sm text-slate-600">{area.explanation}</p>}
                    
                    {area.suggested_question && (
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-md mt-2">
                        <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Suggested Question</p>
                        <p className="text-sm text-blue-800 italic">"{area.suggested_question}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <AlertTriangle className="h-8 w-8 text-emerald-500 mb-3" />
                <h3 className="text-sm font-semibold text-slate-900">No Critical Risks Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                  The AI did not identify any immediate high-risk attention areas in this document.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* CHECKLIST TAB */}
        <TabsContent value="checklist" className="flex-1 flex flex-col overflow-hidden m-0">
          <AiAdvanced documentId={documentId} onPageSelect={onPageSelect} type="checklist" />
        </TabsContent>

        {/* CONSULT TAB */}
        <TabsContent value="consult" className="flex-1 flex flex-col overflow-hidden m-0">
          <AiAdvanced documentId={documentId} onPageSelect={onPageSelect} type="consult" />
        </TabsContent>

        {/* CHAT TAB */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
          <AiChat documentId={documentId} onPageSelect={onPageSelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
