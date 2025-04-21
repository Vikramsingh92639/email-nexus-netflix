
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Email } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Clock, User } from "lucide-react";

interface EmailDetailSidebarProps {
  email: Email | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmailDetailSidebar = ({ email, isOpen, onClose }: EmailDetailSidebarProps) => {
  if (!email) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90%] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle>{email.subject}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 mt-0.5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">From:</p>
                <p className="text-base">{email.from}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 mt-0.5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">To:</p>
                <p className="text-base">{email.to}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 mt-0.5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Date & Time:</p>
                <p className="text-base">
                  {new Date(email.date).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-500 mb-3">Message:</p>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-base">{email.body}</div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EmailDetailSidebar;
