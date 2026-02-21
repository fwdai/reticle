import { useState, useEffect, useRef } from "react";
import { wait } from "@/lib/helpers/time";
import { easeOutCubic } from "@/lib/helpers/animation";
import { mockExecution } from "./constants";
import type { AgentExecutionStatus, StepPhase, StepType } from "@/types";

export function useExecutionAnimation(
  status: AgentExecutionStatus,
  filter: StepType | "all",
  scrollRef: React.RefObject<HTMLDivElement | null>
) {
  const [stepPhases, setStepPhases] = useState<Map<string, StepPhase>>(new Map());
  const [lineProgress, setLineProgress] = useState<Map<string, number>>(new Map());
  const animRef = useRef<number>(0);

  const steps =
    filter === "all" ? mockExecution : mockExecution.filter((s) => s.type === filter);

  useEffect(() => {
    if (status === "idle") return;

    setStepPhases(new Map());
    setLineProgress(new Map());
    animRef.current++;
    const runId = animRef.current;

    const animate = async () => {
      for (let i = 0; i < steps.length; i++) {
        if (animRef.current !== runId) return;
        const step = steps[i];

        setStepPhases((prev) => new Map(prev).set(step.id, "appearing"));
        await wait(150);
        if (animRef.current !== runId) return;

        setStepPhases((prev) => new Map(prev).set(step.id, "processing"));
        await wait(step.processingMs || 500);
        if (animRef.current !== runId) return;

        setStepPhases((prev) => new Map(prev).set(step.id, "done"));

        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        });

        if (i < steps.length - 1) {
          const LINE_DURATION = 250;
          const LINE_FRAMES = 20;
          for (let f = 0; f <= LINE_FRAMES; f++) {
            if (animRef.current !== runId) return;
            const progress = easeOutCubic(f / LINE_FRAMES);
            setLineProgress((prev) => new Map(prev).set(step.id, progress));
            await wait(LINE_DURATION / LINE_FRAMES);
          }
        }
      }
    };

    const t = window.setTimeout(() => animate(), 300);
    return () => {
      clearTimeout(t);
      animRef.current++;
    };
  }, [status, filter, steps.length]);

  return { stepPhases, lineProgress };
}
