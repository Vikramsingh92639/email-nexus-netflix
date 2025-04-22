
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Email } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmailDetailSidebarProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmailDetailSidebar = ({ email, isOpen, onClose }: EmailDetailSidebarProps) => {
  if (!email) return null;

  const cleanEmailBody = (body: string) => {
    // Remove style tags and their content
    let cleanedBody = body.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Preserve links and buttons with their href attributes
    cleanedBody = cleanedBody.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, 
      (match, quote, url) => `<a href=${quote}${url}${quote} class="text-blue-400 hover:text-blue-300 underline"`
    );
    
    // Remove other HTML tags but preserve links
    cleanedBody = cleanedBody.replace(/<(?!\/?a(?:\s|>))[^>]+>/g, ' ');
    
    // Clean up HTML entities and extra spaces
    return cleanedBody
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/@media[^{]*{[^}]*}/g, '')
      .replace(/{[^}]*}/g, '')
      .replace(/\.[a-zA-Z-]+\s*{[^}]*}/g, '')
      .replace(/style="[^"]*"/g, '')
      .replace(/class="[^"]*"/g, '')
      .replace(/&[^;]+;/g, '')
      .replace(/\.+/g, '.')
      .trim();
  };

  const handleDownload = () => {
    const cleanedBody = cleanEmailBody(email.body);
    const emailContent = `
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${new Date(email.date).toLocaleString()}

${cleanedBody}
    `.trim();

    const blob = new Blob([emailContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-${email.id.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90%] sm:w-[600px] bg-black text-white">
        <SheetHeader className="border-b border-gray-800 pb-4 flex flex-row justify-between items-center">
          <SheetTitle className="text-xl font-bold text-white">{email.subject}</SheetTitle>
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
          >
            <Download className="h-5 w-5" />
            Download
          </Button>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 mt-1 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">From:</p>
                <p className="text-base font-medium text-white">{email.from}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 mt-1 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">To:</p>
                <p className="text-base text-white">{email.to}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 mt-1 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">Date & Time:</p>
                <p className="text-base text-white">
                  {new Date(email.date).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <p className="text-sm font-medium text-gray-400 mb-4">Message:</p>
              <div className="prose prose-sm max-w-none bg-black rounded-lg p-6">
                <div 
                  className="whitespace-pre-wrap text-base text-white email-content"
                  dangerouslySetInnerHTML={{ __html: cleanEmailBody(email.body) }}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EmailDetailSidebar;

