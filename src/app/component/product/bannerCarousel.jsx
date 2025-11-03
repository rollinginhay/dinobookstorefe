"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import banner1 from "../../../public/banner_fahasa_1.webp";
import banner2 from "../../../public/banner_fahasa_2.webp";

export default function BannerCarousel() {
  return (
    <div className="container">
      <img src={banner1} alt="" />
      <img src={banner2} alt="" />
    </div>
  );
}
