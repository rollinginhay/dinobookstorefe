// utils/formatLocalDateTime.ts
import {format} from "date-fns";

export function formatLocalDateTime(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getTime())) {
        throw new Error("Invalid LocalDateTime format: " + input);
    }

    return format(date, "dd/MM/yyyy");
}

export function formatDateForInput(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getTime())) {
        throw new Error("Invalid LocalDateTime format: " + input);
    }

    return format(date, "yyyy-MM-dd");
}

export function formatYear(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getTime())) {
        throw new Error("Invalid LocalDateTime format: " + input);
    }

    return format(date, "yyyy");
}

export function formatVND(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
}

