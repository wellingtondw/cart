import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const handleAddCartProduct = (newCartState: Product[]) => {
    setCart(newCartState)
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartState))
  }

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get('/stock')
      let productInCart = cart.find((product: Product) => product.id === productId)      
      const productInStock = stock.find((product: Product) => product.id === productId)
      const hasProductInStock = productInStock.amount > 0
      const hasProductInCartAndStock = productInCart && productInStock.amount > productInCart.amount

      if(!hasProductInStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(hasProductInCartAndStock) {
        const newCartState = cart.map((product: Product) => {
          if(product.id === productId) {
            return {...product, amount: product.amount + 1}
          }

          return product
        })
 
        handleAddCartProduct(newCartState)
        return        
      }
      
      if(!productInCart) {
        const { data: products } = await api.get('/products')
        const product = products.find((product: Product) => product.id === productId)
        const newProduct = { ...product, amount: 1}
        const newCartState = [...cart, newProduct] 

        handleAddCartProduct(newCartState)
        return
      }

      if(!hasProductInCartAndStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
     const newCartState = cart.filter(product => product.id !== productId)
     
     setCart(newCartState)
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
