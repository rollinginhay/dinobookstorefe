"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCampaigns, calculateDiscountedPrice, Campaign } from "@/utils/campaign.utils";

interface CampaignContextType {
  campaigns: Campaign[];
  loading: boolean;
  calculatePrice: (productId: number | string, originalPrice: number) => {
    discountedPrice: number;
    originalPrice: number;
    hasDiscount: boolean;
    discountAmount: number;
    campaignName?: string;
  };
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setLoading(true);
        const data = await fetchCampaigns();
        setCampaigns(data);
        console.log("✅ [CampaignContext] Loaded campaigns:", data.length);
      } catch (error) {
        console.error("Lỗi fetch campaigns:", error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const calculatePrice = (
    productId: number | string,
    originalPrice: number
  ) => {
    return calculateDiscountedPrice(productId, originalPrice, campaigns);
  };

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        loading,
        calculatePrice,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
}