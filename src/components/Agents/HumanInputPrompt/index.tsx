import { useState } from "react";
import { cn } from "@/lib/utils";
import type { HumanInputConfig, HumanInputSubmitPayload } from "@/types";
import { HumanInputPromptHeader } from "@/components/Agents/HumanInputPrompt/HumanInputPromptHeader";
import { HumanInputSubmitted } from "@/components/Agents/HumanInputPrompt/HumanInputSubmitted";
import { ConfirmWidget } from "@/components/Agents/HumanInputPrompt/widgets/ConfirmWidget";
import { ChoiceWidget } from "@/components/Agents/HumanInputPrompt/widgets/ChoiceWidget";
import { TextWidget } from "@/components/Agents/HumanInputPrompt/widgets/TextWidget";
import { CredentialsWidget } from "@/components/Agents/HumanInputPrompt/widgets/CredentialsWidget";
import { ToggleWidget } from "@/components/Agents/HumanInputPrompt/widgets/ToggleWidget";

export interface HumanInputPromptProps {
  config: HumanInputConfig;
  onSubmit: (response: HumanInputSubmitPayload) => void;
  onDismiss?: () => void;
  isAnimating?: boolean;
}

export function HumanInputPrompt({
  config,
  onSubmit,
  isAnimating = false,
}: HumanInputPromptProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [toggleValue, setToggleValue] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (value: string | boolean) => {
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
      onSubmit({ widgetType: config.widgetType, value });
    }, 600);
  };

  if (submitted) {
    return <HumanInputSubmitted />;
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-500",
        "border-amber-500/25 bg-gradient-to-br from-amber-500/[0.04] via-white to-white",
        isAnimating && "animate-in fade-in-0 duration-300",
      )}
      style={{
        boxShadow:
          "0 0 24px -8px rgb(245 158 11 / 0.12), 0 1px 3px rgb(245 158 11 / 0.06)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent animate-pulse" />
      </div>

      <HumanInputPromptHeader config={config} />

      <div className="px-4 pb-4 pt-1">
        {config.widgetType === "confirm" && (
          <ConfirmWidget
            confirmLabel={config.confirmLabel || "Confirm"}
            cancelLabel={config.cancelLabel || "Cancel"}
            submitting={submitting}
            onConfirm={() => handleSubmit(true)}
            onCancel={() => handleSubmit(false)}
          />
        )}

        {config.widgetType === "choice" && config.options && config.options.length > 0 && (
          <ChoiceWidget
            options={config.options}
            selected={selectedOption}
            onSelect={setSelectedOption}
            submitting={submitting}
            onSubmit={() => selectedOption && handleSubmit(selectedOption)}
          />
        )}

        {config.widgetType === "choice" && (!config.options || config.options.length === 0) && (
          <p className="mt-2 text-[11px] text-text-muted">
            No options were provided. Ask the model to call this tool again with an{" "}
            <code className="font-mono text-[10px]">options</code> array, or use widgetType{" "}
            <code className="font-mono text-[10px]">text</code>.
          </p>
        )}

        {config.widgetType === "text" && (
          <TextWidget
            value={textValue}
            onChange={setTextValue}
            placeholder={config.placeholder}
            submitting={submitting}
            onSubmit={() => textValue.trim() && handleSubmit(textValue.trim())}
          />
        )}

        {config.widgetType === "credentials" && (
          <CredentialsWidget
            submitting={submitting}
            onSubmit={() => handleSubmit("credentials_linked")}
          />
        )}

        {config.widgetType === "toggle" && (
          <ToggleWidget
            value={toggleValue}
            onChange={setToggleValue}
            options={config.options}
            submitting={submitting}
            onSubmit={() => handleSubmit(String(toggleValue))}
          />
        )}
      </div>
    </div>
  );
}
