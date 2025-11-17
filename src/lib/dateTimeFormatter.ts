// utils/formatLocalDateTime.ts
import { format } from "date-fns";

export function formatLocalDateTime(input: string): string {
    const date = new Date(input);

    if (isNaN(date.getTime())) {
        throw new Error("Invalid LocalDateTime format: " + input);
    }

    return format(date, "dd/MM/yyyy");
}
