import { cn } from "@/lib/utils";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

function MainContent({ children, className }: MainContentProps) {
  return (
    <main
      className={cn(
        "flex-1 flex flex-col min-h-0 min-w-0 bg-white border border-border-light rounded-xl overflow-hidden",
        className
      )}
    >
      {children}
    </main>
  );
}

export default MainContent;

