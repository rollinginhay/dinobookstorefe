"use client";

import {useReceipt} from "@/hooks/api-calls/useReceipt";
import RevenueMetrics from "@/components/custom/metrics/RevenueMetrics";
import ReceiptOverview from "@/components/custom/metrics/ReceiptMetrics";
import SalesAndRevenueChart from "@/components/custom/metrics/SalesAndRevenueChart";
import React from "react";
import ReceiptPieChart from "@/components/custom/metrics/ReceiptPieChart";
import {isSameDay, isSameMonth, isSameYear} from "@/lib/dateTimeUtils";
import LowStockPrductTable from "@/components/custom/metrics/LowStockPrductTable";
import {useBook} from "@/hooks/api-calls/useBook";
import PopularProductTable from "@/components/custom/metrics/PopularProductTable";

export default function StoreOverview() {
    const {receiptQuery} = useReceipt(0, 10000, true);
    const {bookQuery} = useBook(0, 10000, true);
    if (receiptQuery.isLoading || bookQuery.isLoading) return <p>Loading...</p>;

    const receipts = receiptQuery.data.data;
    const books = bookQuery.data.data;

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

    return (
        <>
            <div className="col-span-12 space-y-6 xl:col-span-12">
                <RevenueMetrics
                    todayRevenue={revenueToday}
                    thisMonthRevenue={revenueThisMonth}
                    thisYearRevenue={revenueThisYear}>
                </RevenueMetrics>
                <ReceiptOverview
                    authorizedOrders={authorizedReceiptsNum}
                    inTransitOrders={inTransitReceiptsNum}
                    paidOrders={paidReceiptsNum}>
                </ReceiptOverview>
            </div>
            <div className="col-span-12">
                <SalesAndRevenueChart
                    paidReceipts={paidReceipts}
                />
            </div>
            <div className="col-span-12 xl:col-span-6 h-[355px]">
                <ReceiptPieChart receipts={receipts}/>
            </div>

            <div className="col-span-12 xl:col-span-6 h-[355px]">
                <LowStockPrductTable books={books}></LowStockPrductTable>
            </div>

            <div className="col-span-12 h-[355px]">
                <PopularProductTable
                    books={books}
                    receipts={receipts}></PopularProductTable>
            </div>
        </>
    )

}
