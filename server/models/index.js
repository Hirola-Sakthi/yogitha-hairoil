export { Product } from "./Product.js";
export { User } from "./User.js";
export { Order } from "./Order.js";
export { Cart } from "./Cart.js";
export { Payment } from "./Payment.js";
export { Refund } from "./Refund.js";
export { Category } from "./Category.js";
export { Review } from "./Review.js";
export { Post } from "./Post.js";
export { Policy } from "./Policy.js";
export { Settings } from "./Settings.js";
export { Lead } from "./Lead.js";
export { Webhook } from "./Webhook.js";
export { Session } from "./Session.js";
export { Reset } from "./Reset.js";
export { Audit } from "./Audit.js";
export { Media } from "./Media.js";
export { RateLimit } from "./RateLimit.js";

import { Audit } from "./Audit.js";
import { Cart } from "./Cart.js";
import { Category } from "./Category.js";
import { Lead } from "./Lead.js";
import { Media } from "./Media.js";
import { Order } from "./Order.js";
import { Payment } from "./Payment.js";
import { Policy } from "./Policy.js";
import { Post } from "./Post.js";
import { Product } from "./Product.js";
import { RateLimit } from "./RateLimit.js";
import { Refund } from "./Refund.js";
import { Reset } from "./Reset.js";
import { Review } from "./Review.js";
import { Session } from "./Session.js";
import { Settings } from "./Settings.js";
import { User } from "./User.js";
import { Webhook } from "./Webhook.js";

const models = {
  audit: Audit,
  carts: Cart,
  categories: Category,
  leads: Lead,
  limits: RateLimit,
  media: Media,
  orders: Order,
  payments: Payment,
  policies: Policy,
  posts: Post,
  products: Product,
  refunds: Refund,
  resets: Reset,
  reviews: Review,
  sessions: Session,
  settings: Settings,
  users: User,
  webhooks: Webhook,
};

export const modelFor = (collection) => models[collection] || null;
