"use client";

import {useEffect, useState} from "react";

interface QRCodeDisplayProps {
    value: string;
    size?: number;
}

export default function QRCodeDisplay({ value, size = 220 }: QRCodeDisplayProps) {
    const [QRCodeComponent, setQRCodeComponent] = useState<any>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;
        
        const loadQRCode = async () => {
            try {
                const mod = await import("qrcode.react");
                if (mounted) {
                    setQRCodeComponent(() => mod.QRCodeSVG);
                }
            } catch (err) {
                console.error("Failed to load QR code:", err);
                if (mounted) {
                    setError(true);
                }
            }
        };
        
        loadQRCode();
        
        return () => {
            mounted = false;
        };
    }, []);

    if (error) {
        return (
            <div className="w-[220px] h-[220px] bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-4">
                <div className="text-gray-500 text-sm">Không thể tải QR code</div>
                <div className="text-xs text-gray-400 mt-1">Mã: {value}</div>
            </div>
        );
    }

    if (!QRCodeComponent) {
        return (
            <div className="w-[220px] h-[220px] bg-gray-100 flex items-center justify-center">
                <div className="text-gray-500 text-sm">Đang tải QR...</div>
            </div>
        );
    }

    const QRCodeSVG = QRCodeComponent;

    return (
        <QRCodeSVG
            value={value}
            size={size}
            level="H"
            includeMargin={true}
        />
    );
}
