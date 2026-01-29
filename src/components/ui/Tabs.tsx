import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext<{
    value: string;
    onValueChange: (value: string) => void;
} | undefined>(undefined);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}

export function Tabs({ value, defaultValue, onValueChange, children, className = '', ...props }: TabsProps) {
    const [localValue, setLocalValue] = useState(defaultValue || '');
    const currentValue = value !== undefined ? value : localValue;
    const handleChange = onValueChange || setLocalValue;

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
            <div className={className} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export function TabsTrigger({ value, className = '', children, ...props }: TabsTriggerProps) {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.value === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? "active" : "inactive"}
            onClick={() => context.onValueChange(value)}
            className={`
                inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
                ${isActive ? "bg-white text-slate-950 shadow-sm" : "hover:bg-slate-200/50 hover:text-slate-900"}
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
}
