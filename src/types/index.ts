export interface Variant {
  _id: string;
  variantName: string;
  Price: number;
  Price50: number;
  Price100: number;
  StockQuantity: number;
  ImageURL: string;
}

export interface Product {
  _id: string;
  ProductName: string;
  CategoryID: { _id: string; CategoryName: string };
  Description: string;
  variants: Variant[];
}

export interface Category {
  _id: string;
  CategoryName: string;
}

export interface Customer {
  _id: string;
  CustomerName: string;
  Email?: string;
  Phone: string;
  Address: string;
  ProvinceName?: string;
  DistrictName?: string;
  WardName?: string;
}

export interface Order {
  _id: string;
  OrderNumber?: string;
  CustomerId: Customer | string;
  createdAt?: string;
  Status: string;
  TotalAmount: number;
  Items: {
    ProductID: string;
    VariantId?: string;
    variantName?: string;
    Quantity: number;
    Price: number;
  }[];
}