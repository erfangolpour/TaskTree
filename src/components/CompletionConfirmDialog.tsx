import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog';

interface CompletionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onConfirm: () => void;
}

export const CompletionConfirmDialog: React.FC<CompletionConfirmDialogProps> = ({
  open,
  onOpenChange,
  taskTitle,
  onConfirm,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete Parent Task?</AlertDialogTitle>
          <AlertDialogDescription>
            All subtasks for "{taskTitle}" are completed. Would you like to mark this task as complete as well?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>No, keep it incomplete</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Yes, complete it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};