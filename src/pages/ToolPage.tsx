import spinWheel from "@/assets/spin.jpg";
import { Link } from "react-router-dom";

const ToolsPage = () => (
  <div className="mx-auto max-w-[1100px]">
    <h1 className="sr-only">Tools</h1>
    <p className="text-body text-l-ink2">Little helpers for class time.</p>
    <div className="mt-4 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-4">
      <Link to="/tools/spin-wheel" className="l-card group flex flex-col items-center gap-3 p-5 transition hover:-translate-y-0.5">
        <img src={spinWheel} alt="" className="aspect-square w-full max-w-[180px] rounded-full object-contain transition-transform duration-500 group-hover:rotate-12" />
        <span className="text-title font-semibold">Spin wheel</span>
        <span className="-mt-2 text-small text-l-ink3">Pick a name at random</span>
      </Link>
    </div>
  </div>
);

export default ToolsPage;
