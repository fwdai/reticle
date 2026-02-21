import React, { useState } from 'react';
import { Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface NewCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

const NewCollectionModal: React.FC<NewCollectionModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [collectionName, setCollectionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setShowError(false);
    }
    onClose();
  };

  const handleCreate = async () => {
    if (collectionName.trim() === '') {
      setShowError(true);
      return;
    }
    setShowError(false);
    setIsLoading(true);
    await onCreate(collectionName.trim());
    setIsLoading(false);
    setCollectionName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] overflow-hidden border-border-light shadow-glow-sm">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
        <DialogHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Folder className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                New collection
              </DialogTitle>
              <DialogDescription className="text-sm text-text-muted">
                Organize your scenarios into a collection
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <FieldGroup className="py-2">
          <Field>
            <Label htmlFor="collection-name">
              Name
            </Label>
            <Input
              id="collection-name"
              placeholder="e.g. Marketing, Sales, Design"
              value={collectionName}
              onChange={(e) => {
                setCollectionName(e.target.value);
                if (showError) setShowError(false);
              }}
              disabled={isLoading}
              className={cn(
                'mt-1.5',
                showError &&
                'border-destructive focus-visible:ring-destructive text-destructive placeholder:text-destructive/50'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
          </Field>
        </FieldGroup>
        <DialogFooter className="gap-2 pt-4 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowError(false);
              onClose();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create collection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
};

export default NewCollectionModal;
