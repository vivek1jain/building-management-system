"use client";

import * as React from 'react';
import { Toaster as ShadToaster } from "@/components/ui/toaster"; // Original Toaster

export function ClientToaster() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Don't render anything on the server or before client mount
  }

  return <ShadToaster />;
}
