import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProductCategories from "./ProductCategories";
import Products from "./Products";
import apiClient from "../api/client";

jest.mock("../api/client", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const ACCOUNTS = [
  { Id: 1, Code: "4000", Name: "Sales Revenue", Type: "Income", IsActive: true },
  { Id: 2, Code: "5000", Name: "Cost of Goods Sold", Type: "Expense", IsActive: true },
];

const CATEGORIES = [
  { Id: 1, Name: "Software", Description: null, IncomeAccount: null, ExpenseAccount: null, IsActive: true },
];

function mockGet({ categories = CATEGORIES, products = [], accounts = ACCOUNTS } = {}) {
  apiClient.get.mockImplementation((url) => {
    if (url === "/inventory/product-categories") return Promise.resolve({ data: categories });
    if (url === "/inventory/products") return Promise.resolve({ data: products });
    if (url === "/finance/accounts") return Promise.resolve({ data: accounts });
    return Promise.reject(new Error(`unexpected url: ${url}`));
  });
}

function renderWithRouter(element, options) {
  mockGet(options);
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe("ProductCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders existing categories, showing account names via eager-loaded relations", async () => {
    renderWithRouter(<ProductCategories />, {
      categories: [
        {
          Id: 1,
          Name: "Software",
          Description: null,
          IncomeAccount: { Code: "4000", Name: "Sales Revenue" },
          ExpenseAccount: { Code: "5000", Name: "Cost of Goods Sold" },
          IsActive: true,
        },
      ],
    });

    expect(await screen.findByText("Software")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "4000 — Sales Revenue" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "5000 — Cost of Goods Sold" })).toBeInTheDocument();
  });

  it("creates a category using Accounts fetched from the Finance API for the pickers", async () => {
    apiClient.post.mockResolvedValue({
      data: {
        Id: 2,
        Name: "Hardware",
        Description: null,
        IncomeAccount: { Code: "4000", Name: "Sales Revenue" },
        ExpenseAccount: null,
        IsActive: true,
      },
    });

    renderWithRouter(<ProductCategories />, { categories: [] });
    await waitFor(() => {
      expect(
        within(screen.getByLabelText(/income account/i)).getByRole("option", {
          name: "4000 — Sales Revenue",
        }),
      ).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText("Name"), "Hardware");
    await userEvent.selectOptions(screen.getByLabelText(/income account/i), "1");
    await userEvent.click(screen.getByRole("button", { name: /add category/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/inventory/product-categories", {
        Name: "Hardware",
        Description: undefined,
        IncomeAccountId: 1,
        ExpenseAccountId: undefined,
      });
    });
    expect(await screen.findByText("Hardware")).toBeInTheDocument();
  });

  it("archives a category and removes it from the table", async () => {
    apiClient.delete.mockResolvedValue({});
    renderWithRouter(<ProductCategories />, {
      categories: [
        { Id: 1, Name: "Software", Description: null, IncomeAccount: null, ExpenseAccount: null, IsActive: true },
      ],
    });

    await screen.findByText("Software");
    await userEvent.click(screen.getByRole("button", { name: /archive/i }));

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith("/inventory/product-categories/1");
    });
    await waitFor(() => {
      expect(screen.queryByText("Software")).not.toBeInTheDocument();
    });
  });
});

describe("Products", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders existing products with their category name", async () => {
    renderWithRouter(<Products />, {
      products: [
        {
          Id: 1,
          SKU: "WID-1",
          Name: "Widget",
          Category: { Name: "Software" },
          Type: "Storable",
          SalePrice: "19.9900",
          CostPrice: "10.0000",
          IsActive: true,
        },
      ],
    });

    expect(await screen.findByText("WID-1")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Software" })).toBeInTheDocument();
    expect(screen.getByText("19.9900")).toBeInTheDocument();
  });

  it("creates a product with prices sent as strings, never parsed into numbers", async () => {
    apiClient.post.mockResolvedValue({
      data: {
        Id: 2,
        SKU: "WID-2",
        Name: "Gadget",
        Category: { Name: "Software" },
        Type: "Storable",
        SalePrice: "29.9900",
        CostPrice: "15.0000",
        IsActive: true,
      },
    });

    renderWithRouter(<Products />, { products: [] });
    await screen.findByRole("option", { name: "Software" });

    await userEvent.type(screen.getByLabelText("SKU"), "WID-2");
    await userEvent.type(screen.getByLabelText("Name"), "Gadget");
    await userEvent.selectOptions(screen.getByLabelText("Category"), "1");
    await userEvent.type(screen.getByLabelText("Sale Price"), "29.99");
    await userEvent.type(screen.getByLabelText("Cost Price"), "15");
    await userEvent.click(screen.getByRole("button", { name: /add product/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/inventory/products", {
        SKU: "WID-2",
        Name: "Gadget",
        CategoryId: 1,
        Type: "Storable",
        SalePrice: "29.99",
        CostPrice: "15",
      });
    });
    expect(await screen.findByText("WID-2")).toBeInTheDocument();
  });

  it("archives a product and removes it from the table", async () => {
    apiClient.delete.mockResolvedValue({});
    renderWithRouter(<Products />, {
      products: [
        {
          Id: 1,
          SKU: "WID-1",
          Name: "Widget",
          Category: { Name: "Software" },
          Type: "Storable",
          SalePrice: "19.9900",
          CostPrice: "10.0000",
          IsActive: true,
        },
      ],
    });

    await screen.findByText("WID-1");
    await userEvent.click(screen.getByRole("button", { name: /archive/i }));

    await waitFor(() => {
      expect(apiClient.delete).toHaveBeenCalledWith("/inventory/products/1");
    });
    await waitFor(() => {
      expect(screen.queryByText("WID-1")).not.toBeInTheDocument();
    });
  });
});
