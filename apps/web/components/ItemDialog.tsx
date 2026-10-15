"use client";

import { formatEuro, validateSelection } from "@lokma/core";
import { useState } from "react";
import type { MenuItem } from "@/lib/api";

export function ItemDialog({
  item,
  onAdd,
  onClose,
}: {
  item: MenuItem;
  onAdd: (optionIds: string[], quantity: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    // Preselect the first choice of single-choice required groups.
    item.optionGroups.filter((g) => g.minSelect === 1 && g.maxSelect === 1).map((g) => g.options[0]!.id),
  );
  const [quantity, setQuantity] = useState(1);

  const toggle = (groupId: string, optionId: string) => {
    const group = item.optionGroups.find((g) => g.id === groupId)!;
    setSelected((cur) => {
      if (group.maxSelect === 1) {
        const others = cur.filter((id) => !group.options.some((o) => o.id === id));
        return [...others, optionId];
      }
      if (cur.includes(optionId)) return cur.filter((id) => id !== optionId);
      const inGroup = cur.filter((id) => group.options.some((o) => o.id === id)).length;
      return inGroup >= group.maxSelect ? cur : [...cur, optionId];
    });
  };

  const errors = validateSelection(item, selected);
  const unit =
    item.basePrice +
    item.optionGroups.flatMap((g) => g.options).filter((o) => selected.includes(o.id)).reduce((s, o) => s + o.priceDelta, 0);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{item.name}</h2>
          <button className="ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {item.description && <p className="muted">{item.description}</p>}
        {item.allergens.length > 0 && <p className="small muted">Allergens: {item.allergens.join(", ")}</p>}

        {item.optionGroups.map((g) => (
          <fieldset key={g.id} className="option-group">
            <legend>
              {g.name}{" "}
              <span className="small muted">
                {g.minSelect > 0 ? "Required" : "Optional"}
                {g.maxSelect > 1 ? ` · up to ${g.maxSelect}` : ""}
              </span>
            </legend>
            {g.options.map((o) => (
              <label key={o.id} className="option">
                <input
                  type={g.maxSelect === 1 ? "radio" : "checkbox"}
                  name={g.id}
                  checked={selected.includes(o.id)}
                  onChange={() => toggle(g.id, o.id)}
                />
                <span>{o.name}</span>
                {o.priceDelta !== 0 && <span className="muted small">{o.priceDelta > 0 ? "+" : "−"}{formatEuro(Math.abs(o.priceDelta))}</span>}
              </label>
            ))}
          </fieldset>
        ))}

        <div className="dialog-foot">
          <div className="stepper">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Fewer">−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(50, q + 1))} aria-label="More">+</button>
          </div>
          <button className="primary" disabled={errors.length > 0} onClick={() => onAdd(selected, quantity)}>
            Add for {formatEuro(unit * quantity)}
          </button>
        </div>
        {errors.length > 0 && <p className="small error">{errors[0]!.message}</p>}
      </div>
    </div>
  );
}
