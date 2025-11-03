import SidebarFilter from "../../component/product/sidebarFilter";
import ProductGrid from "../../component/product/productGrid";
import "../../../../style/product.css";

export default function DomesticBook() {
  return (
    <div className="container category-page">
      <div className="container sidebar">
        <SidebarFilter />
      </div>

      <div className="content">
        <ProductGrid />
      </div>
    </div>
  );
}
