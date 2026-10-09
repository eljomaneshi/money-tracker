import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

interface ParsedOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      children,
      id,
      className = "",
      disabled,
      value,
      onChange,
      required,
      name,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : `select-${generatedId.replace(/:/g, "")}`);
    const triggerId = `${selectId}-button`;
    const labelId = label ? `${selectId}-label` : undefined;
    const listboxId = `${selectId}-listbox`;

    const computedLabelledBy = label ? labelId : ariaLabelledBy;
    const computedAriaLabel = label ? undefined : ariaLabel;

    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);
    const nativeSelectRef = useRef<HTMLSelectElement | null>(null);

    useImperativeHandle(ref, () => nativeSelectRef.current as HTMLSelectElement);

    // Extract options from options prop or React children
    const parsedOptions = useMemo<ParsedOption[]>(() => {
      if (options && options.length > 0) {
        return options.map((opt) => ({
          value: opt.value,
          label: opt.label,
          disabled: opt.disabled,
        }));
      }

      const items: ParsedOption[] = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.type === "option") {
          const childProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
          items.push({
            value: (childProps.value as string | number) ?? "",
            label:
              typeof childProps.children === "string"
                ? childProps.children
                : String(childProps.children ?? childProps.value ?? ""),
            disabled: Boolean(childProps.disabled),
          });
        }
      });
      return items;
    }, [options, children]);

    // Current selected option
    const selectedOption = useMemo(() => {
      if (value === undefined || value === null) {
        return parsedOptions[0];
      }
      return (
        parsedOptions.find((opt) => String(opt.value) === String(value)) ||
        parsedOptions[0]
      );
    }, [parsedOptions, value]);

    const displayLabel = selectedOption
      ? selectedOption.label
      : value !== undefined && value !== null && value !== ""
      ? String(value)
      : "Select...";

    // Determine dropdown direction (up vs down) based on viewport room
    const checkDropdownDirection = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(parsedOptions.length * 44 + 16, 240);
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    };

    const getInitialActiveIndex = (): number => {
      // 1. Try currently selected enabled option
      const selectedIdx = parsedOptions.findIndex(
        (opt) => String(opt.value) === String(value) && !opt.disabled
      );
      if (selectedIdx >= 0) return selectedIdx;

      // 2. Fall back to first enabled option
      const firstEnabledIdx = parsedOptions.findIndex((opt) => !opt.disabled);
      return firstEnabledIdx >= 0 ? firstEnabledIdx : -1;
    };

    const toggleOpen = () => {
      if (disabled) return;
      if (!isOpen) {
        checkDropdownDirection();
        setHighlightedIndex(getInitialActiveIndex());
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [isOpen]);

    // Handle selection
    const handleSelectOption = (opt: ParsedOption) => {
      if (opt.disabled) return;
      setIsOpen(false);

      if (nativeSelectRef.current) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          "value"
        )?.set;
        nativeSetter?.call(nativeSelectRef.current, String(opt.value));

        const event = new Event("change", { bubbles: true });
        nativeSelectRef.current.dispatchEvent(event);
      }

      triggerRef.current?.focus();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleOpen();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            let next = prev < 0 ? 0 : prev + 1;
            while (next < parsedOptions.length && parsedOptions[next].disabled) {
              next++;
            }
            return next < parsedOptions.length ? next : prev;
          });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            let next = prev < 0 ? parsedOptions.length - 1 : prev - 1;
            while (next >= 0 && parsedOptions[next].disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
          break;
        }
        case "Home": {
          e.preventDefault();
          const firstEnabled = parsedOptions.findIndex((opt) => !opt.disabled);
          if (firstEnabled >= 0) setHighlightedIndex(firstEnabled);
          break;
        }
        case "End": {
          e.preventDefault();
          for (let i = parsedOptions.length - 1; i >= 0; i--) {
            if (!parsedOptions[i].disabled) {
              setHighlightedIndex(i);
              break;
            }
          }
          break;
        }
        case "Enter":
        case " ": {
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < parsedOptions.length) {
            const opt = parsedOptions[highlightedIndex];
            if (!opt.disabled) {
              handleSelectOption(opt);
            }
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        }
        case "Tab": {
          setIsOpen(false);
          break;
        }
      }
    };

    // Scroll highlighted option into view
    useEffect(() => {
      if (!isOpen || highlightedIndex < 0 || !listboxRef.current) return;
      const optionElements = listboxRef.current.querySelectorAll<HTMLElement>("[role='option']");
      const activeEl = optionElements[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }, [highlightedIndex, isOpen]);

    return (
      <div ref={containerRef} className="w-full relative">
        {label && (
          <label
            id={labelId}
            htmlFor={triggerId}
            className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        {/* Custom trigger button */}
        <div className="relative flex items-center">
          <button
            type="button"
            id={triggerId}
            ref={triggerRef}
            disabled={disabled}
            onClick={toggleOpen}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-labelledby={computedLabelledBy}
            aria-label={computedAriaLabel}
            aria-activedescendant={
              isOpen && highlightedIndex >= 0 && highlightedIndex < parsedOptions.length
                ? `${selectId}-opt-${highlightedIndex}`
                : undefined
            }
            className={`w-full flex items-center justify-between rounded-2xl border bg-white px-4 py-3 pr-10 text-left text-sm text-slate-900 outline-none transition-all duration-150 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 dark:bg-[#070b14] dark:text-slate-100 dark:disabled:bg-slate-900 ${
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 dark:border-rose-600/70 dark:focus:border-rose-500 dark:focus:ring-rose-500/20"
                : "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/20"
            } ${className}`}
          >
            <span className="truncate">{displayLabel}</span>
          </button>

          <div
            className={`pointer-events-none absolute right-3.5 flex items-center text-slate-400 transition-transform duration-150 dark:text-slate-500 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </div>

          {/* Hidden native select for form submission, refs, and accessibility synchronization */}
          <select
            ref={nativeSelectRef}
            id={selectId}
            value={value}
            disabled={disabled}
            required={required}
            name={name}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only pointer-events-none absolute -bottom-0 -left-0 h-0 w-0 opacity-0"
            onChange={onChange}
            {...props}
          >
            {parsedOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bounded custom popover listbox */}
        {isOpen && (
          <div
            id={listboxId}
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={computedLabelledBy}
            aria-label={computedAriaLabel}
            className={`absolute left-0 right-0 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all duration-150 dark:border-white/10 dark:bg-[#0b1120] max-h-60 overflow-y-auto ${
              openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
          >
            {parsedOptions.map((opt, idx) => {
              const optionId = `${selectId}-opt-${idx}`;
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={`${opt.value}-${idx}`}
                  id={optionId}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => handleSelectOption(opt)}
                  onMouseEnter={() => {
                    if (!opt.disabled) setHighlightedIndex(idx);
                  }}
                  className={`flex items-center justify-between min-h-[40px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer select-none transition-colors ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-500"
                      : isSelected
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                      : isHighlighted
                      ? "bg-slate-100 text-slate-900 dark:bg-white/5 dark:text-slate-100"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 ml-2" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
