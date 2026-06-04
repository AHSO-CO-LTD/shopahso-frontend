"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/api/services/cart.service";
import { hasCartItemUnitPriceChanged } from "@/components/cart/cart-pricing";
import { AUTH_STORAGE_EVENT } from "@/lib/auth/storage";
import { CART_STORAGE_EVENT } from "@/lib/cart/storage";
import type { Cart } from "@/lib/cart/types";

type CartContextValue = {
  cart: Cart | null;
  errorMessage: string | null;
  isDrawerOpen: boolean;
  isLoading: boolean;
  isMutating: boolean;
  addItem: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
  closeDrawer: () => void;
  openDrawer: () => void;
  refreshCart: () => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  setDrawerOpen: (isOpen: boolean) => void;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

function notifyPriceChange(cart: Cart) {
  if (cart.items.some(hasCartItemUnitPriceChanged)) {
    toast.warning("Giá sản phẩm đã thay đổi, vui lòng kiểm tra lại đơn hàng.");
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [, startTransition] = useTransition();

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextCart = await getCart();
      startTransition(() => {
        setCart(nextCart);
      });
      notifyPriceChange(nextCart);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải giỏ hàng.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [startTransition]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshCart();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshCart]);

  useEffect(() => {
    function handleExternalCartChange() {
      void refreshCart();
    }

    window.addEventListener(CART_STORAGE_EVENT, handleExternalCartChange);
    window.addEventListener(AUTH_STORAGE_EVENT, handleExternalCartChange);

    return () => {
      window.removeEventListener(CART_STORAGE_EVENT, handleExternalCartChange);
      window.removeEventListener(AUTH_STORAGE_EVENT, handleExternalCartChange);
    };
  }, [refreshCart]);

  const applyCartMutation = useCallback(
    async (mutation: () => Promise<Cart>, successMessage: string | null) => {
      setIsMutating(true);
      setErrorMessage(null);
      const loadingToastId = successMessage ? toast.loading("Đang cập nhật giỏ hàng...") : null;

      try {
        const nextCart = await mutation();
        startTransition(() => {
          setCart(nextCart);
        });
        if (successMessage && loadingToastId) {
          toast.success(successMessage, { id: loadingToastId });
        }
        notifyPriceChange(nextCart);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể cập nhật giỏ hàng.";
        setErrorMessage(message);
        if (loadingToastId) {
          toast.error(message, { id: loadingToastId });
        } else {
          toast.error(message);
        }
      } finally {
        setIsMutating(false);
      }
    },
    [startTransition],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      errorMessage,
      isDrawerOpen,
      isLoading,
      isMutating,
      addItem: (variantId) => applyCartMutation(() => addCartItem(variantId), "Đã thêm vào giỏ hàng."),
      clear: () => applyCartMutation(clearCart, "Đã xóa toàn bộ giỏ hàng."),
      closeDrawer: () => setIsDrawerOpen(false),
      openDrawer: () => setIsDrawerOpen(true),
      refreshCart,
      removeItem: (itemId) => applyCartMutation(() => removeCartItem(itemId), "Đã xóa sản phẩm khỏi giỏ hàng."),
      setDrawerOpen: setIsDrawerOpen,
      updateQuantity: (itemId, quantity) =>
        applyCartMutation(() => updateCartItemQuantity(itemId, quantity), null),
    }),
    [applyCartMutation, cart, errorMessage, isDrawerOpen, isLoading, isMutating, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
