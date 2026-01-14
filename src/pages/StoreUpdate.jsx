import React from "react";
import { Trash2 } from "lucide-react";


const StoreUpdateForm = ({ item, brandList, setBrandList, onCancel, onSave }) => {

const updateBrand = (brandIndex, packIndex, field, value) => {
    const updated = [...brandList];
    updated[brandIndex].packs[packIndex][field] = value;

    const pack = updated[brandIndex].packs[packIndex];

    let qtyKg = 0;

    // NORMAL PACK (0.1, 0.2, 1 etc.)
    if (!isNaN(Number(pack.packQty)) && pack.packQty !== "others" && pack.packQty !== "loose") {
        qtyKg = Number(pack.packQty);
    }

    // OTHERS – Convert Qty + Unit to KG
    if (pack.packQty === "others") {
        const q = Number(pack.otherQty || 0);

        if (pack.otherUnit === "Kg") qtyKg = q;
        if (pack.otherUnit === "Grams") qtyKg = q / 1000;
        if (pack.otherUnit === "Litre") qtyKg = q;     // treat litre as Kg for foods
        if (pack.otherUnit === "Pcs") qtyKg = q;       // no conversion
    }

    // LOOSE QTY – Direct Rate/Kg
    if (pack.packQty === "loose") {
        qtyKg = 1; // rate is already per kg
    }

    // AUTO CALCULATE RATE / KG
    if (pack.rate && qtyKg > 0) {
        pack.autoRate = (Number(pack.rate) / qtyKg).toFixed(2);
    } else {
        pack.autoRate = "";
    }

    setBrandList(updated);
};

    const addPackRow = (brandIndex) => {
        const updated = [...brandList];
        updated[brandIndex].packs.push({
            packQty: "",
            rate: "",
            autoRate: ""
        });
        setBrandList(updated);
    };

    const removePackRow = (brandIndex, packIndex) => {
        const updated = [...brandList];
        updated[brandIndex].packs = updated[brandIndex].packs.filter((_, i) => i !== packIndex);
        setBrandList(updated);
    };


    const addBrandRow = () => {
        setBrandList([
            ...brandList,
            {
                 brandType: "",
                brand: "",
                packs: [
                    { packQty: "", rate: "", mrp: "", autoRate: "" }
                ]
            }
        ]);
    };

    const removeBrandRow = (index) => {
        const updated = brandList.filter((_, i) => i !== index);
        setBrandList(updated);
    };
    const getMinRateAndCheck = () => {
        let minRate = Infinity;
        let hasHighRate = false;

        // Find minimum rate per kg
        brandList.forEach(brand => {
            brand.packs.forEach(pack => {
                if (pack.autoRate && pack.autoRate !== "") {
                    const rate = Number(pack.autoRate);
                    if (rate < minRate) minRate = rate;
                }
            });
        });

        // Check if any rate exceeds min by 10%
        if (minRate !== Infinity) {
            brandList.forEach(brand => {
                brand.packs.forEach(pack => {
                    if (pack.autoRate && pack.autoRate !== "") {
                        const rate = Number(pack.autoRate);
                        if (rate > minRate * 1.1) {
                            hasHighRate = true;
                        }
                    }
                });
            });
        }

        return { minRate: minRate === Infinity ? 0 : minRate, hasHighRate };
    };

    const { minRate, hasHighRate } = getMinRateAndCheck();
    return (
        <div className="w-full bg-white p-6 border border-gray-300 rounded-xl shadow relative">


            {/* HEADER WITH CLOSE BUTTON ON RIGHT */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                    {item.name}
                </h3>

                <button
                    onClick={onCancel}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-400 text-gray-700 hover:bg-red-500 hover:text-white transition"
                >
                    ✕
                </button>
            </div>

            {brandList.map((brand, bi) => (
                <div key={bi} className="border rounded-lg p-4 mb-4 bg-gray-50">
<div className="mb-4 flex gap-3 items-end">

    {/* BRAND TYPE */}
    <div className="w-48">
        <label className="text-gray-700 font-medium block mb-1">
            Brand Type
        </label>
        <select
            className="border rounded px-3 py-2 w-full"
            value={brand.brandType || ""}
            onChange={(e) => {
                const updated = [...brandList];
                updated[bi].brandType = e.target.value;
                setBrandList(updated);
            }}
        >
            <option value="">Select</option>
            <option value="Cooperative">Cooperative</option>
            <option value="JPC">JPC</option>
            <option value="Non-JPC">Non-JPC</option>
        </select>
    </div>

    {/* BRAND NAME */}
    <div className="flex-1">
        <label className="text-gray-700 font-medium block mb-1">
            Brand Name
        </label>
        <input
            type="text"
            className={`border rounded px-3 py-2 w-full ${
                brandList.filter((b, idx) =>
                    idx !== bi &&
                    b.brand.trim().toLowerCase() === brand.brand.trim().toLowerCase()
                ).length > 0
                    ? 'border-red-500 bg-red-50'
                    : ''
            }`}
            value={brand.brand}
            onChange={(e) => {
                const updated = [...brandList];
                updated[bi].brand = e.target.value;
                setBrandList(updated);
            }}
        />
    </div>

    {/* DELETE ICON – SAME ROW */}
    {brandList.length > 1 && (
       <button
    onClick={() => removeBrandRow(bi)}
    className="text-red-500 hover:text-red-700 p-2"
    title="Delete Brand"
>
    <Trash2 className="w-5 h-5" />
</button>

    )}
</div>


{/* PACK SIZES */}
{brand.packs.map((p, pi) => (
    <div key={pi} className="border rounded p-3 mb-3 bg-white">

        {/* MAIN ROW */}
<div className="grid gap-3 mb-2 items-end grid-cols-7">

            <div className="col-span-2">
    <label className="text-gray-700 font-medium block mb-1">Pack Size</label>
    <select
        className="border rounded px-2 py-2 w-full"
        value={p.packQty}
        onChange={(e) => updateBrand(bi, pi, "packQty", e.target.value)}
    >
        <option value="">Select</option>
        {(() => {
            // Get already selected pack sizes in this brand (excluding current pack)
       const selectedPacks = brand.packs
    .filter(
        (pack, idx) =>
            idx !== pi &&
            pack.packQty &&
            pack.packQty !== "others" // 👈 allow multiple "others"
    )
    .map(pack => pack.packQty);

            const allOptions = [
                { value: "0.1", label: "100 Gm" },
                { value: "0.2", label: "200 Gm" },
                { value: "0.25", label: "250 Gm" },
                { value: "0.5", label: "500 Gm" },
                { value: "1", label: "1 Kg" },
                { value: "2", label: "2 Kg" },
                { value: "others", label: "Others" },
                { value: "loose", label: "Loose Qty" }
            ];

            return allOptions.map(opt => {
                const isDisabled = selectedPacks.includes(opt.value);
                return (
                    <option 
                        key={opt.value} 
                        value={opt.value}
                        disabled={isDisabled}
                        style={isDisabled ? { color: '#ccc' } : {}}
                    >
                        {opt.label} {isDisabled ? '' : ''}
                    </option>
                );
            });
        })()}
    </select>
</div>
         <div className="col-span-1">
    <label className="text-gray-700 font-medium block mb-1">Rate (₹)</label>
    <input
        type="number"
        min="0"
        step="0.01"
        className="border rounded px-2 py-2 w-full"
        value={p.rate}
        onChange={(e) => {
            const value = e.target.value;
            // Only allow positive numbers or empty string
            if (value === '' || parseFloat(value) >= 0) {
                updateBrand(bi, pi, "rate", value);
            }
        }}
        onKeyDown={(e) => {
            // Prevent minus key
            if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
            }
        }}
    />
</div>

            {/* RATE PER KG */}
            <div className="col-span-1">
                <label className="text-blue-700 font-medium block mb-1">Rate / Kg</label>
                <div className="font-bold text-gray-800 border rounded px-2 py-2 bg-gray-100 text-center">
                    {p.autoRate || "-"}
                </div>
            </div>
{p.packQty !== "loose" && item.gst > 0 && (
    <div className="col-span-1">
        <label className="text-gray-600 font-medium block mb-1">GST</label>
        <div className="text-gray-700 border rounded px-2 py-2 bg-gray-50 text-center">
            {item.gst}%
        </div>
    </div>
)}
            {/* + BUTTON */}
            <div className="col-span-1 flex items-end">
                <button
                    onClick={() => addPackRow(bi)}
                    className="bg-blue-600 text-white px-2 py-2 rounded text-sm w-8"
                >
                    +
                </button>
            </div>

            {/* REMOVE BUTTON */}
            <div className="col-span-1 flex items-end">
                {pi !== 0 && (
                   <button
    onClick={() => removePackRow(bi, pi)}
    className="text-red-500 hover:text-red-700 p-2"
    title="Delete Pack"
>
    <Trash2 className="w-5 h-5" />
</button>
                )}
            </div>

        </div>


        {/* ------------------ OTHERS (SAME LINE UI) ------------------ */}
        {p.packQty === "others" && (
            <div className="grid grid-cols-6 gap-3 mt-2">

                {/* Qty */}
                <div className="col-span-2">
                    <label className="text-gray-700 font-medium block mb-1">Qty</label>
                    <input
                        type="number"
                        className="border rounded px-2 py-2 w-full"
                        value={p.otherQty || ""}
                        onChange={(e) => updateBrand(bi, pi, "otherQty", e.target.value)}
                    />
                </div>

             {/* Unit */}
<div className="col-span-2">
    <label className="text-gray-700 font-medium block mb-1">Unit</label>
    <select
        className="border rounded px-2 py-2 w-full"
        value={p.otherUnit || ""}
        onChange={(e) => updateBrand(bi, pi, "otherUnit", e.target.value)}
    >
        <option value="">Select</option>
        {/* Conditionally render options based on item's main unit */}
        {(item.indent === "Kg" || item.indent === "Litre") ? (
            <>
                <option value="Grams">Grams</option>
                <option value="Kg">Kg</option>
            </>
        ) : item.indent === "Pcs" || item.indent === "Nos" ? (
            <option value="Pcs">Pcs</option>
        ) : (
            // Fallback for other units
            <>
                <option value="Kg">Kg</option>
                <option value="Grams">Grams</option>
                <option value="Pcs">Pcs</option>
            </>
        )}
    </select>
</div>
            </div>
        )}

        {/* ------------------ LOOSE QTY ALERT ------------------ */}
        {p.packQty === "loose" && (
            <div className="mt-2 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 text-sm">
                Enter Rate as Rate per Kg
            </div>
        )}

    </div>
))}

                </div>
            ))}

            <div className="mt-4">
                {/* Alert Message */}
                {hasHighRate && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2">
                        <span className="text-amber-600 text-lg">⚠️</span>
                        <div className="text-sm text-amber-800">
                            <strong>Price Alert:</strong> Rate per KG difference is more than 10%, proceed if its correct.
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                    <button
                        onClick={addBrandRow}
                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                        Add Brand
                    </button>
<button
    onClick={() => {
        // Check for duplicate brands
        const brandNames = brandList.map(b => b.brand.trim().toLowerCase());
        const hasDuplicates = brandNames.some((name, idx) => 
            name && brandNames.indexOf(name) !== idx
        );
        
        if (hasDuplicates) {
            alert("Cannot save: Duplicate brand names found. Please use unique brand names.");
            return;
        }
        
        // ✅ NEW: Check for empty Brand Type
        const emptyBrandType = brandList.some(b => !b.brandType || b.brandType.trim() === "");
        if (emptyBrandType) {
            alert("Cannot save: Brand Type is mandatory for all brands.");
            return;
        }
        
        onSave();
    }}
    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
>
    Save Changes
</button>
                </div>
            </div>

        </div>
    );
};

export default StoreUpdateForm;