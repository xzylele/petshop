// หน้าเพิ่มสินค้าใหม่ (หลังบ้านร้านค้า)
import ProductForm from "../ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">เพิ่มสินค้าใหม่</h1>
      <ProductForm />
    </div>
  );
}
