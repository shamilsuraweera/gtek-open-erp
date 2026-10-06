import { useState } from "react";
import { useReferenceData } from "../finance/useReferenceData";
import ReferenceDataTable from "../finance/components/ReferenceDataTable";

const PRODUCT_TYPES = ["Storable", "Consumable", "Service"];
const inputStyle = { padding: "8px", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "13px", marginBottom: "4px", color: "#374151" };

const EMPTY_FORM = {
  SKU: "",
  Name: "",
  CategoryId: "",
  Type: PRODUCT_TYPES[0],
  SalePrice: "",
  CostPrice: "",
};

function Products() {
  const productsData = useReferenceData("/inventory/products");
  const categoriesData = useReferenceData("/inventory/product-categories");

  const { items, isLoading, error, create, archive } = productsData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeCategories = categoriesData.items.filter((category) => category.IsActive);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!form.CategoryId) {
      setFormError("A category is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await create({
        SKU: form.SKU,
        Name: form.Name,
        CategoryId: Number(form.CategoryId),
        Type: form.Type,
        // Prices stay strings end-to-end — never parsed into a JS number
        // on the client, same rule as the Journal Entry form in Finance.
        SalePrice: form.SalePrice.trim() === "" ? "0" : form.SalePrice.trim(),
        CostPrice: form.CostPrice.trim() === "" ? "0" : form.CostPrice.trim(),
      });
      setForm(EMPTY_FORM);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id) => {
    setFormError(null);
    try {
      await archive(id);
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div>
      <h2>Products</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={labelStyle} htmlFor="product-sku">
            SKU
          </label>
          <input
            id="product-sku"
            value={form.SKU}
            onChange={handleChange("SKU")}
            required
            maxLength={50}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="product-name">
            Name
          </label>
          <input
            id="product-name"
            value={form.Name}
            onChange={handleChange("Name")}
            required
            maxLength={200}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="product-category">
            Category
          </label>
          <select
            id="product-category"
            value={form.CategoryId}
            onChange={handleChange("CategoryId")}
            required
            style={inputStyle}
          >
            <option value="">Select...</option>
            {activeCategories.map((category) => (
              <option key={category.Id} value={category.Id}>
                {category.Name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="product-type">
            Type
          </label>
          <select id="product-type" value={form.Type} onChange={handleChange("Type")} style={inputStyle}>
            {PRODUCT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="product-sale-price">
            Sale Price
          </label>
          <input
            id="product-sale-price"
            value={form.SalePrice}
            onChange={handleChange("SalePrice")}
            inputMode="decimal"
            placeholder="0.00"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="product-cost-price">
            Cost Price
          </label>
          <input
            id="product-cost-price"
            value={form.CostPrice}
            onChange={handleChange("CostPrice")}
            inputMode="decimal"
            placeholder="0.00"
            style={inputStyle}
          />
        </div>
        <button type="submit" disabled={isSubmitting} style={{ padding: "8px 16px" }}>
          {isSubmitting ? "Adding..." : "Add Product"}
        </button>
      </form>

      {formError && <p style={{ color: "#dc2626" }}>{formError}</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {isLoading ? (
        <p>Loading products...</p>
      ) : (
        <ReferenceDataTable
          columns={[
            { key: "SKU", label: "SKU" },
            { key: "Name", label: "Name" },
            { key: "Category", label: "Category", render: (row) => (row.Category ? row.Category.Name : "—") },
            { key: "Type", label: "Type" },
            { key: "SalePrice", label: "Sale Price" },
            { key: "CostPrice", label: "Cost Price" },
          ]}
          rows={items}
          onArchive={handleArchive}
          emptyLabel="No products yet."
        />
      )}
    </div>
  );
}

export default Products;
