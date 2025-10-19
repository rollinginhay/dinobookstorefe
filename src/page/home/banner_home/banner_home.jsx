import banner1 from "../../../assests/imgs/img_4banner_1.webp";
import banner2 from "../../../assests/imgs/img_4banner_2.webp";
const Banner = () => {
  return (
    <>
      <div className="container">
        <div className="banner-home">
          <img src={banner1} />
          <img src={banner2} />
        </div>
      </div>
    </>
  );
};
export default Banner;
