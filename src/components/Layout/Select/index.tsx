import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GenericSelectProps<T> {
  items: T[];
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  onSelect: (item: T) => void;
  placeholder?: string;
  filter?: (item: T) => boolean;
}

export default function GenericSelect<T>({
  items,
  getItemId,
  getItemLabel,
  onSelect,
  placeholder = "Select an option...",
  filter,
}: GenericSelectProps<T>) {
  const [selectedId, setSelectedId] = useState("");

  // Validate that selected item still exists
  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const itemExists = items.some((item) => getItemId(item) === selectedId);

    if (!itemExists) {
      setSelectedId("");
    }
  }, [selectedId, items, getItemId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);

    const selectedItem = items.find((item) => getItemId(item) === id);
    if (selectedItem) {
      onSelect(selectedItem);
    }
  };

  const filteredItems = filter ? items.filter(filter) : items;

  return (
    <div className="w-full max-w-3xs space-y-2">
      <Select value={selectedId} onValueChange={handleSelect}>
        <SelectTrigger className="w-full focus-visible:border-primary focus-visible:ring-primary/20 dark:focus-visible:ring-primary/20">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-lg border font-normal border-border-light bg-white text-sm">
          {filteredItems.map((item) => (
            <SelectItem
              key={getItemId(item)}
              value={getItemId(item)}
              className="py-3 px-7 bg-white h-8 font-normal focus:bg-sidebar-light/60 focus:text-text-main cursor-pointer text-sm"
            >
              {getItemLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
