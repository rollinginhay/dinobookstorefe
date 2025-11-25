import { serialise as kitsuSerialise } from "kitsu-core";

export function serializeBook(type: string, formData: any) {
    const attrs = formData.attributes ?? {};
    const rels = formData.relationships ?? {};

    const normalizeId = (item: any): string | null => {
        if (!item) return null;
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (typeof item === "object" && item.id != null) return String(item.id);
        return null;
    };

    // ----- RELATIONSHIP HELPERS -----
    const toMany = (arr: any[], type: string) => ({
        data: (Array.isArray(arr) ? arr : [])
            .map(x => normalizeId(x))
            .filter((id): id is string => !!id)
            .map(id => ({ id, type }))
    });

    const toOne = (item: any, type: string) => {
        const id = normalizeId(item);
        return { data: id ? { id, type } : null };
    };

    // ----- ID HANDLING -----
    const idField =
        attrs.id != null
            ? { id: String(attrs.id) }
            : { id: "0" }; // kitsu cannot handle lid → use "0"

    // ----- BUILD RESOURCE FOR KITSU SERIALIZATION -----
    const resource = {
        ...idField,
        title: attrs.title,
        edition: attrs.edition,
        language: attrs.language,
        published: attrs.published,
        imageUrl: attrs.imageUrl,
        blurb: attrs.blurb,

        genres: toMany(rels.genres ?? [], "genre"),
        creators: toMany(rels.creators ?? [], "creator"),
        publisher: toOne(rels.publisher ?? null, "publisher"),
        series: toOne(rels.series ?? null, "series")
    };

    // ----- FULL INCLUDED OBJECTS (NO TRUNCATION) -----
    const included: any[] = [];

    for (const key of Object.keys(rels)) {
        const val = rels[key];

        if (Array.isArray(val)) {
            val.forEach(item => {
                if (item && item.id != null) {
                    // FULL COPY
                    included.push({
                        type: item.type ?? key,
                        ...item
                    });
                }
            });
        } else if (val && val.id != null) {
            // FULL COPY
            included.push({
                type: val.type ?? key,
                ...val
            });
        }
    }

    // ----- SERIALIZE WITH KITSU -----
    const doc = kitsuSerialise(type, resource);

    // attach included (full raw objects)
    if (included.length > 0) {
        doc.included = included;
    }

    return doc;
}
