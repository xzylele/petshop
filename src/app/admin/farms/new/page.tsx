// หน้าเพิ่มฟาร์มใหม่ (แอดมิน)
import FarmForm from "../FarmForm";

export default function NewFarmPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">เพิ่มฟาร์ม</h1>
      <FarmForm />
    </div>
  );
}
