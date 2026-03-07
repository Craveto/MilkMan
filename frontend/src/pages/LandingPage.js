import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSignInAlt,
  FaChartLine,
  FaTruck,
  FaShieldAlt,
  FaLeaf,
  FaSnowflake,
  FaClock,
  FaMapMarkedAlt,
  FaQuoteLeft,
  FaChevronLeft,
  FaChevronRight,
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaPhoneAlt,
  FaEnvelope,
  FaInstagram,
  FaLinkedinIn,
  FaFacebookF,
  FaArrowUp,
} from 'react-icons/fa';
import AuthPage from './AuthPage';
import { productService } from '../services/api';
import '../styles/LandingPage.css';

const fallbackFeaturedProducts = [
  {
    id: 1,
    title: 'Farm Fresh Milk',
    detail: 'Daily fresh stock from verified farms with strict morning quality checks and stable supply planning.',
    price: 'INR 52 / L',
    priceValue: 52,
    icon: <FaLeaf />,
    adminName: 'MilkMan Farm Desk',
    location: 'Pune Route',
  },
  {
    id: 2,
    title: 'Buffalo Milk',
    detail: 'High cream and protein rich quality suited for tea shops, sweets, and premium household usage.',
    price: 'INR 68 / L',
    priceValue: 68,
    icon: <FaSnowflake />,
    adminName: 'MilkMan Quality Team',
    location: 'Jaipur Route',
  },
  {
    id: 3,
    title: 'Curd & Dairy Packs',
    detail: 'Ready-to-use curd, paneer, and daily dairy essentials packed for retail and subscription customers.',
    price: 'From INR 35',
    priceValue: 35,
    icon: <FaTruck />,
    adminName: 'MilkMan Partner Hub',
    location: 'Mumbai Route',
  },
];

function LandingPage({
  onLogin,
  onSignup,
  forceAuthModal = false,
  forceAuthTab = 'login',
  closeAuthNavigatesTo = '',
  disableAutoAuthPopup = false,
}) {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const [authNotice, setAuthNotice] = useState('');
  const [centerPopup, setCenterPopup] = useState({ open: false, message: '' });
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [miniCart, setMiniCart] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState(fallbackFeaturedProducts);

  useEffect(() => {
    if (!forceAuthModal) return;
    setModalTab(forceAuthTab || 'login');
    setShowLoginModal(true);
  }, [forceAuthModal, forceAuthTab]);

  useEffect(() => {
    if (disableAutoAuthPopup) return undefined;
    const timerId = setTimeout(() => {
      setModalTab('login');
      setShowLoginModal(true);
    }, 6000);
    return () => clearTimeout(timerId);
  }, [disableAutoAuthPopup]);

  useEffect(() => {
    let idleTimer;
    const handleScroll = () => {
      const scrolled = window.scrollY > 260;
      if (!scrolled) {
        setShowScrollTop(false);
        setScrollActive(false);
        return;
      }
      setShowScrollTop(true);
      setScrollActive(true);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setScrollActive(false), 1400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(idleTimer);
    };
  }, []);

  const openModal = (tab = 'login') => {
    setModalTab(tab);
    setShowLoginModal(true);
  };

  const closeModal = () => {
    setShowLoginModal(false);
    setAuthNotice('');
    if (closeAuthNavigatesTo) {
      navigate(closeAuthNavigatesTo, { replace: true });
    }
  };

  const showPopup = (message) => {
    setCenterPopup({ open: true, message });
    window.setTimeout(() => {
      setCenterPopup((prev) => (prev.open ? { open: false, message: '' } : prev));
    }, 6000);
  };

  const handleSignup = async (payload) => {
    const response = await onSignup(payload);
    if (payload?.role === 'admin' && response?.data?.status === 'pending') {
      closeModal();
      showPopup(`Application submitted (ID: ${response.data.application_id}). You’ll receive credentials if approved.`);
    }
    return response;
  };

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const response = await productService.getFeatured();
        const apiItems = response.data.results || response.data || [];
        if (!Array.isArray(apiItems) || apiItems.length === 0) return;

        const iconOptions = [<FaLeaf />, <FaSnowflake />, <FaTruck />];
        const mappedItems = apiItems.map((item, index) => {
          const priceValue = Number.parseFloat(item.price || 0) || 0;
          const tags = Array.isArray(item.tags) ? item.tags : [];
          const tagLocation = tags.find((tag) => typeof tag === 'string' && tag.trim().length > 0);
          return {
            id: item.product_id,
            title: item.name,
            detail: item.description || `${item.category_name || 'Dairy'} product available for fast delivery.`,
            price: `INR ${priceValue.toFixed(2)}`,
            priceValue,
            icon: iconOptions[index % iconOptions.length],
            adminName: item.created_by_name || 'MilkMan Partner',
            location: tagLocation || item.category_name || 'Local Route',
          };
        });

        setFeaturedProducts(mappedItems);
      } catch (error) {
        // Keep fallback featured products when API is unavailable.
      }
    };

    loadFeaturedProducts();
  }, []);

  useEffect(() => {
    if (featuredProducts.length === 0) {
      setFeaturedIndex(0);
      return;
    }
    if (featuredIndex >= Math.ceil(featuredProducts.length / 2)) {
      setFeaturedIndex(0);
    }
  }, [featuredProducts, featuredIndex]);

  const featuredSlides = useMemo(() => {
    const slides = [];
    for (let index = 0; index < featuredProducts.length; index += 2) {
      slides.push(featuredProducts.slice(index, index + 2));
    }
    return slides;
  }, [featuredProducts]);

  const deliveryOptions = [
    {
      id: 1,
      title: 'Early Morning Route',
      timing: '5:30 AM - 8:00 AM',
      description: 'Best for homes and office pantries before work hours, with route priority for active subscribers.',
      coverage: 'North + Central blocks',
      bestFor: 'Daily home plans',
    },
    {
      id: 2,
      title: 'Flexible Mid-Day Delivery',
      timing: '11:00 AM - 2:00 PM',
      description: 'Perfect for shops, cafes, and subscription top-ups that need batch-based inventory support.',
      coverage: 'Retail and cafe zones',
      bestFor: 'Commercial replenishment',
    },
    {
      id: 3,
      title: 'Evening Refill',
      timing: '6:00 PM - 9:00 PM',
      description: 'Same-day refill options for urgent customer demands with quick status updates and tracking.',
      coverage: 'On-demand mixed areas',
      bestFor: 'Urgent same-day refill',
    },
  ];

  const reviews = [
    {
      id: 1,
      name: 'Ankit Mehra',
      role: 'Retail Partner',
      quote: 'MilkMan reduced our manual follow-up work drastically. Daily subscription tracking is now smooth and less error-prone.',
      rating: 5,
      city: 'Pune',
    },
    {
      id: 2,
      name: 'Sonal Sharma',
      role: 'Home Subscriber',
      quote: 'I can see my payments and plan details in one place. The product add-to-cart and checkout flow feels very straightforward.',
      rating: 5,
      city: 'Jaipur',
    },
    {
      id: 3,
      name: 'Ravi Foods',
      role: 'Cafe Chain',
      quote: 'Delivery slot visibility and quick billing made our team much more reliable during peak hours and surprise demand days.',
      rating: 4,
      city: 'Mumbai',
    },
    {
      id: 4,
      name: 'Maya Kulkarni',
      role: 'Apartment Admin',
      quote: 'Monthly billing and user-level subscription visibility helped us reduce manual calls and confusion.',
      rating: 5,
      city: 'Nashik',
    },
    {
      id: 5,
      name: 'Daily Bite Cafe',
      role: 'Cafe Owner',
      quote: 'The dashboard gives clear order status and reliable refill timing. Team operations are now much smoother.',
      rating: 4,
      city: 'Bengaluru',
    },
    {
      id: 6,
      name: 'Neha Agarwal',
      role: 'Home User',
      quote: 'Simple product listing, easy cart handling, and payment tracking make this app really practical.',
      rating: 5,
      city: 'Indore',
    },
  ];

  const reviewSlides = [];
  for (let index = 0; index < reviews.length; index += 2) {
    reviewSlides.push(reviews.slice(index, index + 2));
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % reviewSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviewSlides.length]);

  const cartEntries = featuredProducts
    .map((item) => ({ ...item, qty: miniCart[item.id] || 0 }))
    .filter((item) => item.qty > 0);

  const cartItemsCount = cartEntries.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartEntries.reduce((sum, item) => sum + (item.priceValue * item.qty), 0);

  const goNextSlide = () => {
    if (featuredSlides.length <= 1) return;
    setFeaturedIndex((prev) => (prev + 1) % featuredSlides.length);
  };

  const goPrevSlide = () => {
    if (featuredSlides.length <= 1) return;
    setFeaturedIndex((prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length);
  };

  const changeCartQty = (productId, delta) => {
    setMiniCart((prev) => {
      const nextQty = Math.max((prev[productId] || 0) + delta, 0);
      const next = { ...prev };
      if (nextQty === 0) {
        delete next[productId];
      } else {
        next[productId] = nextQty;
      }
      return next;
    });
  };

  const handleMiniCartCheckout = () => {
    if (cartEntries.length === 0) {
      setAuthNotice('Add at least one product to proceed with checkout.');
      openModal('login');
      return;
    }
    const checkoutItems = cartEntries.map((item) => ({
      product_id: item.id,
      name: item.title,
      qty: item.qty,
      priceValue: item.priceValue,
    }));
    window.localStorage.setItem('mm_pending_checkout_cart', JSON.stringify(checkoutItems));
    setAuthNotice('Please login or sign up to continue checkout. After authentication, you will be redirected to your dashboard.');
    openModal('login');
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      <div className="landing-bg-shape one" />
      <div className="landing-bg-shape two" />

      <header className="landing-navbar">
        <div className="brand-wrap">
          <div className="brand-logo" aria-label="MilkMan">
            <svg className="brand-logo-svg" viewBox="0 0 24 24" role="img" aria-hidden="true">
              <defs>
                <linearGradient id="mmMark" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="55%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
              <path
                d="M12 2.1c-2.1 2.4-6.8 7-6.8 11.2 0 4.3 3.5 7.7 7.8 7.7s7.8-3.4 7.8-7.7c0-4.2-4.7-8.8-6.8-11.2-.4-.5-1.2-.5-1.6 0z"
                fill="url(#mmMark)"
              />
              <path
                d="M7.2 14.1c1.2 1.2 3.1 1.9 4.8 1.9 1.6 0 3.4-.6 4.6-1.8"
                fill="none"
                stroke="rgba(255,255,255,0.92)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M8.6 10.8c1.1.5 2.2.7 3.4.7 1.1 0 2.3-.2 3.4-.7"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="brand-logo-text" aria-hidden="true">MM</span>
          </div>
          <div>
            <h1>MilkMan</h1>
            <p>Smart subscription and product operations</p>
          </div>
        </div>
        <nav className="landing-nav-links">
          <a href="#why">Why MilkMan</a>
          <a href="#products">Products</a>
          <a href="#delivery">Delivery</a>
          <a href="#footer">Support</a>
        </nav>
        <div className="nav-right">
          <span className="nav-helper">New here? Start with Products.</span>
          <button type="button" className="nav-login-btn" onClick={() => openModal('login')}>
            <FaSignInAlt />
            <span>Login</span>
          </button>
        </div>
      </header>

      <section className="hero-block" id="why">
        <div className="hero-copy">
          <div className="pill">Built for Milk Distribution Teams</div>
          <h2>Run subscriptions, deliveries, payments, and customer growth from one dashboard.</h2>
          <p>
            MilkMan helps you handle daily operations with fewer clicks, faster tracking,
            and a cleaner flow for your admins and users.
          </p>
          <div className="hero-actions">
            <button type="button" onClick={() => openModal('login')}>Start in 10 seconds</button>
            <button type="button" className="secondary-cta" onClick={() => openModal('signup')}>Create account</button>
          </div>
        </div>

        <div className="hero-panel">
          <div className="landing-stat-card">
            <span>Active Subscriptions</span>
            <strong>2,450+</strong>
          </div>
          <div className="feature-list">
            <div>
              <FaChartLine />
              <span>Revenue & renewal visibility</span>
            </div>
            <div>
              <FaTruck />
              <span>Order and cart flow with less friction</span>
            </div>
            <div>
              <FaShieldAlt />
              <span>Role-based access for admin and users</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section featured-section" id="products">
        <div className="section-head">
          <h3>Featured Products</h3>
          <p>Popular dairy items customers order every day. Swipe through and add quickly to a mini cart.</p>
        </div>
        <div className="featured-layout">
          <div className="product-slider-wrap">
            <div className="slider-controls">
              <button type="button" aria-label="Previous product" onClick={goPrevSlide}>
                <FaChevronLeft />
              </button>
              <div className="slider-dots">
                {featuredSlides.map((_, index) => (
                  <button
                    key={`slide-${index}`}
                    type="button"
                    className={featuredIndex === index ? 'active' : ''}
                    aria-label={`Go to featured slide ${index + 1}`}
                    onClick={() => setFeaturedIndex(index)}
                  />
                ))}
              </div>
              <button type="button" aria-label="Next product" onClick={goNextSlide}>
                <FaChevronRight />
              </button>
            </div>

            <div className="slider-viewport">
              <div className="slider-track" style={{ transform: `translateX(-${featuredIndex * 100}%)` }}>
                {featuredSlides.map((slide, slideIndex) => (
                  <div key={`featured-slide-${slideIndex}`} className="slider-page">
                    <div className="featured-slide-grid">
                      {slide.map((item) => (
                        <article key={item.id} className="landing-card slider-card">
                          <div className="swiggy-card-top">
                            <div className="swiggy-thumb">
                              <span>{item.icon}</span>
                              <em>Featured</em>
                            </div>
                          </div>
                          <div className="swiggy-card-body">
                            <h4>{item.title}</h4>
                            <p>{item.detail}</p>
                            <div className="swiggy-meta-row">
                              <div className="swiggy-admin">
                                <strong>{item.adminName}</strong>
                                <small>{item.location}</small>
                              </div>
                              <span className="swiggy-location-chip">{item.location}</span>
                            </div>
                            <strong>{item.price}</strong>
                          </div>
                          <div className="slider-card-actions">
                            <button type="button" onClick={() => changeCartQty(item.id, 1)}>
                              Add to cart
                            </button>
                            <button
                              type="button"
                              className="subscribe-cta"
                              onClick={() => {
                                setAuthNotice('Subscribe after login to set up daily dairy delivery plans.');
                                openModal('signup');
                              }}
                            >
                              Subscribe
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="mini-cart">
            <div className="mini-cart-head">
              <h4><FaShoppingCart /> Mini Cart</h4>
              <span>{cartItemsCount} items</span>
            </div>

            {cartEntries.length === 0 ? (
              <p className="mini-empty">No products yet. Add from slider.</p>
            ) : (
              <div className="mini-cart-list">
                {cartEntries.map((item) => (
                  <div key={item.id} className="mini-cart-row">
                    <div>
                      <strong>{item.title}</strong>
                      <small>INR {item.priceValue} each</small>
                    </div>
                    <div className="qty-controls">
                      <button type="button" onClick={() => changeCartQty(item.id, -1)}><FaMinus /></button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => changeCartQty(item.id, 1)}><FaPlus /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mini-total">Total: INR {cartTotal}</div>
            <button type="button" className="mini-checkout-btn" onClick={handleMiniCartCheckout}>
              Checkout
            </button>
          </aside>
        </div>
      </section>

      <section className="landing-section" id="delivery">
        <div className="section-head">
          <h3>Delivery Options</h3>
          <p>Choose a route deck that fits customer habits and keeps operations predictable.</p>
        </div>
        <div className="delivery-experience">
          <div className="delivery-grid">
            {deliveryOptions.map((option, index) => (
              <article key={option.id} className="delivery-card">
                <div className="delivery-row">
                  <div className="route-step">{index + 1}</div>
                  <span className="delivery-badge"><FaClock /> {option.timing}</span>
                  <span className="delivery-map"><FaMapMarkedAlt /></span>
                </div>
                <h4>{option.title}</h4>
                <p>{option.description}</p>
                <div className="delivery-meta">
                  <span>{option.coverage}</span>
                  <span>{option.bestFor}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="reviews-inline-head">
          <h4>Quick Reviews</h4>
          <p>Real feedback from daily users and delivery partners.</p>
          <div className="review-slider-nav">
            <button type="button" aria-label="Previous review" onClick={() => setReviewIndex((prev) => (prev - 1 + reviewSlides.length) % reviewSlides.length)}>
              <FaChevronLeft />
            </button>
            <div className="review-slider-dots">
              {reviewSlides.map((slide, index) => (
                <button
                  key={`review-slide-${index}`}
                  type="button"
                  className={reviewIndex === index ? 'active' : ''}
                  onClick={() => setReviewIndex(index)}
                  aria-label={`Go to review set ${index + 1}`}
                />
              ))}
            </div>
            <button type="button" aria-label="Next review" onClick={() => setReviewIndex((prev) => (prev + 1) % reviewSlides.length)}>
              <FaChevronRight />
            </button>
          </div>
        </div>
        <div className="reviews-inline-slider">
          <div className="reviews-inline-track" style={{ transform: `translateX(-${reviewIndex * 100}%)` }}>
            {reviewSlides.map((slide, slideIndex) => (
              <div key={`slide-${slideIndex}`} className="review-inline-slide">
                <div className="review-pair-grid">
                  {slide.map((review) => (
                    <article key={review.id} className="review-inline-card">
                      <div className="review-inline-top">
                        <div className="review-avatar">{review.name.charAt(0)}</div>
                        <div>
                          <strong>{review.name}</strong>
                          <span>{review.role}{'\u2022'} {review.city}</span>
                        </div>
                      </div>
                      <div className="review-rating" aria-label={`${review.rating} star rating`}>
                        {'\u2605'.repeat(review.rating)}{'\u2606'.repeat(5 - review.rating)}
                      </div>
                      <FaQuoteLeft className="quote-icon" />
                      <p>"{review.quote}"</p>
                      <div className="review-user">
                        <span>Verified MilkMan user</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer-premium" id="footer">
        <div className="footer-top">
          <div className="footer-brand-block">
            <div className="brand-logo">MM</div>
            <div>
              <h4>MilkMan</h4>
              <p>Built for modern dairy subscriptions, cleaner logistics, and customer-first operations.</p>
            </div>
          </div>
          <div className="footer-cta">
            <button type="button" onClick={() => openModal('login')}>Login</button>
            <button type="button" className="secondary" onClick={() => openModal('signup')}>Create Account</button>
          </div>
        </div>

        <div className="footer-grid">
          <div className="footer-col">
            <h5>Platform</h5>
            <a href="#!">Subscriptions</a>
            <a href="#!">Product Ops</a>
            <a href="#!">Payment Tracking</a>
            <a href="#!">Delivery Planning</a>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <a href="#!">About MilkMan</a>
            <a href="#!">Support</a>
            <a href="#!">Privacy</a>
            <a href="#!">Terms</a>
          </div>
          <div className="footer-col">
            <h5>Contact</h5>
            <div className="footer-contact"><FaPhoneAlt /> <span>+91 90000 00000</span></div>
            <div className="footer-contact"><FaEnvelope /> <span>hello@milkman.app</span></div>
            <div className="footer-socials">
              <a href="#!" aria-label="Instagram"><FaInstagram /></a>
              <a href="#!" aria-label="LinkedIn"><FaLinkedinIn /></a>
              <a href="#!" aria-label="Facebook"><FaFacebookF /></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} MilkMan. All rights reserved.</span>
          <span>Made for smooth milk delivery operations.</span>
        </div>
      </footer>

      {showScrollTop && (
        <button
          type="button"
          className={`scroll-top-btn ${scrollActive ? 'show' : 'idle'}`}
          onClick={handleScrollTop}
          aria-label="Scroll to top"
        >
          <FaArrowUp />
        </button>
      )}

      {showLoginModal && (
        <div className="login-modal-overlay" onClick={closeModal}>
          <div className="login-modal-shell" onClick={(event) => event.stopPropagation()}>
            <AuthPage
              onLogin={onLogin}
              onSignup={handleSignup}
              isModal
              onClose={closeModal}
              initialTab={modalTab}
              notice={authNotice}
            />
          </div>
        </div>
      )}

      {centerPopup.open && (
        <div className="center-popup-overlay" role="dialog" aria-modal="true" onClick={() => setCenterPopup({ open: false, message: '' })}>
          <div className="center-popup-card" onClick={(event) => event.stopPropagation()}>
            <h3>Application submitted</h3>
            <p>{centerPopup.message}</p>
            <div className="center-popup-actions">
              <button type="button" onClick={() => setCenterPopup({ open: false, message: '' })}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;

