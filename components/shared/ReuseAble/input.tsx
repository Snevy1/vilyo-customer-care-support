import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export type InputTypes = {
  value: string;
  onChange: (data: string) => void;
  className?: string;
  inputClass?: string;
};

const CustomSearch = ({
  onChange,
  value,
  className,
  inputClass,
}: InputTypes) => {
  return (
    <div className={cn(`relative border rounded-lg w-full`, className)}>
      <Search className="absolute  text-gray-600 size-5 top-2 left-1.5" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          ` mr-2  w-full text-sm rounded-lg py-2 pl-8 focus:outline-none pr-1`,
          inputClass
        )}
        placeholder="Search"
      />
    </div>
  );
};

export default CustomSearch;
