import { useState, useTransition } from "react";
// shadcn components and types
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// types
import { Template } from "@/components/ui/PromptBox/types";

// components
import { SaveTemplateAlert } from "./Alert";

// server actions
import { invoke } from "@tauri-apps/api/core";

interface SaveTemplateProps {
  templates: Template[];
  prompt: string;
  variables: { id: number; key: string; value: string }[];
  setTemplates: (templates: Template[]) => void;
  setSelectedTemplateName: (name: string) => void;
}

export function SaveTemplate({
  prompt,
  variables,
  templates,
  setTemplates,
  setSelectedTemplateName,
}: SaveTemplateProps) {
  // local state management
  const [templateName, setTemplateName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null);

  //builds a Template object from the current prompt, variables, and template name.
  const buildTemplate = (): Template | null => {
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      return null;
    }

    return {
      name: trimmedName,
      prompt: prompt,
      variables,
    };
  };

  const persistTemplate = async (newTemplate: Template) => {
    try {
      const finalUpdatedTemplates = [
        ...templates.filter((t) => t.name !== newTemplate.name),
        newTemplate,
      ];
      setTemplates(finalUpdatedTemplates);
      localStorage.setItem(
        "promptTemplates",
        JSON.stringify(finalUpdatedTemplates)
      );
      console.log("Saving template to database:", newTemplate);
      await invoke("db_insert_cmd", {
        table: "templates",
        data: {
          name: newTemplate.name,
          prompt: newTemplate.prompt,
          variables: JSON.stringify(newTemplate.variables),
        },
      });
      setSelectedTemplateName(newTemplate.name);
      setIsOpen(false);
      setTemplateName("");
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const [isPending, startTransition] = useTransition();

  const handleSaveTemplate = () => {
    const newTemplate = buildTemplate();
    if (!newTemplate) {
      return;
    }

    if (templates.some((t) => t.name === newTemplate.name)) {
      setPendingTemplate(newTemplate);
      setIsAlertOpen(true);
      return;
    }

    startTransition(async () => {
      await persistTemplate(newTemplate);
    });
  };

  const handleAlertConfirm = async () => {
    if (!pendingTemplate) {
      return;
    }

    setIsAlertOpen(false);
    setPendingTemplate(null);
    startTransition(async () => {
      await persistTemplate(pendingTemplate);
    });
  };

  const handleAlertCancel = () => {
    setIsAlertOpen(false);
    setPendingTemplate(null);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setTemplateName("");
            setPendingTemplate(null);
            setIsAlertOpen(false);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-primary transition-colors"
            variant="outline"
          >
            SAVE AS TEMPLATE
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Enter a name for your template and click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">Name</Label>
              <Input
                id="name-1"
                name="name"
                placeholder="Cool template"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveTemplate}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SaveTemplateAlert
        isOpen={isAlertOpen}
        onOpenChange={setIsAlertOpen}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
        templateName={pendingTemplate?.name ?? templateName.trim()}
      />
    </>
  );
}
