import {serialise as kitsuSerialise} from "kitsu-core";


export function serializeBook(type: string, formData: any) {
    const attrs = formData.attributes ?? {};
    const rels = formData.relationships ?? {};

    const normalizeId = (item: any): string | null => {
        if (!item) return null;
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (typeof item === "object" && item.id != null) return String(item.id);
        return null;
    };

    const toMany = (arr: any[], relType: string) => ({
        data: (Array.isArray(arr) ? arr : [])
            .map(x => normalizeId(x))
            .filter((id): id is string => !!id)
            .map(id => ({id, type: relType}))
    });

    const toOne = (item: any, relType: string) => {
        const id = normalizeId(item);
        return {data: id ? {id, type: relType} : null};
    };

    const idField =
        attrs.id != null
            ? {id: String(attrs.id)}
            : {id: "0"}; // kitsu cannot handle lid → use "0"

    const resource = {
        ...idField,
        title: attrs.title,
        edition: attrs.edition,
        language: attrs.language,
        published: attrs.published,
        imageUrl: attrs.imageUrl,
        blurb: attrs.blurb,

        // relationship link bodies (id + type)
        genres: toMany(rels.genres ?? [], "genre"),
        creators: toMany(rels.creators ?? [], "creator"),
        publisher: toOne(rels.publisher ?? null, "publisher"),
        series: toOne(rels.series ?? null, "series"),
        bookCopies: toMany(rels.bookCopies ?? [], "bookDetail")
    };

    // explicit mapping for fallback types when item.type is missing
    const relTypeMap: Record<string, string> = {
        genres: "genre",
        creators: "creator",
        publisher: "publisher",
        series: "series",
        bookCopies: "bookDetail"
    };

    const included: any[] = [];

    for (const key of Object.keys(rels)) {
        const val = rels[key];

        if (Array.isArray(val)) {
            val.forEach(item => {
                if (item && (item.id != null || typeof item === "object")) {
                    const id = normalizeId(item) ?? (item.id != null ? String(item.id) : null);
                    const typeHint = item?.type ?? relTypeMap[key] ?? key.replace(/s$/, "");
                    // build attributes: copy fields except id/type
                    const attributes = {...item};
                    delete attributes.id;
                    delete attributes.type;
                    // ensure id exists for included entry (JSON:API requires id for included resources)
                    included.push({
                        type: typeHint,
                        id: id ?? "0",
                        attributes
                    });
                }
            });
        } else if (val && val.id != null) {
            const id = normalizeId(val);
            const typeHint = val?.type ?? relTypeMap[key] ?? key.replace(/s$/, "");
            const attributes = {...val};
            delete attributes.id;
            delete attributes.type;
            included.push({
                type: typeHint,
                id: id ?? "0",
                attributes
            });
        }
    }

    const doc = kitsuSerialise(type, resource);

    if (included.length > 0) {
        doc.included = included;
    }

    return doc;
}


export function deserializeBook(book: any) {
    // extract either an array or null
    const toMany = (rel: any) => {
        if (!rel || !Array.isArray(rel.data)) return [];
        return rel.data; // FULL OBJECTS untouched
    };

    // extract a single full object or null
    const toOne = (rel: any) => {
        if (!rel || !rel.data) return null;
        return rel.data; // FULL OBJECT untouched
    };

    // Copy ALL top-level fields except relationship wrappers
    const {
        genres,
        creators,
        publisher,
        series,
        tags,
        reviews,
        bookCopies,
        ...top
    } = book;

    return {
        attributes: {
            ...top,                 // EVERYTHING except relationship wrappers
            id: book.id ?? 0        // keep raw id, fallback to 0
        },

        relationships: {
            genres: toMany(book.genres),
            creators: toMany(book.creators),
            publisher: toOne(book.publisher),
            series: toOne(book.series),
            bookCopies: toMany(book.bookCopies)
        }
    };
}

