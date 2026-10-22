import * as React from "react";
import { endOfDay, isAfter, isBefore, startOfDay, subDays } from "date-fns";
import type { DateRange, Matcher } from "react-day-picker";
import {
  calculateRangeDayCount,
  getPriceScopePresets,
  type DateRangePreset,
} from "@/lib/dateRangeUtils";

export interface UseDateRangeDraftParams {
  value?: DateRange;
  onChange?: (dateRange: DateRange | undefined) => void;
  presets?: DateRangePreset[];
  maxDays: number;
  disableFuture: boolean;
}

export interface UseDateRangeDraftReturn {
  open: boolean;
  effectiveValue: DateRange | undefined;
  draftRange: DateRange | undefined;
  activeField: "from" | "to" | null;
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  today: Date;
  presets: DateRangePreset[];
  minHistoricalDate: Date;
  disabledMatchers: Matcher[];
  selectedDayCount: number | null;
  handleOpenChange: (nextOpen: boolean) => void;
  handlePillClick: (field: "from" | "to") => void;
  handleDaySelect: (selectedRange: DateRange | undefined, triggerDate?: Date) => void;
  handlePresetSelect: (preset: DateRangePreset) => void;
  handleApply: () => void;
  handleCancel: () => void;
  handleReset: () => void;
}

/**
 * Hook para gestionar el estado borrador, límites de fechas y navegación en DateRangePicker.
 */
export function useDateRangeDraft({
  value,
  onChange,
  presets: presetsProp,
  maxDays,
  disableFuture,
}: UseDateRangeDraftParams): UseDateRangeDraftReturn {
  const today = React.useMemo(() => endOfDay(new Date()), []);
  const presets = React.useMemo(
    () => presetsProp ?? getPriceScopePresets(today),
    [presetsProp, today]
  );
  const defaultRange = React.useMemo(() => (presets[2] ?? presets[0])?.dateRange, [presets]);
  const effectiveValue = value ?? defaultRange;

  const [open, setOpen] = React.useState(false);
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(effectiveValue);
  const [activeField, setActiveField] = React.useState<"from" | "to" | null>(null);

  const minHistoricalDate = React.useMemo(
    () => startOfDay(subDays(today, maxDays - 1)),
    [today, maxDays]
  );

  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => effectiveValue?.to ?? effectiveValue?.from ?? today
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      setActiveField(null);
      if (nextOpen) {
        setDraftRange(effectiveValue);
        setCurrentMonth(effectiveValue?.to ?? effectiveValue?.from ?? today);
      }
    },
    [effectiveValue, today]
  );

  const handlePillClick = React.useCallback(
    (field: "from" | "to") => {
      if (activeField === field) {
        setActiveField(null);
        return;
      }
      setActiveField(field);
      const targetDate = field === "from" ? draftRange?.from : draftRange?.to;
      if (targetDate) {
        setCurrentMonth(targetDate);
      }
    },
    [activeField, draftRange]
  );

  const handleDaySelect = React.useCallback(
    (selectedRange: DateRange | undefined, triggerDate?: Date) => {
      if (activeField && triggerDate) {
        const from = activeField === "from" ? triggerDate : (draftRange?.from ?? triggerDate);
        const to = activeField === "to" ? triggerDate : (draftRange?.to ?? triggerDate);
        setDraftRange(isAfter(from, to) ? { from: to, to: from } : { from, to });
        setActiveField(null);
        return;
      }

      setDraftRange(selectedRange);
      setActiveField(selectedRange?.from && !selectedRange.to ? "to" : null);
    },
    [activeField, draftRange]
  );

  const handlePresetSelect = React.useCallback((preset: DateRangePreset) => {
    setDraftRange(preset.dateRange);
    setCurrentMonth(preset.dateRange.to);
    setActiveField(null);
  }, []);

  const handleApply = React.useCallback(() => {
    if (!draftRange?.from || !draftRange?.to) return;
    onChange?.(draftRange);
    setOpen(false);
  }, [draftRange, onChange]);

  const handleCancel = React.useCallback(() => {
    setDraftRange(effectiveValue);
    setActiveField(null);
    setOpen(false);
  }, [effectiveValue]);

  const handleReset = React.useCallback(() => {
    const defaultPreset = presets[2] ?? presets[0];
    if (defaultPreset) {
      setDraftRange(defaultPreset.dateRange);
      setCurrentMonth(defaultPreset.dateRange.to);
    } else {
      setDraftRange(undefined);
    }
    setActiveField(null);
  }, [presets]);

  const disabledMatchers = React.useMemo(
    () => [
      ...(disableFuture ? [{ after: today }] : []),
      ...(maxDays > 0 ? [{ before: minHistoricalDate }] : []),
      ...(activeField === "to" && draftRange?.from && !isBefore(today, draftRange.from)
        ? [{ before: draftRange.from }]
        : []),
    ],
    [disableFuture, today, maxDays, minHistoricalDate, activeField, draftRange]
  );

  return {
    open,
    effectiveValue,
    draftRange,
    activeField,
    currentMonth,
    setCurrentMonth,
    today,
    presets,
    minHistoricalDate,
    disabledMatchers,
    selectedDayCount: calculateRangeDayCount(draftRange),
    handleOpenChange,
    handlePillClick,
    handleDaySelect,
    handlePresetSelect,
    handleApply,
    handleCancel,
    handleReset,
  };
}
