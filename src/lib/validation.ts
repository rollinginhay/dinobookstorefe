export function isStrictAlphanumeric(
    value: string,
    min: number,
    max: number
): boolean {
    const regex = new RegExp(`^[a-zA-Z0-9]{${min},${max}}$`);
    return regex.test(value);
}

export function isAlphaNumericWords(
    value: string,
    min: number,
    max: number
): boolean {
    const regex = new RegExp(
        `^(?=.{${min},${max}}$)[A-Za-z0-9]+(?:\\s+[A-Za-z0-9]+)*$`
    );

    return regex.test(value);
}

export function isLetterWords(
    value: string,
    min: number,
    max: number
): boolean {
    const regex = new RegExp(
        `^(?=.{${min},${max}}$)[A-Za-z]+(?:\\s+[A-Za-z]+)*$`
    );

    return regex.test(value);
}

export function isParagraphNullable(
    value: string,
    min: number,
    max: number
): boolean {
    const regex = new RegExp(`^(?:$|(?=.{${min},${max}}$)\\S.*\\S)$`);


    return regex.test(value);
}