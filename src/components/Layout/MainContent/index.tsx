function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex flex-col min-h-0 min-w-0 bg-white border border-border-light rounded-xl overflow-hidden">
      {children}
    </main>
  );
}

export default MainContent;

