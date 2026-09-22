"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface PdfViewerProps {
  url: string;
  currentPage?: number;
}

export function PdfViewer({ url, currentPage }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState(url);

  useEffect(() => {
    // Append page hash to URL if a page is selected to trigger browser PDF scrolling
    if (currentPage) {
      // Create a URL object to cleanly manage hashes
      try {
        const urlObj = new URL(url);
        urlObj.hash = `page=${currentPage}`;
        setIframeUrl(urlObj.toString());
      } catch (e) {
        // Fallback for simple paths
        setIframeUrl(`${url}#page=${currentPage}`);
      }
    } else {
      setIframeUrl(url);
    }
  }, [url, currentPage]);

  return (
    <div className="relative w-full h-full bg-slate-100 flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-medium">Loading document...</span>
          </div>
        </div>
      )}
      
      <iframe
        src={iframeUrl}
        className="w-full h-full border-0 shadow-inner flex-1"
        title="PDF Document Viewer"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
