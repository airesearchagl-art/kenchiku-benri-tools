import React, { createContext, useContext } from 'react';

const RadioGroupContext = createContext<{
    value: string;
    onValueChange: (value: string) => void;
} | undefined>(undefined);

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
    onValueChange: (value: string) => void;
}

export function RadioGroup({ value, onValueChange, className = '', children, ...props }: RadioGroupProps) {
    return (
        <RadioGroupContext.Provider value={{ value, onValueChange }}>
            <div className={`grid gap-2 ${className}`} role="radiogroup" {...props}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
}

interface RadioGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export function RadioGroupItem({ value, className = '', ...props }: RadioGroupItemProps) {
    const context = useContext(RadioGroupContext);

    if (!context) {
        throw new Error("RadioGroupItem must be used within a RadioGroup");
    }

    const isChecked = context.value === value;

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isChecked}
            data-state={isChecked ? "checked" : "unchecked"}
            onClick={() => context.onValueChange(value)}
            className={`
                aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
                ${isChecked ? "bg-slate-900 border-slate-900" : "border-slate-400"}
                ${className}
            `}
            {...props}
        >
            {isChecked && (
                <div className="flex items-center justify-center w-full h-full">
                    <div className="h-2 w-2 rounded-full bg-white" />
                </div>
            )}
        </button>
    );
}
