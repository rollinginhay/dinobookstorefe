export type YMD = {
    year: number;
    month: number;
    day: number;
};

export function extractYMDFromDateTime(javaDateTime: string): YMD {
    if (!javaDateTime) {
        return { year: 0, month: 0, day: 0 };
    }
    
    const [year, month, day] = javaDateTime
        .split("T")[0]
        .split("-")
        .map(Number);

    return {year, month, day};
}

export function extractYMDFromDate(date: Date): YMD {
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
    };
}

export function isSameDay(javaDateTime: string, reference: Date): boolean {
    const a = extractYMDFromDateTime(javaDateTime);
    const b = extractYMDFromDate(reference);

    return (
        a.year === b.year &&
        a.month === b.month &&
        a.day === b.day
    );
}

export function isSameMonth(javaDateTime: string, reference: Date): boolean {
    const a = extractYMDFromDateTime(javaDateTime);
    const b = extractYMDFromDate(reference);

    return (
        a.year === b.year &&
        a.month === b.month
    );
}

export function isSameYear(javaDateTime: string, reference: Date): boolean {
    return extractYMDFromDateTime(javaDateTime).year === reference.getFullYear();
}