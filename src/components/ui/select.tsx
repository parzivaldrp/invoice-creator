"use client"; // Required for Next.js App Router (hooks used)

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";

/*
 * Lightweight Select primitive.
 *
 * Why this exists / why a rewrite was needed
 * ------------------------------------------
 * The previous implementation rendered <SelectContent /> inline as a
 * sibling of the trigger, with no open/close gating. That meant every
 * dropdown's items were always visible in the page flow, which:
 *   1. Dumped the items list into the toolbar UI on load.
 *   2. Made the dropdown's grid cell very tall, which in turn
 *      stretched its row neighbours (e.g. the search input) and pushed
 *      the absolutely-positioned search icon halfway down the page
 *      because it was anchored to top-1/2 of a now-oversized cell.
 *
 * The fix is to use Context so the trigger and content actually share
 * one piece of `isOpen` state, and SelectContent only mounts when open.
 * This is intentionally minimal — no portals, no popper, no floating-ui
 * — because the consumer's footprint is small (just /myInvoice).
 */

interface SelectContextValue {
  value: string | undefined;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext(component: string) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) {
    throw new Error(`<${component}> must be rendered inside <Select>`);
  }
  return ctx;
}

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Select({ children, value, onValueChange }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleChange = React.useCallback(
    (newValue: string) => {
      onValueChange?.(newValue);
      setIsOpen(false);
    },
    [onValueChange]
  );

  const contextValue = React.useMemo<SelectContextValue>(
    () => ({
      value,
      onValueChange: handleChange,
      isOpen,
      setIsOpen,
    }),
    [value, handleChange, isOpen]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      {/* `relative` is the anchor for the absolute-positioned dropdown.
          Width is intentionally inherited from the parent (the consumer
          decides layout). */}
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ className = "", children, ...props }, ref) => {
  const { isOpen, setIsOpen } = useSelectContext("SelectTrigger");

  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      onClick={() => setIsOpen(!isOpen)}
      className={`flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {/* Wrap consumer children so an icon + label stay glued together
          and don't get pushed apart by the button's justify-between. */}
      <span className="flex flex-1 items-center gap-2 min-w-0 text-left truncate">
        {children}
      </span>
      <ChevronDown
        className={`h-4 w-4 shrink-0 opacity-50 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { value } = useSelectContext("SelectValue");
  // Render placeholder in muted color when nothing is selected — matches
  // the visual treatment of native <select> placeholders.
  if (!value) {
    return <span className="block truncate text-slate-500">{placeholder}</span>;
  }
  return <span className="block truncate">{value}</span>;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = "" }: SelectContentProps) {
  const { isOpen, setIsOpen } = useSelectContext("SelectContent");

  // Mount nothing when closed — this is the whole point of the rewrite.
  if (!isOpen) return null;

  return (
    <>
      {/* Click-away backdrop. Fixed so it covers the viewport regardless
          of the trigger's container scroll. */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <div
        role="listbox"
        className={`absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg ${className}`}
      >
        {children}
      </div>
    </>
  );
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function SelectItem({ children, value, className = "" }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelectContext("SelectItem");
  const isSelected = selectedValue === value;

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => onValueChange(value)}
      className={`relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm py-2 pl-3 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${
        isSelected ? "bg-slate-100 font-medium" : ""
      } ${className}`}
    >
      <span className="truncate">{children}</span>
      {isSelected && <Check className="h-4 w-4 shrink-0 text-slate-600" />}
    </div>
  );
}
