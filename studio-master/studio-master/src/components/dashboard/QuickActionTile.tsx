
"use client";

import type { FC } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionTileProps {
  icon: LucideIcon;
  label: string;
  className?: string;
  onClick?: () => void;
  href?: string;
  iconSize?: string;
  iconClassName?: string; 
  cardClassName?: string;
  contentClassName?: string;
  showLabel?: boolean; // New prop
}

export const QuickActionTile: FC<QuickActionTileProps> = ({
  href,
  icon: Icon,
  label,
  className,
  onClick,
  iconSize: explicitIconSize, // Renamed to avoid conflict with default logic
  iconClassName,
  cardClassName,
  contentClassName: explicitContentClassName,
  showLabel = false, // Default to false (icon-only)
}) => {
  // Determine default sizes and paddings based on showLabel
  const defaultIconSize = showLabel ? "h-5 w-5" : "h-8 w-8";
  const finalIconSize = explicitIconSize || defaultIconSize;

  const defaultContentClassName = showLabel ? "p-3" : "p-1"; // Adjusted default based on label presence
  const finalContentClassName = explicitContentClassName || defaultContentClassName;

  const tileContent = (
    <CardContent
      className={cn(
        "flex flex-grow",
        showLabel ? "flex-row items-center justify-start text-left" : "flex-col items-center justify-center text-center",
        finalContentClassName
      )}
    >
      <Icon className={cn(
        "text-muted-foreground group-hover:text-primary transition-colors",
        showLabel && "mr-2", // Margin only if label is shown
        finalIconSize,
        iconClassName
      )} aria-hidden={showLabel} />
      {showLabel && <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</p>}
    </CardContent>
  );

  const interactiveElementBaseClasses = "block w-full h-full text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(interactiveElementBaseClasses, className)}
        aria-label={!showLabel ? label : undefined} // Only add aria-label if label is not visually present
      >
        <Card className={cn("group hover:border-primary hover:shadow-md transition-all duration-200 flex flex-col h-full", cardClassName)}>
          {tileContent}
        </Card>
      </button>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={cn(interactiveElementBaseClasses, className)}
        aria-label={!showLabel ? label : undefined} // Only add aria-label if label is not visually present
      >
        <Card className={cn("group hover:border-primary hover:shadow-md transition-all duration-200 flex flex-col h-full", cardClassName)}>
          {tileContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cn("group flex flex-col h-full opacity-50 cursor-not-allowed", cardClassName)}>
      {tileContent}
       <p className="text-xs text-destructive text-center pb-1">No action</p>
    </Card>
  );
};
