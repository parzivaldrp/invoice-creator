"use client"; // ✅ Required for Next.js App Router (hooks used)

import * as React from "react";
import { ChevronDown } from "lucide-react";

// 🔹 Types
interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectValueProps {
  placeholder?: string;
  value?: string;
  currentValue?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  currentValue?: string;
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  onValueChange?: (value: string) => void;
  currentValue?: string;
}

// 🔹 Select
const Select = React.forwardRef<HTMLDivElement, SelectProps>(
    ({ children, value, onValueChange }, ref) => {
      return (
        <div className="relative" ref={ref}>
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;

            if (
              React.isValidElement<SelectTriggerProps>(child) &&
              child.type === SelectTrigger
            ) {
              return React.cloneElement(child, {
                value,
                onValueChange,
              });
            }

            if (
              React.isValidElement<SelectContentProps>(child) &&
              child.type === SelectContent
            ) {
              return child; // handled by SelectTrigger when open
            }

            return child;
          })}
        </div>
      );
    }
  );
  

// 🔹 SelectTrigger
const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = "", children, value, onValueChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [currentValue, setCurrentValue] = React.useState(value);

    React.useEffect(() => {
      setCurrentValue(value);
    }, [value]);

    const handleClick = () => {
      setIsOpen(!isOpen);
    };

    return (
      <>
        <button
          ref={ref}
          className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
          onClick={handleClick}
          type="button"
          {...props}
        >
          {children}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-slate-200 bg-white shadow-lg">
              {React.Children.map(children, (child) => {
                if (
                  React.isValidElement<SelectContentProps>(child) &&
                  child.type === SelectContent
                ) {
                  return React.cloneElement(child, {
                    onValueChange: (newValue: string) => {
                      setCurrentValue(newValue);
                      onValueChange?.(newValue);
                      setIsOpen(false);
                    },
                    currentValue,
                  });
                }
                return null;
              })}
            </div>
          </>
        )}
      </>
    );
  }
);

// 🔹 SelectValue
const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  value,
  currentValue,
}) => {
  return (
    <span className="block truncate">{currentValue || value || placeholder}</span>
  );
};

// 🔹 SelectContent
const SelectContent: React.FC<SelectContentProps> = ({
  children,
  onValueChange,
  currentValue,
}) => {
  return (
    <div className="max-h-60 overflow-auto p-1">
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement<SelectItemProps>(child) &&
          child.type === SelectItem
        ) {
          return React.cloneElement(child, { onValueChange, currentValue });
        }
        return child;
      })}
    </div>
  );
};

// 🔹 SelectItem
const SelectItem: React.FC<SelectItemProps> = ({
  children,
  value,
  onValueChange,
  currentValue,
}) => {
  const isSelected = currentValue === value;

  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${
        isSelected ? "bg-slate-100" : ""
      }`}
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </div>
  );
};

// Display names for debugging
Select.displayName = "Select";
SelectTrigger.displayName = "SelectTrigger";
SelectValue.displayName = "SelectValue";
SelectContent.displayName = "SelectContent";
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
