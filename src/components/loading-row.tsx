import { TableCell, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";

export const LoadingRow = () => (
  <TableRow>
    <TableCell colSpan={10}>
      <div className="flex items-center justify-center p-8">
        <motion.div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
      </div>
    </TableCell>
  </TableRow>
);
