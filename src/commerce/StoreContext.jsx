import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { api } from "../shared/api";
const Context = createContext(null);
export function StoreProvider({ children }) {
  const [data, setData] = useState(null),
    [user, setUser] = useState(undefined),
    [error, setError] = useState("");
  const [cart, setCart] = useState({ items: [], count: 0, subtotalPaise: 0 });
  const [cartError, setCartError] = useState("");
  const [cartPending, setCartPending] = useState(0);
  const queue = useRef(Promise.resolve());
  const cartRequest = useCallback((options) => {
    setCartPending(n => n + 1);
    const next = queue.current.catch(() => {}).then(async () => {
      try {
        const result = await api("/cart", options);
        setCart(result);
        setCartError("");
        return result;
      } catch (e) {
        setCartError(e.message);
        throw e;
      } finally { setCartPending(n => n - 1); }
    });
    queue.current = next;
    return next;
  }, []);
  const refreshCart = useCallback(() => cartRequest(), [cartRequest]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      api("/public").then(r => { setData(r); setError(""); }).catch(e => setError(e.message));
    };
    refresh();
    refreshCart().catch(() => {});
    api("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => setUser(null));
    window.addEventListener("focus", refresh);
    const timer = setInterval(refresh, 30000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(timer); };
  }, [refreshCart]);
  return (
    <Context.Provider value={{ data, user, setUser, error, cart, cartError, cartBusy: cartPending > 0, refreshCart,
      addToCart: (productId, quantity = 1, variantId = "50ml") => cartRequest({ method: "POST", body: { productId, quantity, variantId } }),
      setCartQuantity: (productId, quantity, variantId = "50ml") => cartRequest({ method: "PATCH", body: { productId, quantity, variantId } }),
    }}>
      {children}
    </Context.Provider>
  );
}
export const useStore = () => useContext(Context);
