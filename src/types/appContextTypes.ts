// Generated TypeScript interfaces (Dto suffix removed + optional fields)

export interface Book {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string | number;
    blurb?: string;
    title: string;
    language?: string;
    edition?: string;
    published: string;
    creators: Creator[];
    genres: Genre[];
    tags: Tag[];
    reviews: Review[];
    publisher?: Publisher;
    bookCopies: BookDetail[];
    series?: Series;
    imageUrl?: string;
}

export interface BookDetail {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    isbn: string;
    bookFormat: string;
    dimensions: string;
    printLength: number;
    stock: number;
    supplyPrice: number;
    salePrice: number;
    bookCondition: string;
}

export interface Creator {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    name: string;
    role?: string;
}

export interface Genre {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    name: string;
}

export interface PaymentDetail {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    paymentType: string;
    provider: string;
    providerId: string;
    amount: number;
}

export interface Publisher {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    name: string;
}

export interface Receipt {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    subTotal: number;
    discount: number;
    tax: number;
    serviceCost: number;
    hasShipping: boolean;
    shippingService?: string;
    shippingId?: string;
    grandTotal: number;
    orderStatus: string;
    orderType: string;
    customer: User;
    employee: User;
    customerName: string;
    customerPhone?: string;
    customerAddress?: string;
    paymentDate: string;
    paymentDetail: PaymentDetail;
    receiptDetails: ReceiptDetail[];
}

export interface ReceiptDetail {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    bookCopy: BookDetail;
    pricePerUnit: number;
    quantity: number;
}

export interface Review {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    rating: number;
    comment: string;
}

export interface Role {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    name: string;
}

export interface Series {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    name: string;
}

export interface Tag {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    name: string;
}

export interface User {
    createdAt: string;
    updatedAt: string;
    enabled: boolean;
    note?: string;
    id: string;
    email: string;
    password: string;
    username: string;
    personName: string;
    phoneNumber: string;
    address: string;
    oauth2Id: string;
    isOauth2User: boolean;
    roles?: Role[];
}
