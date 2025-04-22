
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Email } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, User, Download } from "lucide-react";

interface EmailDetailSidebarProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmailDetailSidebar = ({ email, isOpen, onClose }: EmailDetailSidebarProps) => {
  if (!email) return null;

  const handleDownload = () => {
    // Create email content in text format
    const emailContent = `
From: ${email.from}
To: ${email.to}
Subject: ${email.subject}
Date: ${new Date(email.date).toLocaleString()}

${email.body}
    `.trim();

    // Create a blob and download it
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
      <SheetContent className="w-[90%] sm:w-[600px]">
        <SheetHeader className="border-b pb-4 flex flex-row justify-between items-center">
          <SheetTitle className="text-xl font-bold text-gray-800">{email.subject}</SheetTitle>
          <button 
            onClick={handleDownload}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors gap-1"
            title="Download email"
          >
            <Download className="h-5 w-5" />
            <span className="text-sm font-medium">Download</span>
          </button>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-6">
            {/* Sender Information */}
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 mt-1 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">From:</p>
                <p className="text-base font-medium text-gray-800">{email.from}</p>
              </div>
            </div>

            {/* Recipient Information */}
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 mt-1 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">To:</p>
                <p className="text-base text-gray-800">{email.to}</p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 mt-1 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Date & Time:</p>
                <p className="text-base text-gray-800">
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

            {/* Email Body */}
            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-500 mb-4">Message:</p>
              <div className="prose prose-sm max-w-none bg-white rounded-lg p-6 shadow-sm">
                <div className="whitespace-pre-wrap text-base text-gray-800">
                  {email.body}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EmailDetailSidebar;
