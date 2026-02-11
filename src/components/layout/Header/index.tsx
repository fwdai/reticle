function Header({ children }: { children: React.ReactNode }) {

  return (
    <header className="h-14 border-b border-border-light flex items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10 rounded-t-xl">
      {children}
    </header>
  );
}

export default Header;

