import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

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

  const handleChangeCartState = (newCartState: Product[]) => {
    setCart(newCartState)
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartState))
  }

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find((product: Product) => product.id === productId)      

      if(productInCart) {
        updateProductAmount({ productId, amount: productInCart.amount + 1})
        return        
      }
      
      const { data: product } = await api.get(`products/${productId}`)
      const newProduct = { ...product, amount: 1 }
      const newCartState = [...cart, newProduct] 

      handleChangeCartState(newCartState)
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
     const productInCart = cart.find(product => product.id === productId)

     if(!productInCart) {
        toast.error('Erro na remoção do produto');
        return 
     }

     const newCartState = cart.filter(product => product.id !== productId)
     
     handleChangeCartState(newCartState)
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get(`stock/${productId}`)
      const hasProductInCartAndStock = stock.amount >= amount

      if(amount < 1) {
        return
      }

      if(!hasProductInCartAndStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const newCartState = cart.map((product: Product) => {
        if(product.id === productId) {
          return {...product, amount}
        }

        return product
      })
      handleChangeCartState(newCartState)
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
