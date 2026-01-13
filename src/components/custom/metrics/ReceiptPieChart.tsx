"use client";
import React, {useMemo, useState} from "react";
import {ApexOptions} from "apexcharts";
import dynamic from "next/dynamic";
import {isSameDay, isSameMonth, isSameYear} from "@/lib/dateTimeUtils";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface ReceiptPieChartProps {
    receipts: any[];
}

export default function ReceiptPieChart({receipts}: ReceiptPieChartProps) {
    const now = new Date();

    const receiptsToday: any[] = receipts.filter(r => isSameDay(r.createdAt, now));
    const receiptsThisMonth: any[] = receipts.filter(r => isSameMonth(r.createdAt, now));
    const receiptsThisYear: any[] = receipts.filter(r => isSameYear(r.createdAt, now));

    const groupedReceiptsToday = groupReceiptsByStatus(receiptsToday);
    const groupedReceiptsThisMonth = groupReceiptsByStatus(receiptsThisMonth);
    const groupedReceiptsThisYear = groupReceiptsByStatus(receiptsThisYear);
    const groupedReceiptsAllTime = groupReceiptsByStatus(receipts);

    const GROUPS = {
        TODAY: {
            code: "TODAY",
            label: "Ngày",
            content: groupedReceiptsToday
        },
        THIS_MONTH: {
            code: "THIS_MONTH",
            label: "Tháng",
            content: groupedReceiptsThisMonth
        },
        THIS_YEAR: {
            code: "THIS_YEAR",
            label: "Năm",
            content: groupedReceiptsThisYear
        },
        ALL: {
            code: "ALL",
            label: "Tất cả",
            content: groupedReceiptsAllTime
        }
    } as const;

    type GroupKey = keyof typeof GROUPS
    type GroupValue = typeof GROUPS[GroupKey];

    const STATUS_LABELS = {
        PENDING: "Chờ xác nhận",
        AUTHORIZED: "Đã xác nhận",
        IN_TRANSIT: "Đang vận chuyển",
        PAID: "Đã hoàn thành",
        FAILED: "Thanh toán thất bại",
        REFUNDED: "Đã hoàn tiền",
        CANCELLED: "Đã hủy",
        WAITING_REFUND_INFO: "Chờ hoàn tiền",
    }
    const [selectedGroup, setSelectedGroup] = useState<GroupValue>(GROUPS.ALL);

    const getButtonClass = (code: string) =>
        selectedGroup.code === code
            ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            : "text-gray-500 dark:text-gray-400";

    const chartData = useMemo(() => {
        const content = selectedGroup.content;
        const statusKeys = Object.keys(content);
        const statusCounts = statusKeys.map(status => content[status].length);
        const totalCount = statusCounts.reduce((sum, count) => sum + count, 0);

        const statusLabels = statusKeys.map(
            key => STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key
        );

        return {
            keys: statusKeys,
            labels: statusLabels,
            series: statusCounts,
            total: totalCount
        };
    }, [selectedGroup]);
    const options: ApexOptions = useMemo(() => ({
        colors: ["#9b8afb", "#fd853a", "#fdb022", "#32d583", "#ec4899", "#8b5cf6", "#06b6d4"],
        labels: chartData.labels,
        chart: {
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            type: "donut",
            width: 280,
            height: 280,
            toolbar: {
                show: false,
            },
            offsetX: 0,
            offsetY: 0,
        },
        stroke: {
            show: false,
            width: 4,
            colors: ["transparent"],
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "65%",
                    background: "transparent",
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            offsetY: 0,
                            color: "#1D2939",
                            fontSize: "12px",
                            fontWeight: "normal",
                            formatter: (val) => val,
                        },
                        value: {
                            show: true,
                            offsetY: 10,
                            color: "#667085",
                            fontSize: "14px",
                            formatter: (val) => val.toString(),
                        },
                        total: {
                            show: true,
                            label: "Tất cả",
                            color: "#000000",
                            fontSize: "16px",
                            fontWeight: "bold",
                            formatter: () => chartData.total.toString(),
                        },
                    },
                },
            },
        },
        states: {
            hover: {
                filter: {
                    type: "none",
                },
            },
            active: {
                allowMultipleDataPointsSelection: false,
                filter: {
                    type: "darken",
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        tooltip: {
            enabled: false,
            y: {
                formatter: (val) => `${val} receipts`,
            },
        },
        legend: {
            show: false,
            position: "bottom",
            horizontalAlign: "left",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontSize: "14px",
            fontWeight: 400,
            markers: {
                size: 6,
                shape: "circle",
                strokeWidth: 0,
            },
            itemMargin: {
                horizontal: 10,
                vertical: 6,
            },
        },
        responsive: [
            {
                breakpoint: 640,
                options: {
                    chart: {
                        width: 280,
                        height: 280,
                    },
                },
            },
            {
                breakpoint: 2600,
                options: {
                    chart: {
                        width: 240,
                        height: 240,
                    },
                },
            },
        ],
    }), [chartData]);

    function groupReceiptsByStatus(receipts: any[]) {
        const grouped: Record<string, any[]> = {};

        receipts.forEach(receipt => {
            if (receipt.orderStatus === null || receipt.orderStatus === undefined) {
                return;
            }

            const status = receipt.orderStatus;

            if (!grouped[status]) {
                grouped[status] = [];
            }

            grouped[status].push(receipt);
        });

        return grouped;
    }

    return (
        <div
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Tổng quan hóa đơn - {selectedGroup.label}
                </h3>
                <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
                    <button
                        onClick={() => setSelectedGroup(GROUPS.TODAY)}
                        className={`px-3 py-2 font-medium w-full rounded-md text-theme-xs hover:text-gray-900 dark:hover:text-white ${getButtonClass(GROUPS.TODAY.code)}`}
                    >
                        {GROUPS.TODAY.label}
                    </button>
                    <button
                        onClick={() => setSelectedGroup(GROUPS.THIS_MONTH)}
                        className={`px-3 py-2 font-medium w-full rounded-md text-xs hover:text-gray-900 dark:hover:text-white ${getButtonClass(GROUPS.THIS_MONTH.code)}`}
                    >
                        {GROUPS.THIS_MONTH.label}
                    </button>
                    <button
                        onClick={() => setSelectedGroup(GROUPS.THIS_YEAR)}
                        className={`px-3 py-2 font-medium w-full rounded-md text-xs hover:text-gray-900 dark:hover:text-white ${getButtonClass(GROUPS.THIS_YEAR.code)}`}
                    >
                        {GROUPS.THIS_YEAR.label}
                    </button>
                    <button
                        onClick={() => setSelectedGroup(GROUPS.ALL)}
                        className={`px-3 py-2 font-medium w-full rounded-md text-xs hover:text-gray-900 dark:hover:text-white whitespace-nowrap ${getButtonClass(GROUPS.ALL.code)}`}
                    >
                        {GROUPS.ALL.label}
                    </button>
                </div>
            </div>

            {chartData.total === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                            Không có dữ liệu
                        </p>
                        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                            Chưa có đơn hàng trong khoảng thời gian này
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-6 xl:flex-row xl:items-start">
                    <div id="chartDarkStyle" className="flex-shrink-0">
                        <ReactApexChart
                            options={options}
                            series={chartData.series}
                            type="donut"
                            height={280}
                        />
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 xl:flex-1">
                        {chartData.labels.map((status, index) => {
                            const count = chartData.series[index];
                            const percentage = chartData.total > 0
                                ? ((count / chartData.total) * 100).toFixed(1)
                                : 0;
                            const colors = ["#9b8afb", "#fd853a", "#fdb022", "#32d583", "#ec4899", "#8b5cf6", "#06b6d4"];

                            return (
                                <div key={status} className="flex items-start gap-2.5">
                                    <div
                                        className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                                        style={{backgroundColor: colors[index % colors.length]}}
                                    ></div>
                                    <div className="min-w-0 flex-1">
                                        <h5 className="mb-1 font-medium text-gray-800 text-theme-sm dark:text-white/90 truncate">
                                            {status}
                                        </h5>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                                                {percentage}%
                                            </p>
                                            <div className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></div>
                                            <p className="text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                                                {count} đơn hàng
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}