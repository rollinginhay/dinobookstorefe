// utils/formatLocalDateTime.ts
import {format} from "date-fns";

export function getDisplayDate(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getDate())) {
        throw new Error("Invalid LocalDateTime format: " + input);
    }

    return format(date, "dd/MM/yyyy");
}

export function getDateForInput(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getDate())) {
        throw new Error("Invalid LocalDateTime format: " + input);
    }

    return format(date, "yyyy-MM-dd");
}

export function getYear(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getDate())) {
        throw new Error("Invalid LocalDateTime format: " + input);
    }

    return format(date, "yyyy");
}

export function getVND(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
}

export function todayDateString() {
    return new Date().toISOString().split("T")[0];
}

