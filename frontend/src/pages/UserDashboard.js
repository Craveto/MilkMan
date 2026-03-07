import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService, userService } from '../services/api';
import '../styles/UserDashboard.css';

const paymentTemplate = {
  payment_method: 'card',
  card_holder: '',
  card_number: '',
  expiry: '',
  cvv: '',
  upi_id: '',
  bank_name: '',
};

const cartPaymentTemplate = {
  payment_method: 'card',
  card_number: '',
  expiry: '',
  cvv: '',
  upi_id: '',
  bank_name: '',
};

const parsePrice = (value) => Number.parseFloat(value || 0);
const normalizeName = (value) => (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const formatDateTime = (value) => new Date(value).toLocaleString();

const formatPaymentDetail = (method, source) => {
  if (method === 'card') {
    const digits = (source?.card_number || '').replace(/\D/g, '');
    const tail = digits.slice(-4);
    return tail ? `Card ending ${tail}` : 'Card payment';
  }
  if (method === 'upi') {
    return source?.upi_id ? `UPI ${source.upi_id}` : 'UPI payment';
  }
  if (method === 'netbanking') {
    return source?.bank_name ? `Net Banking (${source.bank_name})` : 'Net banking payment';
  }
  return 'Online payment';
};

function UserDashboard({ authUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const backTarget = location?.state?.from;
  const showBack = Boolean(backTarget);
  const heroSlides = [
    {
      src: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Fresh milk bottles arranged on a dairy counter',
      caption: 'Fresh products monitored daily',
    },
    {
      src: 'https://images.pexels.com/photos/236213/pexels-photo-236213.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Delivery person carrying dairy crates for doorstep supply',
      caption: 'Reliable doorstep delivery planning',
    },
    {
      src: 'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=1400',
      alt: 'Digital payment flow on mobile for subscription billing',
      caption: 'Faster subscription and payment tracking',
    },
  ];

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dashboardData, setDashboardData] = useState({
    customer: null,
    products: [],
    subscriptions: [],
    recent_payments: [],
    subscription_basket: [],
  });
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentData, setPaymentData] = useState(paymentTemplate);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCheckoutOpen, setCartCheckoutOpen] = useState(false);
  const [cartCheckoutSubmitting, setCartCheckoutSubmitting] = useState(false);
  const [cartPaymentData, setCartPaymentData] = useState(cartPaymentTemplate);
  const [notifications, setNotifications] = useState([]);
  const [cartAddedActivity, setCartAddedActivity] = useState([]);
  const [cartWarning, setCartWarning] = useState('');
  const [intentHandled, setIntentHandled] = useState(false);
  const [activePanel, setActivePanel] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const plansRef = useRef(null);

  const activeSubscription = dashboardData.customer?.current_subscription || null;
  const activePlan = useMemo(() => {
    if (!activeSubscription) return null;
    const planId = Number(activeSubscription.subscription_id);
    return dashboardData.subscriptions.find((plan) => Number(plan.subscription_id) === planId) || null;
  }, [activeSubscription, dashboardData.subscriptions]);

  const subscriptionProductLimit = useMemo(() => {
    const limit = Number(activePlan?.max_products);
    return Number.isFinite(limit) && limit > 0 ? limit : null;
  }, [activePlan?.max_products]);

  const subscriptionBasketCount = useMemo(() => (
    (dashboardData.subscription_basket || []).filter((item) => item.is_active !== false).length
  ), [dashboardData.subscription_basket]);

  const cartStats = useMemo(() => {
    const items = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const total = cartItems
      .filter((item) => !item.unavailable)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { items, total };
  }, [cartItems]);

  const paymentMethodLabel = useMemo(() => {
    if (paymentData.payment_method === 'upi') return 'UPI';
    if (paymentData.payment_method === 'netbanking') return 'Net Banking';
    return 'Card';
  }, [paymentData.payment_method]);

  const cartPaymentMethodLabel = useMemo(() => {
    if (cartPaymentData.payment_method === 'upi') return 'UPI';
    if (cartPaymentData.payment_method === 'netbanking') return 'Net Banking';
    if (cartPaymentData.payment_method === 'cod') return 'COD';
    return 'Card';
  }, [cartPaymentData.payment_method]);
  const [subscriptionActionPrompt, setSubscriptionActionPrompt] = useState(null);

  const productsByCategory = useMemo(() => {
    const grouped = dashboardData.products.reduce((accumulator, product) => {
      const category = (product.category_name || 'General').trim() || 'General';
      if (!accumulator[category]) accumulator[category] = [];
      accumulator[category].push(product);
      return accumulator;
    }, {});

    return Object.entries(grouped)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([category, products]) => ({
        category,
        products: products.sort((first, second) => first.name.localeCompare(second.name)),
      }));
  }, [dashboardData.products]);

  const featuredList = useMemo(() => {
    if (featuredProducts && featuredProducts.length > 0) return featuredProducts;
    return (dashboardData.products || []).slice(0, 10);
  }, [dashboardData.products, featuredProducts]);

  const subscribedPlans = useMemo(() => {
    const plansById = new Map(
      dashboardData.subscriptions.map((plan) => [Number(plan.subscription_id), plan]),
    );
    const grouped = new Map();

    dashboardData.recent_payments.forEach((payment) => {
      const subscriptionId = Number(payment.subscription);
      if (!subscriptionId) return;
      const existing = grouped.get(subscriptionId);
      const paymentTime = payment.paid_at || payment.created_at;
      const payload = {
        subscription_id: subscriptionId,
        name: payment.subscription_name || `Plan #${subscriptionId}`,
        amount: payment.amount,
        status: payment.status,
        activity_at: paymentTime,
        availablePlan: plansById.get(subscriptionId) || null,
      };
      if (!existing || new Date(paymentTime) > new Date(existing.activity_at)) {
        grouped.set(subscriptionId, payload);
      }
    });

    if (activeSubscription) {
      const activeId = Number(activeSubscription.subscription_id);
      grouped.set(activeId, {
        subscription_id: activeId,
        name: activeSubscription.name,
        amount: plansById.get(activeId)?.price || null,
        status: 'active',
        activity_at: activeSubscription.subscription_start_date,
        availablePlan: plansById.get(activeId) || null,
      });
    }

    return Array.from(grouped.values()).sort((first, second) => (
      new Date(second.activity_at || 0).getTime() - new Date(first.activity_at || 0).getTime()
    ));
  }, [dashboardData.recent_payments, dashboardData.subscriptions, activeSubscription]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userService.getDashboardData(authUser?.id);
      setDashboardData(response.data);
    } catch (apiError) {
      setError(apiError?.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    let alive = true;
    const fetchFeatured = async () => {
      setFeaturedLoading(true);
      try {
        const response = await productService.getFeatured();
        const items = Array.isArray(response?.data) ? response.data : (response?.data?.products || []);
        if (alive) setFeaturedProducts(Array.isArray(items) ? items : []);
      } catch (error) {
        if (alive) setFeaturedProducts([]);
      } finally {
        if (alive) setFeaturedLoading(false);
      }
    };

    fetchFeatured();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (authUser?.id) {
      fetchDashboard();
    }
  }, [authUser?.id, fetchDashboard]);

  useEffect(() => {
    const preferredPanel = window.localStorage.getItem('mm_user_active_panel');
    if (preferredPanel) {
      setActivePanel(preferredPanel);
      window.localStorage.removeItem('mm_user_active_panel');
    }
  }, []);

  useEffect(() => {
    if (intentHandled || !authUser?.id) return;
    const rawIntent = window.localStorage.getItem('mm_pending_checkout_cart');
    if (!rawIntent) {
      setIntentHandled(true);
      return;
    }

    let intentItems = [];
    try {
      intentItems = JSON.parse(rawIntent);
    } catch (error) {
      window.localStorage.removeItem('mm_pending_checkout_cart');
      setIntentHandled(true);
      return;
    }

    if (!Array.isArray(intentItems) || intentItems.length === 0) {
      window.localStorage.removeItem('mm_pending_checkout_cart');
      setIntentHandled(true);
      return;
    }

    // Wait for dashboard products to load before resolving intent items to avoid false "unavailable" matches.
    if (loading) return;

    const productsById = new Map(
      dashboardData.products.map((product) => [Number(product.product_id), product]),
    );
    const productsByName = new Map(
      dashboardData.products.map((product) => [normalizeName(product.name), product]),
    );

    const hydratedItems = intentItems.map((item, index) => {
      const requestedName = item?.name || '';
      const requestedProductId = Number(item?.product_id);
      const matchedProduct = productsById.get(requestedProductId)
        || productsByName.get(normalizeName(requestedName));
      const qty = Math.max(1, Number(item?.qty) || 1);

      if (matchedProduct) {
        return {
          product_id: matchedProduct.product_id,
          name: matchedProduct.name,
          price: parsePrice(matchedProduct.price),
          quantity: qty,
          unavailable: false,
          requires_subscription: Boolean(matchedProduct.subscription_only),
        };
      }

      return {
        product_id: `missing-${normalizeName(requestedName)}-${index}`,
        name: requestedName || 'Unknown Product',
        price: parsePrice(item?.priceValue),
        quantity: qty,
        unavailable: true,
        requires_subscription: false,
      };
    });

    setCartItems((previous) => {
      const merged = [...previous];
      hydratedItems.forEach((incoming) => {
        const existingIndex = merged.findIndex((item) => item.product_id === incoming.product_id);
        if (existingIndex >= 0) {
          merged[existingIndex] = {
            ...merged[existingIndex],
            quantity: merged[existingIndex].quantity + incoming.quantity,
            unavailable: Boolean(merged[existingIndex].unavailable || incoming.unavailable),
          };
        } else {
          merged.push(incoming);
        }
      });
      return merged;
    });

    setCartOpen(true);
    setCartCheckoutOpen(false);
    if (hydratedItems.some((item) => item.unavailable)) {
      setCartWarning('Some selected products are unavailable. Remove them to continue checkout.');
      setTimeout(() => setCartWarning(''), 2000);
    }

    window.localStorage.removeItem('mm_pending_checkout_cart');
    setIntentHandled(true);
  }, [authUser?.id, dashboardData.products, intentHandled, loading]);

  const pushNotification = (message) => {
    const noteId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const notification = { id: noteId, message };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((note) => note.id !== noteId));
    }, 10000);
  };

  const dismissNotification = (noteId) => {
    setNotifications((prev) => prev.filter((note) => note.id !== noteId));
  };

  const handleDownloadReceipt = () => {
    if (!successReceipt) return;
    const billLines = [
      'MilkMan Payment Receipt',
      `Type: ${successReceipt.type === 'subscription' ? 'Subscription' : 'Order'}`,
      `Receipt No: ${successReceipt.receiptNo}`,
      `Date: ${formatDateTime(successReceipt.paidAt)}`,
      `Customer: ${successReceipt.customerName}`,
      `Reference: ${successReceipt.transactionReference}`,
      `Payment: ${successReceipt.paymentMethod} (${successReceipt.paymentDetail})`,
      '',
      'Items:',
      ...successReceipt.items.map((item, index) => (
        `${index + 1}. ${item.name} | Qty ${item.quantity} | INR ${item.unitPrice.toFixed(2)} | INR ${item.lineTotal.toFixed(2)}`
      )),
      '',
      `Subtotal: INR ${successReceipt.subtotal.toFixed(2)}`,
      `Tax: INR ${successReceipt.tax.toFixed(2)}`,
      `Grand Total: INR ${successReceipt.total.toFixed(2)}`,
      '',
      'Status: Paid Successfully',
    ];
    const billContent = billLines.join('\n');
    const blob = new Blob([billContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${successReceipt.receiptNo}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (notifications.length === 0) return undefined;
    const closeOnAnyClick = (event) => {
      if (event.target?.closest?.('.toast-action-btn')) return;
      setNotifications([]);
    };
    document.addEventListener('pointerdown', closeOnAnyClick);
    return () => document.removeEventListener('pointerdown', closeOnAnyClick);
  }, [notifications.length]);

  const handleNotificationGoToCart = (noteId) => {
    dismissNotification(noteId);
    setCartOpen(true);
  };

  const handleSubscribe = async (event) => {
    event.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const selectedPlanSnapshot = { ...selectedPlan };
      const paymentSnapshot = { ...paymentData };
      const payload = {
        customer_id: authUser.id,
        subscription_id: selectedPlan.subscription_id,
        payment_method: paymentData.payment_method,
      };

      if (paymentData.payment_method === 'card') {
        payload.card_holder = paymentData.card_holder;
        payload.card_number = paymentData.card_number;
        payload.expiry = paymentData.expiry;
        payload.cvv = paymentData.cvv;
      } else if (paymentData.payment_method === 'upi') {
        payload.upi_id = paymentData.upi_id;
      } else {
        payload.bank_name = paymentData.bank_name;
      }

      const response = await userService.subscribe(payload);
      const paidAt = response?.data?.payment?.paid_at || new Date().toISOString();
      const amount = parsePrice(selectedPlanSnapshot.price);
      const reference = (
        response?.data?.payment?.transaction_reference
        || response?.data?.transaction_reference
        || `MM-SUB-${Date.now()}`
      );
      const receiptNo = `MM-INV-${Date.now()}`;
      const paymentMethod = paymentSnapshot.payment_method === 'upi'
        ? 'UPI'
        : paymentSnapshot.payment_method === 'netbanking'
          ? 'Net Banking'
          : 'Card';
      setSuccessReceipt({
        type: 'subscription',
        title: 'Subscription Activated',
        subtitle: 'Payment completed successfully. Your subscription is now active.',
        customerName: authUser?.first_name || authUser?.username || 'MilkMan User',
        receiptNo,
        transactionReference: reference,
        paidAt,
        paymentMethod,
        paymentDetail: formatPaymentDetail(paymentSnapshot.payment_method, paymentSnapshot),
        items: [
          {
            name: `${selectedPlanSnapshot.name} Plan`,
            quantity: 1,
            unitPrice: amount,
            lineTotal: amount,
          },
        ],
        subtotal: amount,
        tax: 0,
        total: amount,
      });
      setSuccess(response.data?.message || 'Payment successful');
      setSelectedPlan(null);
      setPaymentData(paymentTemplate);
      await fetchDashboard();
    } catch (apiError) {
      const data = apiError?.response?.data;
      setError(data?.reason || data?.error || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateSubscription = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const response = await userService.deactivateSubscription({ customer_id: authUser.id });
      setSuccess(response.data?.message || 'Subscription deactivated');
      await fetchDashboard();
    } catch (apiError) {
      setError(apiError?.response?.data?.error || 'Failed to deactivate subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubscriptionAction = async () => {
    if (!subscriptionActionPrompt) return;
    if (subscriptionActionPrompt.type === 'activate') {
      if (subscriptionActionPrompt.plan?.availablePlan) {
        setSelectedPlan(subscriptionActionPrompt.plan.availablePlan);
      }
      setSubscriptionActionPrompt(null);
      return;
    }
    if (subscriptionActionPrompt.type === 'deactivate') {
      await handleDeactivateSubscription();
      setSubscriptionActionPrompt(null);
    }
  };

  const handleAddToCart = (product) => {
    const existing = cartItems.find((item) => item.product_id === product.product_id);
    setCartItems((previous) => {
      const itemExists = previous.find((item) => item.product_id === product.product_id);
      if (itemExists) {
        return previous.map((item) => (
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
      return [
        ...previous,
        {
          product_id: product.product_id,
          name: product.name,
          price: parsePrice(product.price),
          quantity: 1,
          unavailable: false,
        },
      ];
    });
    const timestamp = new Date().toISOString();
    setCartAddedActivity((prev) => [
      {
        id: `${product.product_id}-${timestamp}`,
        product_name: product.name,
        action: existing ? 'Quantity increased in cart' : 'Added to cart',
        added_at: timestamp,
      },
      ...prev,
    ].slice(0, 25));
    pushNotification(`Great choice! ${product.name} added to cart`);
    setSuccess(`${product.name} added to cart`);
  };

  const handleDecreaseCartQty = (productId) => {
    setCartItems((previous) => {
      const existing = previous.find((item) => item.product_id === productId);
      if (!existing) return previous;
      if (existing.quantity <= 1) {
        return previous.filter((item) => item.product_id !== productId);
      }
      return previous.map((item) => (
        item.product_id === productId ? { ...item, quantity: item.quantity - 1 } : item
      ));
    });
  };

  const handleAddToSubscriptionBasket = async (product) => {
    setError('');
    setSuccess('');

    if (!activeSubscription) {
      setActivePanel('subscription');
      setCartWarning('Activate a subscription plan to add subscription-only products.');
      setTimeout(() => setCartWarning(''), 2500);
      if (plansRef.current) {
        plansRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    try {
      const response = await userService.upsertSubscriptionBasket(authUser?.id, {
        product: product.product_id,
        quantity: 1,
        frequency: 'daily',
      });
      const updated = response.data?.item;
      if (updated) {
        setDashboardData((prev) => {
          const existingIndex = (prev.subscription_basket || []).findIndex((item) => item.basket_item_id === updated.basket_item_id);
          const nextBasket = [...(prev.subscription_basket || [])];
          if (existingIndex >= 0) {
            nextBasket[existingIndex] = updated;
          } else {
            nextBasket.unshift(updated);
          }
          return { ...prev, subscription_basket: nextBasket };
        });
      }
      setSuccess(`${product.name} added to subscription basket`);
      setActivePanel('subscription');
      if (plansRef.current) {
        plansRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.error || 'Failed to add item to subscription basket');
    }
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((previous) => previous.filter((item) => item.product_id !== productId));
  };

  const handleProductSubscribe = () => {
    setCartOpen(false);
    setCartCheckoutOpen(false);
    setActivePanel('subscription');
    if (plansRef.current) {
      plansRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const closeCartBoxes = () => {
    setCartOpen(false);
    setCartCheckoutOpen(false);
  };

  const handleOpenCartCheckout = () => {
    if (cartItems.length === 0) {
      setError('Add products to cart before checkout');
      return;
    }
    const subscriptionOnlyLines = cartItems.filter((item) => item.requires_subscription);
    if (subscriptionOnlyLines.length > 0) {
      setCartWarning('Some items require subscription delivery. Add them to your plan basket to continue.');
      setTimeout(() => setCartWarning(''), 2500);
      setCartCheckoutOpen(false);
      setActivePanel('subscription');
      if (plansRef.current) {
        plansRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    const unavailableItems = cartItems.filter((item) => item.unavailable);
    if (unavailableItems.length > 0) {
      setCartWarning('Remove unavailable items before checkout.');
      setTimeout(() => setCartWarning(''), 2000);
      return;
    }
    setError('');
    setCartCheckoutOpen(true);
  };

  const handleCartCheckoutPayment = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (cartPaymentData.payment_method === 'cod') {
      // No validation required for Cash on Delivery.
    } else if (cartPaymentData.payment_method === 'card') {
      if (!cartPaymentData.card_number || !cartPaymentData.expiry || !cartPaymentData.cvv) {
        setError('Enter complete card details');
        return;
      }
    } else if (cartPaymentData.payment_method === 'upi') {
      if (!cartPaymentData.upi_id.includes('@')) {
        setError('Enter a valid UPI ID');
        return;
      }
    } else if (!cartPaymentData.bank_name) {
      setError('Bank name is required for net banking');
      return;
    }

    setCartCheckoutSubmitting(true);
    try {
      const availableCartItems = cartItems.filter((item) => !item.unavailable && !item.requires_subscription);
      const checkoutItems = availableCartItems.map((item) => ({ ...item }));
      const cartPaymentSnapshot = { ...cartPaymentData };
      if (availableCartItems.length === 0) {
        setCartWarning('No available products in cart for checkout.');
        setTimeout(() => setCartWarning(''), 2000);
        return;
      }
      const payload = {
        customer_id: authUser.id,
        items: availableCartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        payment_method: cartPaymentData.payment_method,
      };

      if (cartPaymentData.payment_method === 'card') {
        payload.card_number = cartPaymentData.card_number;
        payload.expiry = cartPaymentData.expiry;
        payload.cvv = cartPaymentData.cvv;
      } else if (cartPaymentData.payment_method === 'upi') {
        payload.upi_id = cartPaymentData.upi_id;
      } else if (cartPaymentData.payment_method === 'netbanking') {
        payload.bank_name = cartPaymentData.bank_name;
      }

      const response = await userService.cartCheckout(payload);
      const orderId = response?.data?.order?.order_id;
      const paidAt = response?.data?.payment?.paid_at || new Date().toISOString();
      const transactionReference = (
        response?.data?.payment?.transaction_reference
        || response?.data?.order?.transaction_reference
        || (orderId ? `MM-ORD-${orderId}` : `MM-ORD-${Date.now()}`)
      );
      const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const paymentMethod = cartPaymentSnapshot.payment_method === 'upi'
        ? 'UPI'
        : cartPaymentSnapshot.payment_method === 'netbanking'
          ? 'Net Banking'
          : cartPaymentSnapshot.payment_method === 'cod'
            ? 'Cash On Delivery'
            : 'Card';
      setSuccessReceipt({
        type: 'order',
        title: cartPaymentSnapshot.payment_method === 'cod' ? 'Order Placed (COD)' : 'Order Payment Successful',
        subtitle: orderId ? `Order #${orderId} confirmed and ready for processing.` : 'Order confirmed and ready for processing.',
        customerName: authUser?.first_name || authUser?.username || 'MilkMan User',
        receiptNo: orderId ? `MM-BILL-${orderId}` : `MM-BILL-${Date.now()}`,
        transactionReference,
        paidAt,
        paymentMethod,
        paymentDetail: formatPaymentDetail(cartPaymentSnapshot.payment_method, cartPaymentSnapshot),
        items: checkoutItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.price * item.quantity,
        })),
        subtotal,
        tax: 0,
        total: subtotal,
      });
      setCartItems([]);
      setCartPaymentData(cartPaymentTemplate);
      setCartCheckoutOpen(false);
      setCartOpen(false);
      setSuccess(orderId ? `Order #${orderId} confirmed via ${cartPaymentMethodLabel}` : 'Order confirmed');
    } catch (apiError) {
      const data = apiError?.response?.data;
      if (Array.isArray(data?.subscription_only_items) && data.subscription_only_items.length > 0) {
        setCartWarning('Some items require subscription delivery. Remove them from cart and add to your plan basket.');
        setTimeout(() => setCartWarning(''), 3000);
        setCartCheckoutOpen(false);
        return;
      }
      setError(data?.reason || data?.error || 'Cart checkout payment failed');
    } finally {
      setCartCheckoutSubmitting(false);
    }
  };

  if (loading) {
    return <div className="dashboard"><div className="loading">Loading user dashboard...</div></div>;
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header user-header">
        <div>
          <h1>User Dashboard</h1>
          <p>Welcome back, {authUser?.first_name || 'User'}.</p>
        </div>
        <div className="user-header-actions">
          {showBack && (
            <button
              type="button"
              className="header-back-btn"
              onClick={() => navigate(backTarget)}
              aria-label="Back"
              title="Back"
            >
              ← Back
            </button>
          )}
          <button type="button" className="cart-btn" onClick={() => setCartOpen(true)}>
            <FaShoppingCart />
            <span>Cart ({cartStats.items})</span>
          </button>
        </div>
      </div>

      <div className="notification-stack">
        {notifications.map((note) => (
          <div key={note.id} className="toast-note">
            <span className="toast-emoji" role="img" aria-label="reward">{'\uD83C\uDFC6'}</span>
            <div className="toast-content">
              <span>{note.message}</span>
              <button
                type="button"
                className="toast-action-btn"
                onClick={() => handleNotificationGoToCart(note.id)}
              >
                Go to cart
              </button>
            </div>
            <span className="toast-timer" aria-hidden="true" />
          </div>
        ))}
      </div>

      {cartOpen && (
        <div className="floating-overlay" onClick={closeCartBoxes}>
          <div className="floating-box cart-floating" onClick={(event) => event.stopPropagation()}>
            <div className="cart-panel-title">
              <h2>My Cart</h2>
              <div>Total: INR {cartStats.total.toFixed(2)}</div>
            </div>
            {!activeSubscription && (
              <div className="cart-subscription-note">
                <div>
                  <strong>Subscription required</strong>
                  <span>Activate a plan to checkout and schedule deliveries.</span>
                </div>
                <button type="button" onClick={handleProductSubscribe}>Choose Plan</button>
              </div>
            )}
            {cartWarning && <div className="cart-warning">{cartWarning}</div>}

            {cartItems.length === 0 ? (
              <div className="subscription-empty">Your cart is empty.</div>
            ) : (
              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.product_id} className={`cart-item ${item.unavailable ? 'unavailable' : ''}`}>
                    <div className="cart-item-main">
                      <div className="cart-item-name-row">
                        <strong>{item.name}</strong>
                        <span className="cart-item-qty">Qty {item.quantity}</span>
                      </div>
                      <div className="cart-item-price">
                        {item.unavailable ? 'Unavailable' : `INR ${(item.price * item.quantity).toFixed(2)}`}
                      </div>
                      {item.requires_subscription && (
                        <div className="unavailable-note">Requires subscription delivery</div>
                      )}
                      {item.unavailable && <div className="unavailable-note">Currently unavailable</div>}
                    </div>
                    <div className="cart-actions">
                      <button type="button" className="cart-remove-btn" onClick={() => handleRemoveFromCart(item.product_id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="cart-footer">
              <button type="button" className="ghost-btn" onClick={closeCartBoxes}>Close</button>
              <button type="button" onClick={handleOpenCartCheckout} disabled={cartItems.length === 0}>
                Checkout & Payment Gateway
              </button>
            </div>
          </div>

          {cartCheckoutOpen && (
            <div className="floating-box checkout-floating" onClick={(event) => event.stopPropagation()}>
              <h2>Cart Checkout</h2>
              <p>Pay INR {cartStats.total.toFixed(2)} using {cartPaymentMethodLabel}</p>

              <form className="payment-form" onSubmit={handleCartCheckoutPayment}>
                <label>
                  Payment Method
                  <select
                    value={cartPaymentData.payment_method}
                    onChange={(event) => setCartPaymentData({ ...cartPaymentData, payment_method: event.target.value })}
                  >
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="cod">Cash on Delivery</option>
                  </select>
                </label>

                {cartPaymentData.payment_method === 'cod' && (
                  <div className="subscription-empty">
                    You will pay cash on delivery. Order will be marked as pending until delivered.
                  </div>
                )}

                {cartPaymentData.payment_method === 'card' && (
                  <>
                    <label>
                      Card Number
                      <input
                        type="text"
                        value={cartPaymentData.card_number}
                        onChange={(event) => setCartPaymentData({ ...cartPaymentData, card_number: event.target.value })}
                        required
                      />
                    </label>
                    <div className="payment-row">
                      <label>
                        Expiry
                        <input
                          type="text"
                          value={cartPaymentData.expiry}
                          onChange={(event) => setCartPaymentData({ ...cartPaymentData, expiry: event.target.value })}
                          required
                        />
                      </label>
                      <label>
                        CVV
                        <input
                          type="password"
                          value={cartPaymentData.cvv}
                          onChange={(event) => setCartPaymentData({ ...cartPaymentData, cvv: event.target.value })}
                          required
                        />
                      </label>
                    </div>
                  </>
                )}

                {cartPaymentData.payment_method === 'upi' && (
                  <label>
                    UPI ID
                    <input
                      type="text"
                      value={cartPaymentData.upi_id}
                      onChange={(event) => setCartPaymentData({ ...cartPaymentData, upi_id: event.target.value })}
                      placeholder="name@bank"
                      required
                    />
                  </label>
                )}

                {cartPaymentData.payment_method === 'netbanking' && (
                  <label>
                    Bank Name
                    <input
                      type="text"
                      value={cartPaymentData.bank_name}
                      onChange={(event) => setCartPaymentData({ ...cartPaymentData, bank_name: event.target.value })}
                      required
                    />
                  </label>
                )}

                <div className="payment-actions">
                  <button type="submit" disabled={cartCheckoutSubmitting}>
                    {cartCheckoutSubmitting ? 'Processing...' : `Pay INR ${cartStats.total.toFixed(2)}`}
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => setCartCheckoutOpen(false)}>
                    Back to Cart
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {error && <div className="user-alert error">{error}</div>}
      {success && <div className="user-alert success">{success}</div>}

      <section className="dashboard-switcher">
        <button
          type="button"
          className={`switcher-btn ${activePanel === 'products' ? 'active' : ''}`}
          onClick={() => setActivePanel('products')}
        >
          Available Products
        </button>
        <button
          type="button"
          className={`switcher-btn ${activePanel === 'subscription' ? 'active' : ''}`}
          onClick={() => setActivePanel('subscription')}
        >
          My Subscription
        </button>
        <button
          type="button"
          className={`switcher-btn ${activePanel === 'payments' ? 'active' : ''}`}
          onClick={() => setActivePanel('payments')}
        >
          Recent Payments
        </button>
        <button
          type="button"
          className={`switcher-btn ${activePanel === 'added' ? 'active' : ''}`}
          onClick={() => setActivePanel('added')}
        >
          Item Added List
        </button>
      </section>

      <div className="slide-panel-shell">
        {!activePanel && (
          <section className="welcome-panel">
            <div className="welcome-hero">
              <div className="welcome-head">
                <h2>Smart Dairy Control Center</h2>
                <p>
                  Track products, subscriptions, orders, and payment activity from one dashboard built for daily milk operations.
                </p>
                <div className="welcome-badges">
                  <span>Fresh delivery flow</span>
                  <span>Fast payment tracking</span>
                  <span>Daily operations clarity</span>
                </div>
              </div>
              <div className="welcome-slider" aria-label="Dairy operations highlights">
                <div className="welcome-slider-track">
                  {heroSlides.concat(heroSlides).map((slide, index) => (
                    <figure key={`${slide.caption}-${index}`} className="welcome-slide">
                      <img
                        className="welcome-hero-image"
                        src={slide.src}
                        alt={slide.alt}
                        loading="lazy"
                      />
                      <figcaption>{slide.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            <div className="welcome-metrics">
              <article className="welcome-metric-card">
                <h3>{dashboardData.products.length}</h3>
                <span>Available Products</span>
              </article>
              <article className="welcome-metric-card">
                <h3>{dashboardData.recent_payments.length}</h3>
                <span>Recent Payments</span>
              </article>
              <article className="welcome-metric-card">
                <h3>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</h3>
                <span>Items in Cart</span>
              </article>
              <article className="welcome-metric-card">
                <h3>{activeSubscription ? 'Active' : 'Pending'}</h3>
                <span>Subscription Status</span>
              </article>
            </div>

            <div className="welcome-grid">
              <article className="welcome-info-card">
                <h4>How To Use</h4>
                <p>Start with <strong>Available Products</strong> to add items to cart or choose a plan via <strong>My Subscription</strong>.</p>
              </article>
              <article className="welcome-info-card">
                <h4>Recommended Next Step</h4>
                <p>{activeSubscription ? 'Review your latest payment records and manage renewals.' : 'Activate a subscription plan to unlock full order flow.'}</p>
              </article>
            </div>
          </section>
        )}

        {!activePanel && (
          <>
            <section className="featured-section panel-slide" aria-label="Featured items">
              <div className="featured-head">
                <div>
                  <h2>Featured Picks</h2>
                  <p>Fast add to cart — like your favorite food apps.</p>
                </div>
                <button type="button" className="featured-cta" onClick={() => setActivePanel('products')}>
                  View all products
                </button>
              </div>

              {featuredLoading && featuredList.length === 0 ? (
                <div className="featured-skeleton">Loading featured items...</div>
              ) : featuredList.length === 0 ? (
                <div className="subscription-empty">No featured items available yet.</div>
              ) : (
                <div className="featured-strip" role="list">
                  {featuredList.slice(0, 12).map((product) => {
                    const inCart = cartItems.find((item) => item.product_id === product.product_id);
                    const qty = inCart ? inCart.quantity : 0;
                    const isSubscriptionOnly = Boolean(product.subscription_only);
                    return (
                      <article key={product.product_id} className="featured-card" role="listitem">
                        <div className="featured-card-top">
                          <div className="featured-badge">{product.category_name || 'General'}</div>
                          {isSubscriptionOnly && <div className="featured-tag">Plan</div>}
                        </div>

                        <div className="featured-media" aria-hidden="true">
                          <span>{(product.name || 'M').slice(0, 1).toUpperCase()}</span>
                        </div>

                        <div className="featured-body">
                          <h3 title={product.name}>{product.name}</h3>
                          <div className="featured-subtitle">{product.description || 'Freshly sourced daily.'}</div>
                          <div className="featured-price-row">
                            <div className="featured-price">INR {product.price}</div>
                            <div className="featured-meta">Safe packing</div>
                          </div>
                        </div>

                        <div className="featured-actions">
                          {isSubscriptionOnly ? (
                            <button type="button" onClick={() => handleAddToSubscriptionBasket(product)}>
                              Add to Plan
                            </button>
                          ) : qty > 0 ? (
                            <div className="qty-stepper" aria-label={`Quantity controls for ${product.name}`}>
                              <button type="button" className="qty-btn" onClick={() => handleDecreaseCartQty(product.product_id)} aria-label="Decrease quantity">−</button>
                              <span className="qty-count" aria-label="Quantity">{qty}</span>
                              <button type="button" className="qty-btn" onClick={() => handleAddToCart(product)} aria-label="Increase quantity">+</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => handleAddToCart(product)}>
                              Add
                            </button>
                          )}

                          <button type="button" className="ghost-btn" onClick={() => setCartOpen(true)}>
                            Cart
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="dashboard-extras panel-slide" aria-label="Helpful shortcuts and info">
              <div className="extras-grid">
                <article className="extras-card">
                  <div className="extras-head">
                    <h3>Delivery & Basket</h3>
                    <span className={`extras-pill ${activeSubscription ? 'good' : 'warn'}`}>
                      {activeSubscription ? 'Active plan' : 'Plan needed'}
                    </span>
                  </div>
                  <p>
                    {activeSubscription
                      ? `You have ${subscriptionBasketCount} item(s) in your plan basket. Review deliveries and pause anytime.`
                      : 'Activate a subscription plan to schedule deliveries and checkout your cart.'}
                  </p>
                  <div className="extras-actions">
                    <button type="button" onClick={() => navigate('/user/delivery')}>Open Delivery</button>
                    <button type="button" className="ghost-btn" onClick={() => setActivePanel('subscription')}>Manage Plan</button>
                  </div>
                </article>

                <article className="extras-card">
                  <div className="extras-head">
                    <h3>Quick Shortcuts</h3>
                    <span className="extras-pill neutral">Fast</span>
                  </div>
                  <p>Jump directly to the section you use most — no scrolling required.</p>
                  <div className="extras-actions wrap">
                    <button type="button" onClick={() => setActivePanel('products')}>Browse Products</button>
                    <button type="button" className="ghost-btn" onClick={() => setActivePanel('payments')}>Payments</button>
                    <button type="button" className="ghost-btn" onClick={() => setActivePanel('added')}>Plan Items</button>
                    <button type="button" className="ghost-btn" onClick={() => navigate('/user/profile')}>Profile</button>
                  </div>
                </article>

                <article className="extras-card">
                  <div className="extras-head">
                    <h3>Support & Savings</h3>
                    <span className="extras-pill good">New</span>
                  </div>
                  <p>Need help or want offers? Raise a ticket, track updates, and check your rewards & referrals.</p>
                  <div className="extras-actions">
                    <button type="button" onClick={() => navigate('/user/support')}>Support</button>
                    <button type="button" className="ghost-btn" onClick={() => navigate('/user/offers')}>Offers</button>
                  </div>
                </article>
              </div>
            </section>
          </>
        )}

        {activePanel === 'subscription' && (
          <>
            <section className="user-summary panel-slide">
              <h2>My Subscriptions</h2>
              {activeSubscription && (
                <div className="subscription-capacity">
                  <div>
                    <strong>Delivery Basket Limit</strong>
                    <span>
                      {subscriptionProductLimit ? `${subscriptionBasketCount} / ${subscriptionProductLimit} products in plan basket` : 'No limit found for this plan'}
                    </span>
                  </div>
                  {subscriptionProductLimit && (
                    <div className="capacity-bar" aria-hidden="true">
                      <div
                        className="capacity-fill"
                        style={{ width: `${Math.min(100, (subscriptionBasketCount / subscriptionProductLimit) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
              {subscribedPlans.length === 0 ? (
                <div className="subscription-empty">No subscriptions yet. Select a plan below.</div>
              ) : (
                <div className="subscription-list">
                  {subscribedPlans.map((plan) => {
                    const isCurrent = activeSubscription && Number(activeSubscription.subscription_id) === Number(plan.subscription_id);
                    const isPromptActive = subscriptionActionPrompt?.plan?.subscription_id === plan.subscription_id;
                    const isUnavailable = !plan.availablePlan && !isCurrent;
                    return (
                      <article key={plan.subscription_id} className={`subscription-item-card ${isCurrent ? 'current' : ''} ${isUnavailable ? 'unavailable' : ''}`}>
                        <div className="subscription-item-head">
                          <strong>{plan.name}</strong>
                          <span className={`status-tag ${isCurrent ? 'current' : plan.status}`}>{isCurrent ? 'active' : plan.status}</span>
                        </div>
                        <div className="subscription-item-meta">
                          <span>{plan.amount ? `INR ${plan.amount}` : 'Price unavailable'}</span>
                          <span>{plan.activity_at ? new Date(plan.activity_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {isCurrent && (
                          <div className="subscription-item-dates">
                            <div>Start: {new Date(activeSubscription.subscription_start_date).toLocaleString()}</div>
                            <div>End: {new Date(activeSubscription.subscription_end_date).toLocaleString()}</div>
                          </div>
                        )}
                        {isPromptActive ? (
                          <div className="subscription-actions">
                            <button type="button" onClick={handleConfirmSubscriptionAction} disabled={submitting}>
                              Confirm
                            </button>
                            <button type="button" className="ghost-btn" onClick={() => setSubscriptionActionPrompt(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="subscription-actions">
                            {isCurrent ? (
                              <button
                                type="button"
                                className="danger-btn"
                                onClick={() => setSubscriptionActionPrompt({ type: 'deactivate', plan })}
                                disabled={submitting}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSubscriptionActionPrompt({ type: 'activate', plan })}
                                disabled={isUnavailable}
                              >
                                {isUnavailable ? 'Unavailable' : 'Activate'}
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="user-section panel-slide" ref={plansRef}>
              <h2>Available Subscription Plans</h2>
              <div className="card-grid">
                {dashboardData.subscriptions.map((plan) => (
                  <div key={plan.subscription_id} className={`plan-card ${selectedPlan?.subscription_id === plan.subscription_id ? 'selected' : ''}`}>
                    <h3>{plan.name}</h3>
                    <p>{plan.description || 'No description provided.'}</p>
                    <div className="plan-price">INR {plan.price}</div>
                    <div className="plan-meta">{plan.duration_days} days | {plan.billing_cycle}</div>
                    <button type="button" onClick={() => setSelectedPlan(plan)}>
                      Subscribe
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="user-section panel-slide">
              <h2>Subscription Basket</h2>
              {!activeSubscription ? (
                <div className="subscription-empty">Activate a plan to schedule subscription deliveries.</div>
              ) : (dashboardData.subscription_basket || []).length === 0 ? (
                <div className="subscription-empty">No subscription items yet. Add milk items using "Add To Plan".</div>
              ) : (
                <div className="added-list">
                  {(dashboardData.subscription_basket || []).map((item) => (
                    <div key={item.basket_item_id} className="added-list-item">
                      <div>
                        <strong>{item.product_name}</strong>
                        <div>Qty {item.quantity} · {item.frequency}</div>
                      </div>
                      <div className="cart-actions">
                        <button
                          type="button"
                          className="cart-remove-btn"
                          onClick={async () => {
                            try {
                              await userService.deleteSubscriptionBasket(authUser?.id, item.product);
                              setDashboardData((prev) => ({
                                ...prev,
                                subscription_basket: (prev.subscription_basket || []).filter((x) => x.basket_item_id !== item.basket_item_id),
                              }));
                            } catch (apiError) {
                              setError(apiError?.response?.data?.error || 'Failed to remove basket item');
                            }
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activePanel === 'products' && (
          <section className="user-section panel-slide">
            <h2>Available Products</h2>
            {productsByCategory.length === 0 ? (
              <div className="subscription-empty">No products available yet.</div>
            ) : (
              <div className="category-groups">
                {productsByCategory.map((group) => (
                  <section key={group.category} className="category-block">
                    <div className="category-block-header">
                      <h3>{group.category}</h3>
                      <span>{group.products.length} items</span>
                    </div>
                    <div className="card-grid products">
                      {group.products.map((product) => (
                        <div key={product.product_id} className="product-card">
                          <div className="product-card-media">
                            <span>{(product.name || 'M').slice(0, 1).toUpperCase()}</span>
                          </div>
                          <div className="product-card-body">
                            <h3>{product.name}</h3>
                            <div className="product-meta">{product.category_name || 'General'}</div>
                            <p>{product.description || 'No description available.'}</p>
                            <div className="product-price-row">
                              <div className="product-price">INR {product.price}</div>
                              <small>Inclusive of all taxes</small>
                            </div>
                            {product.subscription_only && (
                              <div className="product-meta">Subscription delivery</div>
                            )}
                          </div>
                          <div className="product-actions">
                            {product.subscription_only ? (
                              <>
                                <button type="button" onClick={() => handleAddToSubscriptionBasket(product)}>
                                  Add To Plan
                                </button>
                                <button type="button" className="ghost-btn" onClick={handleProductSubscribe}>
                                  View Plans
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" onClick={() => handleAddToCart(product)}>Add To Cart</button>
                                <button type="button" className="ghost-btn" onClick={() => setCartOpen(true)}>Open Cart</button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        )}

        {activePanel === 'payments' && (
          <section className="user-section panel-slide">
            <h2>Recent Payments</h2>
            {dashboardData.recent_payments.length === 0 ? (
              <div className="subscription-empty">No payment history yet.</div>
            ) : (
              <div className="payment-history">
                {dashboardData.recent_payments.map((payment) => (
                  <div key={payment.payment_id} className={`payment-item ${payment.status}`}>
                    <div>
                      <strong>{payment.subscription_name}</strong>
                      <div>{payment.transaction_reference}</div>
                    </div>
                    <div>
                      <div>INR {payment.amount}</div>
                      <div className="status-tag">{payment.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activePanel === 'added' && (
          <section className="user-section panel-slide">
            <h2>Item Added List</h2>
            {cartAddedActivity.length === 0 ? (
              <div className="subscription-empty">No items added to cart yet.</div>
            ) : (
              <div className="added-list">
                {cartAddedActivity.map((entry) => (
                  <div key={entry.id} className="added-list-item">
                    <div>
                      <strong>{entry.product_name}</strong>
                      <div>{entry.action}</div>
                    </div>
                    <div className="added-at">
                      {new Date(entry.added_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {selectedPlan && (
        <div className="subscription-overlay" onClick={() => {
          setSelectedPlan(null);
          setPaymentData(paymentTemplate);
        }}>
          <section className="payment-section subscription-popup panel-slide" onClick={(event) => event.stopPropagation()}>
            <div className="subscription-popup-head">
              <h2>Payment Gateway</h2>
              <button
                type="button"
                className="modal-favicon-btn"
                onClick={() => {
                  setSelectedPlan(null);
                  setPaymentData(paymentTemplate);
                }}
                aria-label="Close payment popup"
                title="Close"
              >
                <span className="modal-favicon-mark">×</span>
              </button>
            </div>
            <p>
              Paying for: <strong>{selectedPlan.name}</strong> (INR {selectedPlan.price}) via {paymentMethodLabel}
            </p>

            <form className="payment-form" onSubmit={handleSubscribe}>
              <label>
                Payment Method
                <select
                  value={paymentData.payment_method}
                  onChange={(event) => setPaymentData({ ...paymentData, payment_method: event.target.value })}
                >
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </label>

              {paymentData.payment_method === 'card' && (
                <>
                  <label>
                    Card Holder
                    <input
                      type="text"
                      value={paymentData.card_holder}
                      onChange={(event) => setPaymentData({ ...paymentData, card_holder: event.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Card Number
                    <input
                      type="text"
                      value={paymentData.card_number}
                      onChange={(event) => setPaymentData({ ...paymentData, card_number: event.target.value })}
                      placeholder="4111 1111 1111 1111"
                      required
                    />
                  </label>
                  <div className="payment-row">
                    <label>
                      Expiry
                      <input
                        type="text"
                        value={paymentData.expiry}
                        onChange={(event) => setPaymentData({ ...paymentData, expiry: event.target.value })}
                        placeholder="MM/YY"
                        required
                      />
                    </label>
                    <label>
                      CVV
                      <input
                        type="password"
                        value={paymentData.cvv}
                        onChange={(event) => setPaymentData({ ...paymentData, cvv: event.target.value })}
                        required
                      />
                    </label>
                  </div>
                </>
              )}

              {paymentData.payment_method === 'upi' && (
                <label>
                  UPI ID
                  <input
                    type="text"
                    value={paymentData.upi_id}
                    onChange={(event) => setPaymentData({ ...paymentData, upi_id: event.target.value })}
                    placeholder="name@bank"
                    required
                  />
                </label>
              )}

              {paymentData.payment_method === 'netbanking' && (
                <label>
                  Bank Name
                  <input
                    type="text"
                    value={paymentData.bank_name}
                    onChange={(event) => setPaymentData({ ...paymentData, bank_name: event.target.value })}
                    required
                  />
                </label>
              )}

              <div className="payment-actions">
                <button type="submit" disabled={submitting}>
                  {submitting ? 'Processing...' : `Pay INR ${selectedPlan.price}`}
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setSelectedPlan(null);
                    setPaymentData(paymentTemplate);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {false && !activePanel && (
        <section className="dashboard-extras panel-slide" aria-label="Helpful shortcuts and info">
          <div className="extras-grid">
            <article className="extras-card">
              <div className="extras-head">
                <h3>Delivery & Basket</h3>
                <span className={`extras-pill ${activeSubscription ? 'good' : 'warn'}`}>
                  {activeSubscription ? 'Active plan' : 'Plan needed'}
                </span>
              </div>
              <p>
                {activeSubscription
                  ? `You have ${subscriptionBasketCount} item(s) in your plan basket. Review deliveries and pause anytime.`
                  : 'Activate a subscription plan to schedule deliveries and checkout your cart.'}
              </p>
              <div className="extras-actions">
                <button type="button" onClick={() => navigate('/user/delivery')}>Open Delivery</button>
                <button type="button" className="ghost-btn" onClick={() => setActivePanel('subscription')}>Manage Plan</button>
              </div>
            </article>

            <article className="extras-card">
              <div className="extras-head">
                <h3>Quick Shortcuts</h3>
                <span className="extras-pill neutral">Fast</span>
              </div>
              <p>Jump directly to the section you use most — no scrolling required.</p>
              <div className="extras-actions wrap">
                <button type="button" onClick={() => setActivePanel('products')}>Browse Products</button>
                <button type="button" className="ghost-btn" onClick={() => setActivePanel('payments')}>Payments</button>
                <button type="button" className="ghost-btn" onClick={() => setActivePanel('added')}>Plan Items</button>
                <button type="button" className="ghost-btn" onClick={() => navigate('/user/profile')}>Profile</button>
              </div>
            </article>

            <article className="extras-card">
              <div className="extras-head">
                <h3>Support & Savings</h3>
                <span className="extras-pill good">New</span>
              </div>
              <p>Need help or want offers? Raise a ticket, track updates, and check your rewards & referrals.</p>
              <div className="extras-actions">
                <button type="button" onClick={() => navigate('/user/support')}>Support</button>
                <button type="button" className="ghost-btn" onClick={() => navigate('/user/offers')}>Offers</button>
              </div>
            </article>
          </div>
        </section>
      )}

      {false && !activePanel && (
        <section className="featured-section panel-slide" aria-label="Featured items">
          <div className="featured-head">
            <div>
              <h2>Featured Picks</h2>
              <p>Fast add to cart — like your favorite food apps.</p>
            </div>
            <button type="button" className="ghost-btn" onClick={() => setActivePanel('products')}>
              View all products
            </button>
          </div>

          {featuredLoading && featuredList.length === 0 ? (
            <div className="featured-skeleton">Loading featured items...</div>
          ) : featuredList.length === 0 ? (
            <div className="subscription-empty">No featured items available yet.</div>
          ) : (
            <div className="featured-strip" role="list">
              {featuredList.slice(0, 12).map((product) => {
                const inCart = cartItems.find((item) => item.product_id === product.product_id);
                const qty = inCart ? inCart.quantity : 0;
                const isSubscriptionOnly = Boolean(product.subscription_only);
                return (
                  <article key={product.product_id} className="featured-card" role="listitem">
                    <div className="featured-card-top">
                      <div className="featured-badge">{product.category_name || 'General'}</div>
                      {isSubscriptionOnly && <div className="featured-tag">Plan</div>}
                    </div>

                    <div className="featured-media" aria-hidden="true">
                      <span>{(product.name || 'M').slice(0, 1).toUpperCase()}</span>
                    </div>

                    <div className="featured-body">
                      <h3 title={product.name}>{product.name}</h3>
                      <div className="featured-subtitle">{product.description || 'Freshly sourced daily.'}</div>
                      <div className="featured-price-row">
                        <div className="featured-price">INR {product.price}</div>
                        <div className="featured-meta">Safe packing</div>
                      </div>
                    </div>

                    <div className="featured-actions">
                      {isSubscriptionOnly ? (
                        <button type="button" onClick={() => handleAddToSubscriptionBasket(product)}>
                          Add to Plan
                        </button>
                      ) : qty > 0 ? (
                        <div className="qty-stepper" aria-label={`Quantity controls for ${product.name}`}>
                          <button type="button" className="qty-btn" onClick={() => handleDecreaseCartQty(product.product_id)} aria-label="Decrease quantity">−</button>
                          <span className="qty-count" aria-label="Quantity">{qty}</span>
                          <button type="button" className="qty-btn" onClick={() => handleAddToCart(product)} aria-label="Increase quantity">+</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => handleAddToCart(product)}>
                          Add
                        </button>
                      )}

                      <button type="button" className="ghost-btn" onClick={() => setCartOpen(true)}>
                        Cart
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {cartStats.items > 0 && !cartOpen && !cartCheckoutOpen && (
        <div className="mini-cart-bar" role="region" aria-label="Cart quick view">
          <div className="mini-cart-inner">
            <div className="mini-cart-left">
              <div className="mini-cart-title">Cart</div>
              <div className="mini-cart-sub">
                {cartStats.items} item(s) • INR {cartStats.total.toFixed(2)}
              </div>
            </div>
            <button type="button" className="mini-cart-btn" onClick={() => setCartOpen(true)}>
              View Cart
            </button>
          </div>
        </div>
      )}

      <footer className="user-footer" aria-label="MilkMan footer">
        <div className="user-footer-inner">
          <div className="user-footer-brand">
            <div className="user-footer-logo">MilkMan</div>
            <div className="user-footer-tagline">Fresh deliveries, simple subscriptions, clear payments.</div>
          </div>

          <div className="user-footer-links">
            <button type="button" onClick={() => navigate('/user/dashboard')}>Dashboard</button>
            <button type="button" onClick={() => navigate('/user/delivery')}>Delivery</button>
            <button type="button" onClick={() => navigate('/user/orders')}>Orders</button>
            <button type="button" onClick={() => navigate('/user/support')}>Support</button>
          </div>

          <div className="user-footer-meta">
            <div><strong>Contact</strong></div>
            <div className="user-footer-small">Email: hello@milkman.app</div>
            <div className="user-footer-small">Phone: +91 90000 00000</div>
          </div>
        </div>
        <div className="user-footer-bottom">
          <span>© {new Date().getFullYear()} MilkMan. All rights reserved.</span>
          <span className="user-footer-dot" aria-hidden="true">•</span>
          <span className="user-footer-small">Built for daily dairy operations</span>
        </div>
      </footer>

      {successReceipt && (
        <div className="receipt-overlay" onClick={() => setSuccessReceipt(null)}>
          <section className="receipt-modal panel-slide" onClick={(event) => event.stopPropagation()}>
            <div className="receipt-head">
              <div>
                <span className="receipt-badge">Payment Success</span>
                <h2>{successReceipt.title}</h2>
                <p>{successReceipt.subtitle}</p>
              </div>
              <button type="button" className="modal-favicon-btn" onClick={() => setSuccessReceipt(null)} aria-label="Close receipt">
                <span className="modal-favicon-mark">x</span>
              </button>
            </div>

            <div className="receipt-meta-grid">
              <div><strong>Customer</strong><span>{successReceipt.customerName}</span></div>
              <div><strong>Date & Time</strong><span>{formatDateTime(successReceipt.paidAt)}</span></div>
              <div><strong>Receipt No</strong><span>{successReceipt.receiptNo}</span></div>
              <div><strong>Reference</strong><span>{successReceipt.transactionReference}</span></div>
              <div><strong>Payment Mode</strong><span>{successReceipt.paymentMethod}</span></div>
              <div><strong>Details</strong><span>{successReceipt.paymentDetail}</span></div>
            </div>

            <div className="receipt-bill">
              <div className="receipt-bill-row receipt-bill-head">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>
              {successReceipt.items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="receipt-bill-row">
                  <span>{item.name}</span>
                  <span>{item.quantity}</span>
                  <span>INR {item.unitPrice.toFixed(2)}</span>
                  <span>INR {item.lineTotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="receipt-total">
                <div><span>Subtotal</span><strong>INR {successReceipt.subtotal.toFixed(2)}</strong></div>
                <div><span>Tax</span><strong>INR {successReceipt.tax.toFixed(2)}</strong></div>
                <div className="grand"><span>Grand Total</span><strong>INR {successReceipt.total.toFixed(2)}</strong></div>
              </div>
            </div>

            <div className="receipt-actions">
              <button type="button" onClick={handleDownloadReceipt}>Download Bill</button>
              <button type="button" className="ghost-btn" onClick={() => setSuccessReceipt(null)}>Close</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
