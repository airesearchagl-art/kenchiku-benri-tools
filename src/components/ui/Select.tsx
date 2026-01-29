import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const SelectContext = createContext<{
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
} | undefined>(undefined);

interface SelectProps {
    value?: string;
    onValueChange?: (value: string) => void;
    defaultValue?: string;
    children: React.ReactNode;
}

export function Select({ value, onValueChange, defaultValue, children }: SelectProps) {
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [open, setOpen] = useState(false);

    const currentValue = value !== undefined ? value : internalValue;
    const handleChange = (newValue: string) => {
        if (onValueChange) {
            onValueChange(newValue);
        } else {
            setInternalValue(newValue);
        }
    };

    return (
        <SelectContext.Provider value={{ value: currentValue, onValueChange: handleChange, open, setOpen }}>
            <div className="relative inline-block w-full">
                {children}
            </div>
        </SelectContext.Provider>
    );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export function SelectTrigger({ children, className = '', ...props }: SelectTriggerProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within Select");

    return (
        <button
            type="button"
            onClick={() => context.setOpen(!context.open)}
            className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        >
            {children}
            {/* Chevron Down Icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 opacity-50"
            >
                <path d="m6 9 6 6 6-6" />
            </svg>
        </button>
    );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectValue must be used within Select");

    // ここでは単純化のため、選択された値そのものを表示する形にするか、
    // あるいは親コンポーネントが何を表示すべきかを知る必要があるが、
    // Radix UIのSelectValueは選択されたItemのテキストを表示する機能がある。
    // 簡易実装では、valueを表示するか、placeholderを表示する。
    // 正確にはItemのchildrenを表示すべきだが、Contextでラベルマップを持たせるのは複雑になるため、
    // ここでは「選択されていればその値」を表示する簡易実装とする。
    // ※実用上は、親側で使用時に <SelectValue placeholder="..." /> と書くことが多いが、
    // 値に対応するラベルを表示するには少し工夫が必要。
    // ContextにregisterLabelなどの仕組みが必要だが、今回は省略して value を表示する。
    // もしラベル表示が必須なら、Selectのchildrenからラベルを抽出する必要がある。

    // 一旦、valueを表示する。必要に応じて修正。
    return <span>{context.value || placeholder}</span>;
}

export function SelectContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectContent must be used within Select");

    if (!context.open) return null;

    return (
        <div
            className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-slate-950 shadow-md animate-in fade-in-80 w-full mt-1 ${className}`}
            {...props}
        >
            <div className="p-1">
                {children}
            </div>
        </div>
    );
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
    children: React.ReactNode;
}

export function SelectItem({ value, children, className = '', ...props }: SelectItemProps) {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within Select");

    const isSelected = context.value === String(value);

    return (
        <div
            className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-100 focus:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-slate-100 ${isSelected ? 'font-semibold' : ''} ${className}`}
            onClick={() => {
                context.onValueChange(value);
                context.setOpen(false);
            }}
            {...props}
        >
            {isSelected && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                    >
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </span>
            )}
            {children}
        </div>
    );
}
