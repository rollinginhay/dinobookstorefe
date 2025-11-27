export interface DeserializedJsonApiBody {
    links: Record<string, string>;
    data: Record<string, unknown> | unknown[] | null;
}