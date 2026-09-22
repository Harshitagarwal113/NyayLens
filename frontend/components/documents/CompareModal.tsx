"use client";

import { useState } from "react";
import { GitCompare, Loader2, ArrowRightLeft, FileSearch, ArrowRight, ArrowDownToLine, Trash } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Document, ComparisonData } from "@nyaylens/shared";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CompareModalProps {
  documents: Document[];
}

export function CompareModal({ documents }: CompareModalProps) {
  const [open, setOpen] = useState(false);
  const [doc1Id, setDoc1Id] = useState<string>("");
  const [doc2Id, setDoc2Id] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [comparison, setComparison] = useState<ComparisonData | null>(null);

  const processedDocs = documents.filter(d => d.status === 'processed');

  const handleCompare = async () => {
    if (!doc1Id || !doc2Id || doc1Id === doc2Id) return;

    setIsLoading(true);
    setError("");
    setComparison(null);

    try {
      const response = await apiClient.post<ComparisonData>('/documents/compare', {
        documentId1: doc1Id,
        documentId2: doc2Id
      });
      setComparison(response);
    } catch (err: any) {
      setError(err.message || "Failed to compare documents");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setDoc1Id("");
    setDoc2Id("");
    setComparison(null);
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) reset();
    }}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2 bg-white" disabled={processedDocs.length < 2}>
            <GitCompare className="h-4 w-4" />
            Compare
          </Button>
        }
      />
      
      <DialogContent className="sm:max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-slate-50">
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-blue-600" />
            Document Comparison
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-50/50">
          {!comparison && !isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <ArrowRightLeft className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Select Documents</h3>
              <p className="text-sm text-slate-500 mb-8">
                Choose two processed documents to compare. The AI will analyze differences in clauses, values, and obligations.
              </p>

              <div className="w-full space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Base Document (Older)</label>
                  <select 
                    className="w-full border-slate-300 rounded-md shadow-sm text-sm p-2 bg-white border"
                    value={doc1Id}
                    onChange={(e) => setDoc1Id(e.target.value)}
                  >
                    <option value="">Select a document...</option>
                    {processedDocs.map(doc => (
                      <option key={doc.id} value={doc.id} disabled={doc.id === doc2Id}>{doc.filename}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Target Document (Newer)</label>
                  <select 
                    className="w-full border-slate-300 rounded-md shadow-sm text-sm p-2 bg-white border"
                    value={doc2Id}
                    onChange={(e) => setDoc2Id(e.target.value)}
                  >
                    <option value="">Select a document...</option>
                    {processedDocs.map(doc => (
                      <option key={doc.id} value={doc.id} disabled={doc.id === doc1Id}>{doc.filename}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 mt-4 bg-red-50 p-3 rounded-md border border-red-100 w-full">{error}</p>}

              <Button 
                className="mt-8 w-full" 
                size="lg" 
                disabled={!doc1Id || !doc2Id}
                onClick={handleCompare}
              >
                Run AI Comparison
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
              <p className="text-sm font-medium text-slate-900">Analyzing Document Differences...</p>
              <p className="text-xs mt-1">This may take a moment depending on document size.</p>
            </div>
          ) : comparison ? (
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              <div className="space-y-8 max-w-2xl mx-auto pb-12">
                
                {/* MODIFIED CLAUSES */}
                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <ArrowRightLeft className="h-5 w-5 text-blue-600" />
                    Modified Clauses
                  </h3>
                  {comparison.modified_clauses?.length > 0 ? (
                    <div className="space-y-4">
                      {comparison.modified_clauses.map((item, idx) => (
                        <div key={idx} className="bg-white border rounded-lg overflow-hidden shadow-sm">
                          <div className="bg-slate-50 px-4 py-2 border-b flex justify-between items-center">
                            <span className="font-semibold text-slate-900">{item.clause_name}</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{item.significance} Change</Badge>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Base Document</p>
                              <p className="text-sm text-slate-600 line-through decoration-red-300">{item.old_summary}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Document</p>
                              <p className="text-sm text-slate-900 bg-green-50 p-2 rounded -m-2">{item.new_summary}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No significant clause modifications found.</p>
                  )}
                </section>

                {/* ADDED CLAUSES */}
                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <ArrowDownToLine className="h-5 w-5 text-emerald-600" />
                    Added Clauses
                  </h3>
                  {comparison.added_clauses?.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.added_clauses.map((item, idx) => (
                        <div key={idx} className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-lg">
                          <span className="font-semibold text-emerald-900 block mb-1">{item.clause_name}</span>
                          <p className="text-sm text-emerald-800">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No new clauses were added.</p>
                  )}
                </section>

                {/* REMOVED CLAUSES */}
                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <Trash className="h-5 w-5 text-red-600" />
                    Removed Clauses
                  </h3>
                  {comparison.removed_clauses?.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.removed_clauses.map((item, idx) => (
                        <div key={idx} className="bg-red-50/50 border border-red-100 p-4 rounded-lg">
                          <span className="font-semibold text-red-900 block mb-1 line-through">{item.clause_name}</span>
                          <p className="text-sm text-red-800 opacity-80">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No clauses were removed.</p>
                  )}
                </section>

                {/* VALUE CHANGES */}
                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                    <FileSearch className="h-5 w-5 text-purple-600" />
                    Important Value Changes
                  </h3>
                  {comparison.important_value_changes?.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.important_value_changes.map((item, idx) => (
                        <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="font-semibold text-slate-900 block">{item.item}</span>
                            <span className="text-xs text-slate-500">{item.implication}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 bg-slate-50 p-2 rounded-md border">
                            <span className="text-sm font-medium text-slate-500 line-through">{item.old_value}</span>
                            <ArrowRight className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-900">{item.new_value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No significant value changes found.</p>
                  )}
                </section>
                
                <div className="flex justify-center pt-8">
                  <Button variant="outline" onClick={() => setComparison(null)}>
                    Compare Different Documents
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
