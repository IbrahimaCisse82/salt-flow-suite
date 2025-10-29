import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans un input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + K : Recherche
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        toast({
          title: "Raccourci recherche",
          description: "Fonctionnalité de recherche à venir",
        });
      }

      // Alt + chiffre : Navigation rapide
      if (e.altKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            navigate("/");
            break;
          case "2":
            e.preventDefault();
            navigate("/bassins");
            break;
          case "3":
            e.preventDefault();
            navigate("/production");
            break;
          case "4":
            e.preventDefault();
            navigate("/commercial");
            break;
          case "5":
            e.preventDefault();
            navigate("/comptabilite");
            break;
          case "6":
            e.preventDefault();
            navigate("/equipes");
            break;
        }
      }

      // ? : Afficher les raccourcis
      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault();
        toast({
          title: "Raccourcis clavier",
          description: "Alt+1-6 : Navigation • Ctrl+K : Recherche",
          duration: 5000,
        });
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate, toast]);
};
