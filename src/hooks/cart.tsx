import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromAsyncStorage = await AsyncStorage.getItem('products');

      if (productsFromAsyncStorage)
        setProducts(JSON.parse(productsFromAsyncStorage));
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const newProducts = [...products, { ...product, quantity: 1 }];

      await AsyncStorage.setItem('products', JSON.stringify(products));
      setProducts(newProducts);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      await AsyncStorage.setItem('products', JSON.stringify(products));

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products.reduce((descrementedProducts, product) => {
        if (product.id === id) {
          if (product.quantity === 1) return descrementedProducts;
          return [
            ...descrementedProducts,
            { ...product, quantity: product.quantity - 1 },
          ];
        }

        return [...descrementedProducts, product];
      }, [] as Product[]);

      await AsyncStorage.setItem('products', JSON.stringify(products));

      setProducts(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
