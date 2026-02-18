function Header({ children }: { children: React.ReactNode }) {

  return (
    <header className="h-14 min-h-[3.5rem] flex-shrink-0 border-b border-border-light flex items-center justify-between gap-4 px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10 rounded-t-xl flex-nowrap">
      {children}
    </header>
  );
}

export default Header;

