import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClickToCallProps {
  phoneNumber: string | null | undefined;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  showNumber?: boolean;
}

export function ClickToCall({
  phoneNumber,
  className,
  variant = "default",
  size = "default",
  showIcon = true,
  showNumber = true,
}: ClickToCallProps) {
  if (!phoneNumber) return null;

  const cleanNumber = phoneNumber.replace(/\s/g, "");
  const formattedNumber = phoneNumber;

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn("touch-target", className)}
      data-testid="click-to-call"
    >
      <a href={`tel:${cleanNumber}`} className="flex items-center gap-2">
        {showIcon && <Phone className="h-4 w-4" />}
        {showNumber && <span>{formattedNumber}</span>}
        {!showNumber && <span className="sr-only">Call {formattedNumber}</span>}
      </a>
    </Button>
  );
}

interface ClickToCallIconProps {
  phoneNumber: string | null | undefined;
  className?: string;
}

export function ClickToCallIcon({ phoneNumber, className }: ClickToCallIconProps) {
  if (!phoneNumber) return null;

  const cleanNumber = phoneNumber.replace(/\s/g, "");

  return (
    <a
      href={`tel:${cleanNumber}`}
      className={cn(
        "inline-flex items-center justify-center w-11 h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors touch-target",
        className
      )}
      aria-label={`Call ${phoneNumber}`}
      data-testid="click-to-call-icon"
    >
      <Phone className="h-5 w-5" />
    </a>
  );
}