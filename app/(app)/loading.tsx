import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={28} />
    </div>
  );
}
