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


    // ============================================
    // 1) USER SERIALIZATION WITH PROPER RELATIONSHIPS
    // ============================================
    function pushUser(user: any) {
        if (!user) return;

        const userId = idOrZero(user);

        // Extract roles
        const roles = Array.isArray(user.roles) ? user.roles : [];

        // Attributes for user (remove roles and id)
        const uAttrs = {...user};
        delete uAttrs.roles;
        delete uAttrs.id;
        delete uAttrs.type;

        included.push({
            type: "user",
            id: userId,
            attributes: uAttrs,
            relationships: {
                roles: {
                    data: roles.map((r: any) => ({
                        type: "role",
                        id: idOrZero(r)
                    }))
                }
            }
        });

        // Push each role as included
        for (const role of roles) {
            const rId = idOrZero(role);

            const rAttrs = {...role};
            delete rAttrs.id;
            delete rAttrs.type;

            included.push({
                type: "role",
                id: rId,
                attributes: rAttrs
            });
        }
    }

    // Customer & employee users
    pushUser(rels.customer);
    pushUser(rels.employee);


    // ===============================
    // 2) PAYMENT DETAIL
    // ===============================
    if (rels.paymentDetail) {
        const pd = rels.paymentDetail;

        const attrs = {...pd};
        delete attrs.id;
        delete attrs.type;

        included.push({
            type: "paymentDetail",
            id: idOrZero(pd),
            attributes: attrs
        });
    }


    // ===============================
    // 3) RECEIPT DETAILS + NESTED BOOK DETAILS
    // ===============================
    for (const rd of rels.receiptDetails ?? []) {
        const rdId = idOrZero(rd);
        const bc = rd.bookCopy;

        const rdAttrs = {...rd};
        delete rdAttrs.bookCopy;
        delete rdAttrs.id;
        delete rdAttrs.type;

        included.push({
            type: "receiptDetail",
            id: rdId,
            attributes: rdAttrs,
            relationships: {
                bookDetail: bc
                    ? {data: {id: idOrZero(bc), type: "bookDetail"}}
                    : {data: null}
            }
        });

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

export function deserializeUsers(rawUsers: any[]) {
    return rawUsers.map(u => ({
        id: u.id,
        personName: u.personName,
        username: u.username,
        email: u.email,
        phoneNumber: u.phoneNumber,
        address: u.address,
        enabled: u.enabled,
        isOauth2User: u.isOauth2User,

        roles: (u.roles?.data ?? []).map((r: any) => ({
            id: r.id,
            createdAt: r.createdAt,
            enabled: r.enabled,
            name: r.name,
            updatedAt: r.updatedAt
        })),

        createdAt: u.createdAt,
        updatedAt: u.updatedAt
    }));
}

export function serializeUser(user: any) {
    const normalizeId = (val: any): string | null => {
        if (!val) return null;
        if (typeof val === "string" || typeof val === "number") return String(val);
        if (typeof val === "object" && val.id != null) return String(val.id);
        return null;
    };

    const idOrZero = (val: any): string => normalizeId(val) ?? "0";

    const attrs = { ...user };
    delete attrs.id;    // remove id from attributes
    delete attrs.type;  // safety, if passed accidentally

    return {
        data: {
            type: "user",
            id: idOrZero(user),
            attributes: attrs
        }
    };
}



