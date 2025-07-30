
"use client";

// This component is no longer used in the auth-free application.
// Its functionality is removed to prevent any potential errors.

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const handleSignOut = () => {
    console.warn("SignOutButton clicked, but authentication is disabled.");
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Logout" disabled>
        <LogOut className="h-5 w-5 text-foreground" />
    </Button>
  );
}
