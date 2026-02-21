import * as React from "react";

import { cn } from "@/lib/utils";

const nativeSelectStyles =
  "w-full px-4 py-2.5 rounded-lg border border-border-light bg-white text-sm text-text-main shadow-none transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat";

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(nativeSelectStyles, className)}
        {...props}
      >
        {children}
      </select>
    );
  }
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect, nativeSelectStyles };
