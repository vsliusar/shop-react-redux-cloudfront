/**
 * Mock product data.
 */
const products = [
  {
    id: "7567ec4b-b10c-48c5-9345-fc73e48a80aa",
    title: "Product A",
    description: "Short Description A",
    price: 10.99,
  },
  {
    id: "7567ec4b-b10c-48c5-9345-fc73e48a80ab",
    title: "Product B",
    description: "Short Description B",
    price: 20.5,
  },
  {
    id: "7567ec4b-b10c-48c5-9345-fc73e48a80ac",
    title: "Product C",
    description: "Short Description C",
    price: 5.0,
  },
  {
    id: "7567ec4b-b10c-48c5-9345-fc73e48a80ad",
    title: "Product D",
    description: "Short Description D",
    price: 15.75,
  },
];

/**
 * Retrieves all products.
 * @returns {Array<Object>} An array of product objects.
 */
export const getAllProducts = () => {
  return products;
};

/**
 * Retrieves a product by its ID.
 * @param {string} productId - The ID of the product to retrieve.
 * @returns {Object | undefined} The product object if found, otherwise undefined.
 */
export const getProductById = (productId: any) => {
  return products.find((product) => product.id === productId);
};
