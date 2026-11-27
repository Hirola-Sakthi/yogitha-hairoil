import "./home-faq.css";

const homeFaqs = [
  {
    question: "What are the common reasons for hair fall?",
    answer:
      "Hair fall can have several causes, including stress, nutritional deficiencies, hormonal changes, thyroid disorders, genetics, scalp conditions, and hair-care habits.",
  },
  {
    question: "Is it normal to lose hair every day?",
    answer:
      "Yes. Shedding around 50–100 hairs a day is generally considered part of the natural hair growth cycle.",
  },
  {
    question: "What are the four stages of the hair growth cycle?",
    answer:
      "The four stages are Anagen (growth), Catagen (transition), Telogen (rest), and Exogen (shedding).",
  },
  {
    question: "Does dandruff cause hair fall?",
    answer:
      "Dandruff usually doesn’t cause permanent hair loss. Scalp irritation and frequent scratching can contribute to temporary shedding or hair breakage.",
  },
  {
    question: "Can vitamin D deficiency cause hair fall?",
    answer:
      "Low vitamin D levels have been linked to some types of hair loss. Hair fall can have many different causes.",
  },
  {
    question: "Can hormonal changes affect hair growth?",
    answer:
      "Yes. Thyroid disorders, PCOS, pregnancy, postpartum changes, and menopause can affect the hair growth cycle.",
  },
  {
    question: "What is Ayurvedic hair oil?",
    answer:
      "Ayurvedic hair oil is traditionally prepared using oils and herbs selected according to Ayurvedic principles for hair and scalp care.",
  },
];

const aboutFaqs = [
  {
    question: "What is Prakriti, and why is it important?",
    answer:
      "Prakriti is an individual’s natural body constitution. Ayurveda describes it through Vata, Pitta, and Kapha and considers it when choosing an approach to care.",
  },
  {
    question: "What makes Dr. Yogitha’s Intensive Hair Ampoule different?",
    answer:
      "It follows classical Ayurvedic preparation principles, with monitored temperature and careful ingredient selection. The formulation considers different scalp types and individual Prakriti.",
  },
  {
    question: "What is Sneha Paka?",
    answer:
      "Sneha Paka is a traditional Ayurvedic method of preparing oils or ghee. Depending on the formulation, it can use herbal pastes, decoctions, or fresh juices.",
  },
  {
    question: "Are natural and herbal products safe for everyone?",
    answer:
      "Natural ingredients can cause irritation or allergic reactions. Check the ingredient list and follow the product’s patch-test instructions.",
  },
  {
    question: "How often should I apply hair oil?",
    answer:
      "For a dry scalp, 2–3 times a week may help. For a normal scalp, 1–2 times a week may be enough. For an oily scalp, use a small amount once a week or as needed.",
  },
  {
    question: "How long should I leave the oil on before washing?",
    answer:
      "Leave the oil on your scalp and hair for about 45 minutes before washing.",
  },
  {
    question: "How long should I massage my scalp?",
    answer:
      "Gently massage your scalp with your fingertips for about four minutes. You can make this part of your daily scalp-care routine.",
  },
];

export default function HomeFaq({ variant = "home" }) {
  const faqs = variant === "about" ? aboutFaqs : homeFaqs;
  const title =
    variant === "about"
      ? "About the Intensive Hair Ampoule"
      : "Frequently Asked Questions";
  const intro =
    variant === "about"
      ? "Learn how we make the ampoule, what Prakriti means, and how to use it."
      : "Find answers to common questions about hair fall, scalp care, and Ayurvedic hair oil.";

  return (
    <section className="home-faq-section" aria-labelledby="home-faq-title">
      <div className="home-faq-layout">
        <div className="home-faq-intro">
          <p className="eyebrow">HERE TO HELP</p>
          <h2 id="home-faq-title">{title}</h2>
          <p>{intro}</p>
        </div>
        <div className="home-faq-list" aria-label="Frequently asked questions">
          {faqs.map((faq, index) => (
            <details key={`${faq.question}-${index}`} className="home-faq-item">
              <summary>
                <span>{faq.question}</span>
                <span className="home-faq-toggle" aria-hidden="true" />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
