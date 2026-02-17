import { useCallback, useState, useTransition } from "react";
import { Save } from "lucide-react";
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
import { PromptTemplate, Variable } from "@/components/ui/PromptBox/types";

// components
import { SaveTemplateAlert } from "./Alert";

// server actions
import {
  insertPromptTemplate,
  updatePromptTemplate,
} from "@/lib/storage/index";

interface SaveTemplateProps {
  templates: PromptTemplate[];
  content: string;
  type: "system" | "user";
  variables: Variable[];
  onTemplateSaved: (template: PromptTemplate) => void;
}

export function SaveTemplate({
  content,
  type,
  variables,
  templates,
  onTemplateSaved,
}: SaveTemplateProps) {
  // local state management
  const [templateName, setTemplateName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<PromptTemplate | null>(
    null
  );

  // builds a PromptTemplate object from the current prompt, variables, and template name.
  const buildTemplate = useCallback(
    (variables: Variable[]): PromptTemplate | null => {
      const trimmedName = templateName.trim();
      if (!trimmedName) {
        return null;
      }

      // ensure all keys are not empty
      const validVariables = variables.filter((v) => v.key.trim() !== "");

      return {
        name: trimmedName,
        type,
        content,
        variables_json: JSON.stringify(validVariables),
      };
    },
    [content, templateName, type]
  );

  const insertTemplate = useCallback(
    async (newTemplate: PromptTemplate) => {
      try {
        const data = {
          name: newTemplate.name,
          type: newTemplate.type,
          content: newTemplate.content,
          variables_json: newTemplate.variables_json,
        };
        const insertedId = await insertPromptTemplate(data);

        const templateWithId: PromptTemplate = {
          ...newTemplate,
          // assume the insert action returns an object with the generated `id`
          id: insertedId,
        };
        onTemplateSaved(templateWithId);
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to save template:", error);
      }
    },
    [onTemplateSaved]
  );

  const updateTemplate = useCallback(
    async (template: PromptTemplate) => {
      try {
        const data = {
          content: template.content || "",
          variables_json: template.variables_json || "[]",
        };
        await updatePromptTemplate(template.id || "", data);
        onTemplateSaved(template);
        setIsOpen(false);
      } catch (error) {
        console.error("Failed to update template:", error);
      }
    },
    [onTemplateSaved]
  );

  const [_, startTransition] = useTransition();

  const handleSaveTemplate = useCallback(() => {
    const newTemplate = buildTemplate(variables);
    if (!newTemplate) {
      return;
    }

    const existingTemplate = templates.find((t) => t.name === newTemplate.name);
    if (existingTemplate) {
      setPendingTemplate({
        ...existingTemplate,
        content: newTemplate.content,
        variables_json: newTemplate.variables_json,
      });
      setIsAlertOpen(true);
      return;
    }

    startTransition(async () => {
      await insertTemplate(newTemplate);
    });
  }, [buildTemplate, insertTemplate, startTransition, templates, variables]);

  const handleAlertConfirm = useCallback(async () => {
    if (!pendingTemplate) {
      return;
    }

    setIsAlertOpen(false);
    setPendingTemplate(null);
    startTransition(async () => {
      await updateTemplate(pendingTemplate);
    });
  }, [pendingTemplate, startTransition, updateTemplate]);

  const handleAlertCancel = useCallback(() => {
    setIsAlertOpen(false);
    setPendingTemplate(null);
  }, []);

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
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-primary transition-colors"
          >
            <Save size={14} />
            SAVE AS TEMPLATE
          </button>
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
