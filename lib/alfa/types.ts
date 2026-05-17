export type StockStatus = 'in_stock' | 'low' | 'out_of_stock' | 'made_to_order';

export type Category = {
  id: string;
  slug: string;
  name: string;
  sort_order?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  category_id: string | null;
  categories?: Pick<Category, 'id' | 'slug' | 'name'> | null;
  price_amount: number | null;
  price_prefix: string | null;
  currency: string | null;
  stock_quantity: number | null;
  stock_status: StockStatus;
  stock_label: string;
  badge: string | null;
  layout_class: string | null;
  reveal_delay: string | null;
  tone_main: string | null;
  tone_alt: string | null;
  cap_main: string | null;
  cap_alt: string | null;
  image_main_url: string | null;
  image_alt_url: string | null;
  is_active: boolean;
  sort_order?: number;
};

export type ProductPayload = Partial<
  Omit<Product, 'id' | 'categories' | 'stock_label'>
> & {
  slug: string;
  name: string;
  stock_label: string;
  currency: string;
  layout_class: string;
  reveal_delay: string;
};
