"use client";

import {useReceipt} from "@/hooks/api-calls/useReceipt";
import RevenueMetrics from "@/components/custom/metrics/RevenueMetrics";
import ReceiptMetrics from "@/components/custom/metrics/ReceiptMetrics";
import SalesAndRevenueChart from "@/components/custom/metrics/SalesAndRevenueChart";

type YMD = {
    year: number;
    month: number;
    day: number;
};

// toLocaleString("vi-VN")

export default function StoreOverview() {
    const {receiptQuery} = useReceipt(0, 10000, true);
    if (receiptQuery.isLoading) return <p>Loading...</p>;

    console.log("receipts", receiptQuery.data);

    const receipts = receiptQuery.data.data;

    const paidReceipts = receipts.filter((r) => r.orderStatus === "PAID")

    const now = new Date();

    const receiptsToday: any[] = paidReceipts.filter(r =>
        isSameDay(r.createdAt, now)
    );

    const receiptsThisMonth: any[] = paidReceipts.filter(r =>
        isSameMonth(r.createdAt, now)
    );

    const receiptsThisYear: any[] = paidReceipts.filter(r =>
        isSameYear(r.createdAt, now)
    );

    //key  revenue metrics
    const revenueToday = receiptsToday.reduce((acc, current) => acc + current.grandTotal, 0);
    const revenueThisMonth = receiptsThisMonth.reduce((acc, current) => acc + current.grandTotal, 0);
    const revenueThisYear = receiptsThisYear.reduce((acc, current) => acc + current.grandTotal, 0);

    //key receipt metrics
    const authorizedReceiptsNum = receipts.filter(r => r.orderStatus === "AUTHORIZED").length;
    const inTransitReceiptsNum = receipts.filter(r => r.orderStatus === "IN_TRANSIT").length;
    const paidReceiptsNum = paidReceipts.length;


    function extractYMDFromDateTime(javaDateTime: string): YMD {
        const [year, month, day] = javaDateTime
            .split("T")[0]
            .split("-")
            .map(Number);

        return {year, month, day};
    }

    function extractYMDFromDate(date: Date): YMD {
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
        };
    }

    function isSameDay(javaDateTime: string, reference: Date): boolean {
        const a = extractYMDFromDateTime(javaDateTime);
        const b = extractYMDFromDate(reference);

        return (
            a.year === b.year &&
            a.month === b.month &&
            a.day === b.day
        );
    }

    function isSameMonth(javaDateTime: string, reference: Date): boolean {
        const a = extractYMDFromDateTime(javaDateTime);
        const b = extractYMDFromDate(reference);

        return (
            a.year === b.year &&
            a.month === b.month
        );
    }

    function isSameYear(javaDateTime: string, reference: Date): boolean {
        return extractYMDFromDateTime(javaDateTime).year === reference.getFullYear();
    }


    return (
        <>
            <div className="col-span-12 space-y-6 xl:col-span-12">
                <RevenueMetrics
                    todayRevenue={revenueToday}
                    thisMonthRevenue={revenueThisMonth}
                    thisYearRevenue={revenueThisYear}>
                </RevenueMetrics>
                <ReceiptMetrics
                    authorizedOrders={authorizedReceiptsNum}
                    inTransitOrders={inTransitReceiptsNum}
                    paidOrders={paidReceiptsNum}>
                </ReceiptMetrics>
            </div>
            <div className="col-span-12">
                <SalesAndRevenueChart
                    paidReceipts={paidReceipts}
                />
            </div>
        </>
    )

}
