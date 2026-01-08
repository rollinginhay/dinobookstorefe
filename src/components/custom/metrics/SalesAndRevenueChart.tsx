"use client";
import React, {useMemo} from "react";
import {ApexOptions} from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
    loading: () => <div style={{height: 250}}/>, // Prevent layout shift
});

type Receipt = {
    paymentDate: string;
    grandTotal: number;
    updatedAt: string;
};

interface SalesAndRevenueChartProps {
    paidReceipts: Receipt[]
}

export default function SalesAndRevenueChart({paidReceipts}: SalesAndRevenueChartProps) {
    const chartData = useMemo(() => {
        function buildMonthRange(start: Date, end: Date): string[] {
            const result: string[] = [];
            const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

            while (cursor <= end) {
                const monthKey = `${String(cursor.getMonth() + 1).padStart(2, "0")}/${cursor.getFullYear()}`;
                result.push(monthKey);
                cursor.setMonth(cursor.getMonth() + 1);
            }

            return result;
        }

        function aggregateReceiptsMonthly(receipts: Receipt[]) {
            if (receipts.length === 0) {
                return {categories: [], sales: [], revenue: []};
            }
            
            const dates = receipts.map(r => {
                const date = r.paymentDate !== null && r.paymentDate !== undefined 
                    ? new Date(r.paymentDate) 
                    : new Date(r.updatedAt);
                return date;
            });
            
            const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
            const maxDate = new Date();

            const monthRange = buildMonthRange(minDate, maxDate);
            const bucket = new Map<string, { sales: number; revenue: number }>();

            monthRange.forEach(m => bucket.set(m, {sales: 0, revenue: 0}));

            receipts.forEach(r => {
                const date = r.paymentDate !== null && r.paymentDate !== undefined 
                    ? new Date(r.paymentDate) 
                    : new Date(r.updatedAt);
                const key = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
                const entry = bucket.get(key);
                if (!entry) return;

                entry.sales += 1;
                entry.revenue += r.grandTotal;
            });

            return {
                categories: monthRange,
                sales: monthRange.map(m => bucket.get(m)!.sales),
                revenue: monthRange.map(m => bucket.get(m)!.revenue),
            };
        }

        const {categories, sales, revenue} = aggregateReceiptsMonthly(paidReceipts);

        const series = [
            {
                name: "Đơn hàng",
                type: "column",
                data: sales,
            },
            {
                name: "Doanh thu",
                type: "line",
                data: revenue,
            },
        ];

        const options: ApexOptions = {
            chart: {
                id: 'revenue-sales-chart', //Stable chart ID
                height: 350,
                stacked: false,
                toolbar: {show: false},
                fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                animations: {
                    enabled: true, // Disable animations in case render bug
                    dynamicAnimation: {
                        enabled: false, // Disable dynamic animations
                    }
                },
                redrawOnParentResize: false, // Don't redraw on resize
                redrawOnWindowResize: false, // Don't redraw on window resize
            },
            colors: ["#3B4FFF", "#F59E0B"],
            stroke: {
                width: [0, 4],
                curve: "smooth",
            },
            fill: {
                type: ["solid", "solid"],
                opacity: [0.8, 0.8],
            },
            markers: {
                size: 0,
                hover: {size: 6},
            },
            dataLabels: {enabled: false},
            tooltip: {
                enabled: true,
                shared: true,
                intersect: false,
                followCursor: false,
                fixed: {
                    enabled: false, // Make tooltip position fixed in case needed
                    position: 'topRight',
                    offsetX: 0,
                    offsetY: 0,
                },
                y: {
                    formatter: (val, {seriesIndex}) =>
                        seriesIndex === 1
                            ? `${val.toLocaleString("vi-VN")}đ`
                            : `${val} đơn hàng`,
                },
                // Fix tool tip marker alignment and padding
                style: {
                    fontSize: '12px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                },
                marker: {
                    show: true,
                },
                // Fix alignment with custom class
                cssClass: 'apex-tooltip-aligned',
                onDatasetHover: {
                    highlightDataSeries: true, // highlight on hover
                },
            },
            states: {
                hover: {
                    filter: {
                        type: 'none', // Disable hover effects
                    }
                },
                active: {
                    filter: {
                        type: 'none', // Disable active state effects
                    }
                }
            },
            xaxis: {
                categories,
                labels: {
                    rotate: -45,
                    formatter: (val) => val,
                },
                tickAmount: 12,
            },
            yaxis: [
                {
                    title: {text: "Hóa đơn"},
                    labels: {
                        formatter: (v) => Math.round(v).toString(),
                    },
                },
                {
                    opposite: true,
                    title: {text: "Doanh thu"},
                    labels: {
                        formatter: (v) =>
                            v >= 1_000_000
                                ? `${(v / 1_000_000).toFixed(0)}T`
                                : v.toLocaleString("vi-VN"),
                    },
                },
            ],
        };

        return {series, options};
    }, [paidReceipts]);

    return (
        <div
            className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
                <div className="w-full">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Thống kê
                    </h3>
                    <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                        Đơn hàng và doanh thu theo tháng
                    </p>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto custom-scrollbar">
                <div className="min-w-[1000px] xl:min-w-full">
                    <ReactApexChart
                        options={chartData.options}
                        series={chartData.series}
                        type="line" // Changed from "area" to "line"
                        height={250}
                        width="100%"
                    />
                </div>
            </div>
        </div>
    );
}