// components/Layout/Footer.tsx
export const Footer = () => {
  return (
    <footer className="w-full bg-background/80 border-t border-muted p-4 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} BOUNT-DEV - Entreprendre Durablement
    </footer>
  );
};
