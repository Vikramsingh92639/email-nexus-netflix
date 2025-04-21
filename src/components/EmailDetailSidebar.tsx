
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Email } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

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
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-gray-500">From:</p>
              <p>{email.from}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-gray-500">Date:</p>
              <p>{new Date(email.date).toLocaleString()}</p>
            </div>
            <div className="flex flex-col space-y-1">
              <p className="text-sm text-gray-500">Message:</p>
              <div className="whitespace-pre-wrap">{email.body}</div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EmailDetailSidebar;
