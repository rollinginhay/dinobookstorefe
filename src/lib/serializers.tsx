import {serialise as kitsuSerialise} from "kitsu-core";


//serialize book formData to kitsu-compliant payload (pre-serialized by kitsu)
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

//deserialize res body for book to formData
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

//serialize book formData to kitsu-compliant payload (pre-serialized by kitsu)
export function serializeReceipt(receipt: any) {
    const attrs = receipt.attributes ?? {};
    const rels = receipt.relationships ?? {};

    const normalizeId = (val: any): string | null => {
        if (!val) return null;
        if (typeof val === "string" || typeof val === "number") return String(val);
        if (typeof val === "object" && val.id != null) return String(val.id);
        return null;
    };

    const idOrZero = (val: any): string => normalizeId(val) ?? "0";

    const toOne = (item: any, type: string) => {
        if (!item) return {data: null};
        return {data: {id: idOrZero(item), type}};
    };

    const toMany = (arr: any[], type: string) => ({
        data: (arr ?? []).map(x => ({id: idOrZero(x), type}))
    });

    // ===============================
    // DATA BLOCK
    // ===============================
    const data = {
        type: "receipt",
        id: idOrZero(receipt),

        attributes: {
            customerName: attrs.customerName ?? null,
            customerPhone: attrs.customerPhone ?? null,
            customerAddress: attrs.customerAddress ?? null,
            hasShipping: attrs.hasShipping ?? false,
            shippingService: attrs.shippingService ?? null,
            shippingId: attrs.shippingId ?? null,

            voucherCode: attrs.voucherCode ?? "",
            discountAmount: attrs.discountAmount ?? 0,
            discount: attrs.discount ?? 0,

            orderStatus: attrs.orderStatus ?? "PENDING",
            orderType: attrs.orderType ?? "DIRECT",

            enabled: true
        },

        relationships: {
            customer: toOne(rels.customer, "user"),
            employee: toOne(rels.employee, "user"),
            paymentDetail: toOne(rels.paymentDetail, "paymentDetail"),
            receiptDetails: toMany(rels.receiptDetails ?? [], "receiptDetail")
        }
    };

    // ===============================
    // INCLUDED SECTION
    // ===============================
    const included: any[] = [];

    const pushIncluded = (obj: any, type: string) => {
        if (!obj) return;
        const id = idOrZero(obj);
        const attrs = {...obj};
        delete attrs.id;
        delete attrs.type;
        included.push({type, id, attributes: attrs});
    };

    // customer + employee
    if (rels.customer) pushIncluded(rels.customer, "user");
    if (rels.employee) pushIncluded(rels.employee, "user");

    // paymentDetail
    if (rels.paymentDetail) pushIncluded(rels.paymentDetail, "paymentDetail");

    // ===============================
    // RECEIPT DETAILS + nested bookDetail
    // ===============================
    for (const rd of rels.receiptDetails ?? []) {
        const rdId = idOrZero(rd);
        const bc = rd.bookCopy;

        // ------- receiptDetail included -------
        const rdAttrs = {...rd};
        delete rdAttrs.bookCopy;
        delete rdAttrs.id;
        delete rdAttrs.type;

        included.push({
            type: "receiptDetail",
            id: rdId,
            attributes: rdAttrs,
            relationships: {
                bookDetail: {
                    data: bc ? {id: idOrZero(bc), type: "bookDetail"} : null
                }
            }
        });

        // ------- bookDetail included -------
        if (bc) {
            const bcAttrs = {...bc};
            delete bcAttrs.id;
            delete bcAttrs.type;

            included.push({
                type: "bookDetail",
                id: idOrZero(bc),
                attributes: bcAttrs
            });
        }
    }

    return {data, included};
}

// export function serializeReceipt(receipt: any) {
//     const attrs = receipt.attributes ?? {};
//     const rels = receipt.relationships ?? {};
//
//     // Normalize any "id"
//     const normalizeId = (val: any): string | null => {
//         if (!val) return null;
//         if (typeof val === "string" || typeof val === "number") return String(val);
//         if (typeof val === "object" && val.id != null) return String(val.id);
//         return null;
//     };
//
//     // If an object exists but has no ID, we will use "0" for JSON:API included-create semantics.
//     const idOrZero = (val: any): string | null => {
//         if (!val) return null;
//         return normalizeId(val) ?? "0";
//     };
//
//     const toOne = (item: any, type: string) => {
//         if (!item) return {data: null};
//         const id = idOrZero(item);
//         return {data: {id: String(id), type}};
//     };
//
//     const toMany = (arr: any[], type: string) => ({
//         data: (Array.isArray(arr) ? arr : []).map((item) => {
//             const id = idOrZero(item) ?? "0";
//             return {id: String(id), type};
//         })
//     });
//
//     // ===============================
//     // MAIN DATA BLOCK
//     // ===============================
//     const data = {
//         type: "receipt",
//         id: normalizeId(receipt.id) ?? "0",
//
//         attributes: {
//             customerName: attrs.customerName ?? null,
//             customerPhone: attrs.customerPhone ?? null,
//             customerAddress: attrs.customerAddress ?? null,
//             hasShipping: attrs.hasShipping ?? false,
//             shippingService: attrs.shippingService ?? null,
//             shippingId: attrs.shippingId ?? null,
//
//             voucherCode: attrs.voucherCode ?? "",
//             discountAmount: attrs.discountAmount ?? 0,
//             discount: attrs.discount ?? 0,
//
//             orderStatus: attrs.orderStatus ?? "PENDING",
//             enabled: attrs.enabled ?? true,
//         },
//
//         relationships: {
//             customer: toOne(rels.customer, "user"),
//             employee: toOne(rels.employee, "user"),
//             paymentDetail: toOne(rels.paymentDetail, "paymentDetail"),
//             receiptDetails: toMany(rels.receiptDetails ?? [], "receiptDetail"),
//         }
//     };
//
//     // ===============================
//     // INCLUDED BLOCK (with nested relationships)
//     // ===============================
//     const included: any[] = [];
//
//     const pushIncludedRaw = (item: any, typeHint: string, idHint?: string) => {
//         if (!item) return;
//         const id = idHint ?? normalizeId(item) ?? "0";
//         const attributes = {...item};
//         delete attributes.id;
//         delete attributes.type;
//         included.push({
//             type: typeHint,
//             id: String(id),
//             attributes
//         });
//     };
//
//     // include customer, employee if provided (use raw shape)
//     if (rels.customer) pushIncludedRaw(rels.customer, "user", normalizeId(rels.customer) ?? undefined);
//     if (rels.employee) pushIncludedRaw(rels.employee, "user", normalizeId(rels.employee) ?? undefined);
//
//     // paymentDetail: include as its own resource (if present)
//     if (rels.paymentDetail) {
//         // allow creation if object has no id (id -> "0")
//         const pdId = idOrZero(rels.paymentDetail) ?? "0";
//         const pdAttrs = {...rels.paymentDetail};
//         delete pdAttrs.id;
//         delete pdAttrs.type;
//         included.push({
//             type: "paymentDetail",
//             id: String(pdId),
//             attributes: pdAttrs
//         });
//     }
//
//     // receiptDetails: for each detail, include a receiptDetail resource that contains:
//     // - attributes: everything except id/type/bookCopy
//     // - relationships: bookCopy -> { data: { type: "bookDetail", id: "..." } }
//     // and also include the bookDetail resource itself.
//     if (Array.isArray(rels.receiptDetails)) {
//         rels.receiptDetails.forEach((rd: any) => {
//             if (!rd) return;
//
//             // receiptDetail id (or "0" for new)
//             const rdId = idOrZero(rd) ?? "0";
//
//             // build receiptDetail attributes (exclude nested bookCopy)
//             const rdAttributes: any = {...rd};
//             const rdBookCopy = rdAttributes.bookCopy ?? null;
//             delete rdAttributes.id;
//             delete rdAttributes.type;
//             delete rdAttributes.bookCopy;
//
//             // receiptDetail relationships: bookCopy
//             const rdRelationships: any = {
//                 bookCopy: {data: rdBookCopy ? {id: String(idOrZero(rdBookCopy)), type: "bookDetail"} : null}
//             };
//
//             included.push({
//                 type: "receiptDetail",
//                 id: String(rdId),
//                 attributes: rdAttributes,
//                 relationships: rdRelationships
//             });
//
//             // include the bookDetail itself (if present)
//             if (rdBookCopy) {
//                 const bcId = idOrZero(rdBookCopy) ?? "0";
//                 const bcAttributes = {...rdBookCopy};
//                 delete bcAttributes.id;
//                 delete bcAttributes.type;
//
//                 included.push({
//                     type: "bookDetail",
//                     id: String(bcId),
//                     attributes: bcAttributes
//                 });
//             }
//         });
//     }
//
//     return {
//         data,
//         ...(included.length > 0 ? {included} : {})
//     };
// }



