"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  url: string;
}

export default function CopyButton({ url }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </>
      )}
    </Button>
  );
} 