import { useState, useEffect, useRef } from "react";
import { wait } from "@/lib/helpers/time";
import { easeOutCubic } from "@/lib/helpers/animation";
import type { AgentExecutionStatus, ExecutionStep, StepPhase, StepType } from "@/types";

export function useExecutionAnimation(
  status: AgentExecutionStatus,
  steps: ExecutionStep[],
  filter: StepType | "all",
  scrollRef: React.RefObject<HTMLDivElement | null>
) {
  const [stepPhases, setStepPhases] = useState<Map<string, StepPhase>>(new Map());
  const [lineProgress, setLineProgress] = useState<Map<string, number>>(new Map());
  const animRef = useRef<number>(0);
  const cameFromRunning = useRef(false);

  const filteredSteps =
    filter === "all" ? steps : steps.filter((s) => s.type === filter);

  // Reset everything when going back to idle
  useEffect(() => {
    if (status === "idle") {
      animRef.current++;
      cameFromRunning.current = false;
      setStepPhases(new Map());
      setLineProgress(new Map());
    }
  }, [status]);

  // During live execution: show each arriving step immediately
  useEffect(() => {
    if (status !== "running") return;
    cameFromRunning.current = true;

    setStepPhases((prev) => {
      const next = new Map(prev);
      for (const step of filteredSteps) {
        if (!next.has(step.id)) next.set(step.id, "done");
      }
      return next;
    });
    setLineProgress((prev) => {
      const next = new Map(prev);
      for (const step of filteredSteps) {
        if (!next.has(step.id)) next.set(step.id, 1);
      }
      return next;
    });

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filteredSteps.length]);

  // Historical load (idle → success/error): animate steps sequentially
  useEffect(() => {
    if (status === "idle" || status === "running") return;
    if (filteredSteps.length === 0) return;
    // If execution just finished streaming, steps are already visible — skip
    if (cameFromRunning.current) return;

    animRef.current++;
    const runId = animRef.current;

    setStepPhases(new Map());
    setLineProgress(new Map());

    const animate = async () => {
      for (let i = 0; i < filteredSteps.length; i++) {
        if (animRef.current !== runId) return;
        const step = filteredSteps[i];

        setStepPhases((prev) => new Map(prev).set(step.id, "appearing"));
        await wait(150);
        if (animRef.current !== runId) return;

        setStepPhases((prev) => new Map(prev).set(step.id, "processing"));
        await wait(step.processingMs || 300);
        if (animRef.current !== runId) return;

        setStepPhases((prev) => new Map(prev).set(step.id, "done"));
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        });

        if (i < filteredSteps.length - 1) {
          const LINE_DURATION = 250;
          const LINE_FRAMES = 20;
          for (let f = 0; f <= LINE_FRAMES; f++) {
            if (animRef.current !== runId) return;
            setLineProgress((prev) =>
              new Map(prev).set(step.id, easeOutCubic(f / LINE_FRAMES))
            );
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
  // Re-run when filter changes during a historical view
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filter, filteredSteps.length]);

  return { stepPhases, lineProgress };
}
