import { useStore } from "./StoreContext";
import "./home-faq.css";

const defaultFaqs = [
  {
    question: "What sizes are available?",
    answer: "The hair oil is available in 50 ml and 100 ml sizes. Select a size on the product section to see its current price and availability.",
  },
  {
    question: "How should I use the hair oil?",
    answer: "Please follow the directions printed on the product packaging for guidance on how to use it.",
  },
  {
    question: "Where can I check the price and availability?",
    answer: "Select a size in the product section to see its current price and stock status.",
  },
  {
    question: "How do I place an order?",
    answer: "Choose your preferred size and quantity, add the product to your bag, then continue to checkout.",
  },
  {
    question: "Can I order more than one bottle?",
    answer: "Yes. Use the quantity selector in the product section. The available quantity is limited by current stock.",
  },
  {
    question: "How do I choose a size?",
    answer: "Compare the 50 ml and 100 ml options in the product section and choose the one that suits your needs.",
  },
  {
    question: "Where can I find product details?",
    answer: "See the product description on this page and check the packaging for product-specific information and directions.",
  },
  {
    question: "Where can I get help with an order?",
    answer: "Visit our Contact page and send us your question. We’ll be happy to help.",
  },
];

const aboutFaqs = [
  {
    question: "What inspires Dr. Yogitha’s hair oil?",
    answer: "The product is inspired by Ayurvedic traditions and a thoughtful, botanical approach to everyday hair care.",
  },
  {
    question: "What does mindful hair care mean?",
    answer: "It can be as simple as setting aside a little time for your routine and following the directions provided with your product.",
  },
  {
    question: "Where can I learn about the product?",
    answer: "Visit the home page or product page for current sizes, pricing, availability, and product information.",
  },
  {
    question: "How can I place an order?",
    answer: "Choose an available size, add it to your bag, and continue through checkout to enter your delivery details.",
  },
  {
    question: "How can I contact the team?",
    answer: "Visit the Contact page and send us your question. We’ll be happy to help.",
  },
];

export default function HomeFaq({ variant = "home" }) {
  const { data } = useStore();
  const product = data?.products?.find((item) => item.id === "hair-oil") || data?.products?.[0];
  const configuredFaqs = product?.faq || [];
  const faqs = variant === "about" ? aboutFaqs : [
      ...configuredFaqs,
      ...defaultFaqs.filter((fallback) => !configuredFaqs.some((item) => item.question === fallback.question)),
    ].slice(0, 8);
  const title = variant === "about" ? "A little more about our approach" : "Frequently Asked Questions";

  return (
    <section className="home-faq-section" aria-labelledby="home-faq-title">
      <div className="home-faq-layout">
        <div className="home-faq-intro">
          <p className="eyebrow">HERE TO HELP</p>
          <h2 id="home-faq-title">{title}</h2>
          <p>{variant === "about" ? "Learn more about the inspiration behind our hair oil and how to shop with us." : "Find a little more information about our hair oil, available sizes, and getting in touch."}</p>
        </div>
        <div className="home-faq-list" aria-label="Frequently asked questions">
          {faqs.map((faq, index) => (
            <details key={`${faq.question}-${index}`} className="home-faq-item">
              <summary><span>{faq.question}</span><span className="home-faq-toggle" aria-hidden="true" /></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
