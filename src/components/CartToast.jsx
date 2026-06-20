import { useEffect, useState } from 'react'
import { useCart } from '../hooks/useCart'

export default function CartToast() {
  const { lastAdded } = useCart()
  const [visible, setVisible] = useState(false)
  const [productName, setProductName] = useState('')

  useEffect(() => {
    if (!lastAdded) return
    setProductName(lastAdded.name)
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(timer)
  }, [lastAdded])

  if (!lastAdded) return null

  return (
    <div className={`cart-toast ${visible ? 'cart-toast-visible' : ''}`} role="status" aria-live="polite">
      <span className="cart-toast-icon">✅</span>
      <span><strong>{productName}</strong> ajouté au panier</span>

      <style>{`
        .cart-toast {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: var(--color-primary);
          color: #fff;
          padding: 12px 20px;
          border-radius: 999px;
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          z-index: 300;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .cart-toast-visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .cart-toast-icon { font-size: 16px; }
        @media (min-width: 768px) {
          .cart-toast { bottom: 32px; }
        }
      `}</style>
    </div>
  )
}
