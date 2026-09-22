"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { AskQuestionResponseData, Citation } from "@nyaylens/shared";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Alert, AlertDescription } from "@/components/ui/alert";

interface AiChatProps {
  documentId: string;
  onPageSelect: (page: number) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isInsufficient?: boolean;
}

export function AiChat({ documentId, onPageSelect }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I have analyzed this document. Ask me any questions about its contents, and I will answer strictly based on the text."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await apiClient.post<AskQuestionResponseData>(
        `/documents/${documentId}/ask`,
        { question: userMsg }
      );

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.answer,
        citations: response.citations,
        isInsufficient: response.isInsufficientContext
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error while trying to answer your question. Please try again.",
        isInsufficient: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="flex flex-col gap-4 pb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
              <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}`}>
                {msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              
              <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-3 rounded-2xl ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-900 rounded-tl-sm shadow-sm"}`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {msg.role === "assistant" && idx > 0 && !isLoading && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50/50 -mx-2 -mb-1 px-2 pb-1 rounded-b-xl">
                      <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-500" />
                      <p><strong>Note:</strong> This is an AI-generated summary for informational assistance. It does not constitute formal legal advice.</p>
                    </div>
                  )}
                </div>
                
                {msg.isInsufficient && (
                  <Alert variant="destructive" className="py-2 px-3 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-xs text-red-800 ml-2">
                      I cannot find enough evidence in the document to answer this definitively.
                    </AlertDescription>
                  </Alert>
                )}

                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.citations.map((cite, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="text-xs cursor-pointer hover:bg-blue-100 hover:text-blue-800 transition-colors"
                        onClick={() => onPageSelect(cite.pageNumber)}
                      >
                        [Pg {cite.pageNumber}]
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="shrink-0 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-500 rounded-tl-sm shadow-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing document...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this document..."
            className="pr-12 rounded-full border-slate-300 focus-visible:ring-blue-500 shadow-sm"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
          AI Answers are evidence-based but not legal advice
        </p>
      </div>
    </div>
  );
}
