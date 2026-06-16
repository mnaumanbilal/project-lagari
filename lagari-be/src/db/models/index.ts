import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config/database";

// --- Category ---
export interface CategoryAttributes {
  id: string;
  slug: string;
  name: string;
}
export class Category extends Model<CategoryAttributes> implements CategoryAttributes {
  declare id: string;
  declare slug: string;
  declare name: string;
}
Category.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: "categories", underscored: true },
);

// --- NoteTag ---
export interface NoteTagAttributes {
  id: string;
  slug: string;
  name: string;
}
export class NoteTag extends Model<NoteTagAttributes> implements NoteTagAttributes {
  declare id: string;
  declare slug: string;
  declare name: string;
}
NoteTag.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
  },
  { sequelize, tableName: "note_tags", underscored: true },
);

// --- Product ---
export type ScentProfile = "light" | "dark";
export interface ProductAttributes {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  designerInspiration: string | null;
  scentProfile: ScentProfile | null;
  topNotes: string | null;
  heartNotes: string | null;
  baseNotes: string | null;
  catalogType: string;
  isPublished: boolean;
  deletedAt: Date | null;
}
type ProductCreation = Optional<ProductAttributes, "id" | "description" | "designerInspiration" | "scentProfile" | "topNotes" | "heartNotes" | "baseNotes" | "deletedAt">;

export class Product extends Model<ProductAttributes, ProductCreation> implements ProductAttributes {
  declare id: string;
  declare readonly createdAt: Date;
  declare slug: string;
  declare title: string;
  declare description: string | null;
  declare designerInspiration: string | null;
  declare scentProfile: ScentProfile | null;
  declare topNotes: string | null;
  declare heartNotes: string | null;
  declare baseNotes: string | null;
  declare catalogType: string;
  declare isPublished: boolean;
  declare deletedAt: Date | null;
}
Product.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    designerInspiration: { type: DataTypes.STRING, allowNull: true, field: "designer_inspiration" },
    scentProfile: { type: DataTypes.ENUM("light", "dark"), allowNull: true, field: "scent_profile" },
    topNotes: { type: DataTypes.TEXT, allowNull: true, field: "top_notes" },
    heartNotes: { type: DataTypes.TEXT, allowNull: true, field: "heart_notes" },
    baseNotes: { type: DataTypes.TEXT, allowNull: true, field: "base_notes" },
    catalogType: { type: DataTypes.STRING, allowNull: false, defaultValue: "fragrance", field: "catalog_type" },
    isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_published" },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
  },
  { sequelize, tableName: "products", underscored: true, paranoid: false },
);

// --- ProductVariant ---
export interface ProductVariantAttributes {
  id: string;
  productId: string;
  sku: string;
  name: string;
  pricePkr: number;
  compareAtPricePkr: number | null;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
}
type VariantCreation = Optional<ProductVariantAttributes, "id" | "compareAtPricePkr">;

export class ProductVariant extends Model<ProductVariantAttributes, VariantCreation> implements ProductVariantAttributes {
  declare id: string;
  declare productId: string;
  declare sku: string;
  declare name: string;
  declare pricePkr: number;
  declare compareAtPricePkr: number | null;
  declare stock: number;
  declare lowStockThreshold: number;
  declare isActive: boolean;
}
ProductVariant.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, field: "product_id" },
    sku: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    pricePkr: { type: DataTypes.INTEGER, allowNull: false, field: "price_pkr" },
    compareAtPricePkr: { type: DataTypes.INTEGER, allowNull: true, field: "compare_at_price_pkr" },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10, field: "low_stock_threshold" },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
  },
  { sequelize, tableName: "product_variants", underscored: true },
);

// --- ProductImage ---
export interface ProductImageAttributes {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
  isHero: boolean;
}
type ImageCreation = Optional<ProductImageAttributes, "id" | "sortOrder" | "isHero">;

export class ProductImage extends Model<ProductImageAttributes, ImageCreation> implements ProductImageAttributes {
  declare id: string;
  declare productId: string;
  declare url: string;
  declare sortOrder: number;
  declare isHero: boolean;
}
ProductImage.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, field: "product_id" },
    url: { type: DataTypes.TEXT, allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "sort_order" },
    isHero: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_hero" },
  },
  { sequelize, tableName: "product_images", underscored: true },
);

// --- Customer ---
export interface CustomerAttributes {
  id: string;
  phone: string;
  fullName: string | null;
  email: string | null;
  rtoCount: number;
}
type CustomerCreation = Optional<CustomerAttributes, "id" | "fullName" | "email" | "rtoCount">;

export class Customer extends Model<CustomerAttributes, CustomerCreation> implements CustomerAttributes {
  declare id: string;
  declare phone: string;
  declare fullName: string | null;
  declare email: string | null;
  declare rtoCount: number;
}
Customer.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    phone: { type: DataTypes.STRING, allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING, allowNull: true, field: "full_name" },
    email: { type: DataTypes.STRING, allowNull: true },
    rtoCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "rto_count" },
  },
  { sequelize, tableName: "customers", underscored: true },
);

// --- AnalyticsVisitor ---
export interface AnalyticsVisitorAttributes {
  id: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
}
type VisitorCreation = Optional<AnalyticsVisitorAttributes, "id">;

export class AnalyticsVisitor
  extends Model<AnalyticsVisitorAttributes, VisitorCreation>
  implements AnalyticsVisitorAttributes
{
  declare id: string;
  declare firstSeenAt: Date;
  declare lastSeenAt: Date;
}
AnalyticsVisitor.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    firstSeenAt: { type: DataTypes.DATE, allowNull: false, field: "first_seen_at" },
    lastSeenAt: { type: DataTypes.DATE, allowNull: false, field: "last_seen_at" },
  },
  { sequelize, tableName: "analytics_visitors", underscored: true },
);

// --- AnalyticsSession ---
export interface AnalyticsSessionAttributes {
  id: string;
  visitorId: string | null;
  startedAt: Date;
  lastActivityAt: Date;
  endedAt: Date | null;
  userAgent: string | null;
  referrer: string | null;
}
type SessionCreation = Optional<
  AnalyticsSessionAttributes,
  "id" | "visitorId" | "endedAt" | "userAgent" | "referrer"
>;

export class AnalyticsSession extends Model<AnalyticsSessionAttributes, SessionCreation> implements AnalyticsSessionAttributes {
  declare id: string;
  declare visitorId: string | null;
  declare startedAt: Date;
  declare lastActivityAt: Date;
  declare endedAt: Date | null;
  declare userAgent: string | null;
  declare referrer: string | null;
}
AnalyticsSession.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    visitorId: { type: DataTypes.UUID, allowNull: true, field: "visitor_id" },
    startedAt: { type: DataTypes.DATE, allowNull: false, field: "started_at" },
    lastActivityAt: { type: DataTypes.DATE, allowNull: false, field: "last_activity_at" },
    endedAt: { type: DataTypes.DATE, allowNull: true, field: "ended_at" },
    userAgent: { type: DataTypes.TEXT, allowNull: true, field: "user_agent" },
    referrer: { type: DataTypes.TEXT, allowNull: true },
  },
  { sequelize, tableName: "analytics_sessions", underscored: true },
);

// --- AnalyticsEventFingerprint ---
export interface AnalyticsEventFingerprintAttributes {
  id: string;
  sessionId: string;
  visitorId: string | null;
  eventName: string;
  dedupKey: string;
  bucketDate: string;
}
type FingerprintCreation = Optional<
  AnalyticsEventFingerprintAttributes,
  "id" | "visitorId"
>;

export class AnalyticsEventFingerprint
  extends Model<AnalyticsEventFingerprintAttributes, FingerprintCreation>
  implements AnalyticsEventFingerprintAttributes
{
  declare id: string;
  declare sessionId: string;
  declare visitorId: string | null;
  declare eventName: string;
  declare dedupKey: string;
  declare bucketDate: string;
}
AnalyticsEventFingerprint.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionId: { type: DataTypes.UUID, allowNull: false, field: "session_id" },
    visitorId: { type: DataTypes.UUID, allowNull: true, field: "visitor_id" },
    eventName: { type: DataTypes.STRING(64), allowNull: false, field: "event_name" },
    dedupKey: { type: DataTypes.STRING(255), allowNull: false, field: "dedup_key" },
    bucketDate: { type: DataTypes.DATEONLY, allowNull: false, field: "bucket_date" },
  },
  { sequelize, tableName: "analytics_event_fingerprints", underscored: true, updatedAt: false },
);

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "rto"
  | "cancelled";

// --- Order ---
export interface OrderAttributes {
  id: string;
  orderNumber: number;
  customerId: string;
  sessionId: string | null;
  status: OrderStatus;
  subtotalPkr: number;
  discountPkr: number;
  totalPkr: number;
  shippingCity: string;
  shippingAddress: string;
  notes: string | null;
  courierName: string | null;
  trackingNumber: string | null;
  adminNotes: string | null;
  cancelReason: string | null;
  archivedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
type OrderCreation = Optional<
  OrderAttributes,
  "id" | "orderNumber" | "sessionId" | "discountPkr" | "notes" | "courierName" | "trackingNumber" | "adminNotes" | "cancelReason" | "archivedAt"
>;

export class Order extends Model<OrderAttributes, OrderCreation> implements OrderAttributes {
  declare id: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare orderNumber: number;
  declare customerId: string;
  declare sessionId: string | null;
  declare status: OrderStatus;
  declare subtotalPkr: number;
  declare discountPkr: number;
  declare totalPkr: number;
  declare shippingCity: string;
  declare shippingAddress: string;
  declare notes: string | null;
  declare courierName: string | null;
  declare trackingNumber: string | null;
  declare adminNotes: string | null;
  declare cancelReason: string | null;
  declare archivedAt: Date | null;
}
Order.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderNumber: { type: DataTypes.INTEGER, autoIncrement: true, unique: true, field: "order_number" },
    customerId: { type: DataTypes.UUID, allowNull: false, field: "customer_id" },
    sessionId: { type: DataTypes.UUID, allowNull: true, field: "session_id" },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "rto",
        "cancelled",
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    subtotalPkr: { type: DataTypes.INTEGER, allowNull: false, field: "subtotal_pkr" },
    discountPkr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "discount_pkr" },
    totalPkr: { type: DataTypes.INTEGER, allowNull: false, field: "total_pkr" },
    shippingCity: { type: DataTypes.STRING, allowNull: false, field: "shipping_city" },
    shippingAddress: { type: DataTypes.TEXT, allowNull: false, field: "shipping_address" },
    notes: { type: DataTypes.TEXT, allowNull: true },
    courierName: { type: DataTypes.STRING, allowNull: true, field: "courier_name" },
    trackingNumber: { type: DataTypes.STRING, allowNull: true, field: "tracking_number" },
    adminNotes: { type: DataTypes.TEXT, allowNull: true, field: "admin_notes" },
    cancelReason: { type: DataTypes.TEXT, allowNull: true, field: "cancel_reason" },
    archivedAt: { type: DataTypes.DATE, allowNull: true, field: "archived_at" },
  },
  { sequelize, tableName: "orders", underscored: true },
);

// --- OrderItem ---
export interface OrderItemAttributes {
  id: string;
  orderId: string;
  variantId: string;
  productTitleSnapshot: string;
  productSlugSnapshot: string | null;
  variantNameSnapshot: string;
  unitPricePkr: number;
  quantity: number;
}
type OrderItemCreation = Optional<OrderItemAttributes, "id" | "productSlugSnapshot">;

export class OrderItem extends Model<OrderItemAttributes, OrderItemCreation> implements OrderItemAttributes {
  declare id: string;
  declare orderId: string;
  declare variantId: string;
  declare productTitleSnapshot: string;
  declare productSlugSnapshot: string | null;
  declare variantNameSnapshot: string;
  declare unitPricePkr: number;
  declare quantity: number;
}
OrderItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false, field: "order_id" },
    variantId: { type: DataTypes.UUID, allowNull: false, field: "variant_id" },
    productTitleSnapshot: { type: DataTypes.STRING, allowNull: false, field: "product_title_snapshot" },
    productSlugSnapshot: { type: DataTypes.STRING, allowNull: true, field: "product_slug_snapshot" },
    variantNameSnapshot: { type: DataTypes.STRING, allowNull: false, field: "variant_name_snapshot" },
    unitPricePkr: { type: DataTypes.INTEGER, allowNull: false, field: "unit_price_pkr" },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "order_items", underscored: true },
);

// --- AdminUser ---
export interface AdminUserAttributes {
  id: string;
  email: string;
  passwordHash: string;
}
type AdminCreation = Optional<AdminUserAttributes, "id">;

export class AdminUser extends Model<AdminUserAttributes, AdminCreation> implements AdminUserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash: string;
}
AdminUser.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false, field: "password_hash" },
  },
  { sequelize, tableName: "admin_users", underscored: true },
);

// --- OrderTimelineEvent ---
export interface OrderTimelineEventAttributes {
  id: string;
  orderId: string;
  actorAdminId: string | null;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  message: string;
}
type TimelineCreation = Optional<OrderTimelineEventAttributes, "id" | "actorAdminId" | "fromStatus" | "toStatus">;

export class OrderTimelineEvent extends Model<OrderTimelineEventAttributes, TimelineCreation> implements OrderTimelineEventAttributes {
  declare id: string;
  declare readonly createdAt: Date;
  declare orderId: string;
  declare actorAdminId: string | null;
  declare eventType: string;
  declare fromStatus: string | null;
  declare toStatus: string | null;
  declare message: string;
}
OrderTimelineEvent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.UUID, allowNull: false, field: "order_id" },
    actorAdminId: { type: DataTypes.UUID, allowNull: true, field: "actor_admin_id" },
    eventType: { type: DataTypes.STRING, allowNull: false, field: "event_type" },
    fromStatus: { type: DataTypes.STRING, allowNull: true, field: "from_status" },
    toStatus: { type: DataTypes.STRING, allowNull: true, field: "to_status" },
    message: { type: DataTypes.TEXT, allowNull: false },
  },
  { sequelize, tableName: "order_timeline_events", underscored: true, updatedAt: true, createdAt: true },
);

// --- AnalyticsEvent ---
export interface AnalyticsEventAttributes {
  id: string;
  sessionId: string;
  eventName: string;
  payload: Record<string, unknown> | null;
}
type EventCreation = Optional<AnalyticsEventAttributes, "id" | "payload">;

export class AnalyticsEvent extends Model<AnalyticsEventAttributes, EventCreation> implements AnalyticsEventAttributes {
  declare id: string;
  declare sessionId: string;
  declare eventName: string;
  declare payload: Record<string, unknown> | null;
}
AnalyticsEvent.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionId: { type: DataTypes.UUID, allowNull: false, field: "session_id" },
    eventName: { type: DataTypes.STRING, allowNull: false, field: "event_name" },
    payload: { type: DataTypes.JSONB, allowNull: true },
  },
  { sequelize, tableName: "analytics_events", underscored: true },
);

// --- ProductReview ---
export type ReviewSource = "customer" | "shopify";

export interface ProductReviewAttributes {
  id: string;
  productId: string;
  /** FK to customers — null for Shopify-imported reviews */
  customerId: string | null;
  authorName: string;
  rating: number;
  body: string;
  source: ReviewSource;
  isPublished: boolean;
  isVerifiedPurchase: boolean;
  sessionId: string | null;
  shopifyLegacyId: string | null;
  /** Normalised phone used at submission time (audit snapshot) */
  contactPhoneNormalized: string | null;
  /** Normalised email used at submission time (audit snapshot) */
  contactEmailNormalized: string | null;
}
type ReviewCreation = Optional<
  ProductReviewAttributes,
  | "id"
  | "source"
  | "isPublished"
  | "isVerifiedPurchase"
  | "sessionId"
  | "shopifyLegacyId"
  | "customerId"
  | "contactPhoneNormalized"
  | "contactEmailNormalized"
>;

export class ProductReview
  extends Model<ProductReviewAttributes, ReviewCreation>
  implements ProductReviewAttributes
{
  declare id: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare productId: string;
  declare customerId: string | null;
  declare authorName: string;
  declare rating: number;
  declare body: string;
  declare source: ReviewSource;
  declare isPublished: boolean;
  declare isVerifiedPurchase: boolean;
  declare sessionId: string | null;
  declare shopifyLegacyId: string | null;
  declare contactPhoneNormalized: string | null;
  declare contactEmailNormalized: string | null;
}
ProductReview.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.UUID, allowNull: false, field: "product_id" },
    customerId: { type: DataTypes.UUID, allowNull: true, field: "customer_id" },
    authorName: { type: DataTypes.STRING, allowNull: false, field: "author_name" },
    rating: { type: DataTypes.INTEGER, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    source: {
      type: DataTypes.ENUM("customer", "shopify"),
      allowNull: false,
      defaultValue: "customer",
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_published",
    },
    isVerifiedPurchase: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_verified_purchase",
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "session_id",
    },
    shopifyLegacyId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: "shopify_legacy_id",
    },
    contactPhoneNormalized: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "contact_phone_normalized",
    },
    contactEmailNormalized: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "contact_email_normalized",
    },
  },
  { sequelize, tableName: "product_reviews", underscored: true },
);

// --- AdminNotification ---
export type AdminNotificationType =
  | "order.placed"
  | "order.status_changed"
  | "inventory.low_stock"
  | "product.updated"
  | "review.submitted";

export interface AdminNotificationAttributes {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  linkPath: string | null;
  payload: Record<string, unknown> | null;
  readAt: Date | null;
}
type NotificationCreation = Optional<
  AdminNotificationAttributes,
  "id" | "linkPath" | "payload" | "readAt"
>;

export class AdminNotification
  extends Model<AdminNotificationAttributes, NotificationCreation>
  implements AdminNotificationAttributes
{
  declare id: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare type: AdminNotificationType;
  declare title: string;
  declare body: string;
  declare linkPath: string | null;
  declare payload: Record<string, unknown> | null;
  declare readAt: Date | null;
}
AdminNotification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: { type: DataTypes.STRING(64), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    linkPath: { type: DataTypes.STRING(512), allowNull: true, field: "link_path" },
    payload: { type: DataTypes.JSONB, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true, field: "read_at" },
  },
  { sequelize, tableName: "admin_notifications", underscored: true },
);

// --- CustomerPushSubscription ---
export interface CustomerPushSubscriptionAttributes {
  id: string;
  sessionId: string;
  customerId: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}
type PushSubCreation = Optional<
  CustomerPushSubscriptionAttributes,
  "id" | "customerId" | "userAgent"
>;

export class CustomerPushSubscription
  extends Model<CustomerPushSubscriptionAttributes, PushSubCreation>
  implements CustomerPushSubscriptionAttributes
{
  declare id: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare sessionId: string;
  declare customerId: string | null;
  declare endpoint: string;
  declare p256dh: string;
  declare auth: string;
  declare userAgent: string | null;
}
CustomerPushSubscription.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionId: { type: DataTypes.UUID, allowNull: false, field: "session_id" },
    customerId: { type: DataTypes.UUID, allowNull: true, field: "customer_id" },
    endpoint: { type: DataTypes.TEXT, allowNull: false, unique: true },
    p256dh: { type: DataTypes.TEXT, allowNull: false },
    auth: { type: DataTypes.TEXT, allowNull: false },
    userAgent: { type: DataTypes.STRING(512), allowNull: true, field: "user_agent" },
  },
  { sequelize, tableName: "customer_push_subscriptions", underscored: true },
);

// --- UrlRedirect ---
export class UrlRedirect extends Model {
  declare id: string;
  declare fromPath: string;
  declare toPath: string;
  declare statusCode: number;
}
UrlRedirect.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    fromPath: { type: DataTypes.STRING, allowNull: false, unique: true, field: "from_path" },
    toPath: { type: DataTypes.STRING, allowNull: false, field: "to_path" },
    statusCode: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 301, field: "status_code" },
  },
  { sequelize, tableName: "url_redirects", underscored: true },
);

// --- M:N join tables (no model class — use belongsToMany) ---

Product.belongsToMany(Category, {
  through: "product_categories",
  foreignKey: "product_id",
  otherKey: "category_id",
  as: "categories",
  timestamps: true,
});
Category.belongsToMany(Product, {
  through: "product_categories",
  foreignKey: "category_id",
  otherKey: "product_id",
  as: "products",
  timestamps: true,
});

Product.belongsToMany(NoteTag, {
  through: "product_note_tags",
  foreignKey: "product_id",
  otherKey: "note_tag_id",
  as: "noteTags",
  timestamps: true,
});
NoteTag.belongsToMany(Product, {
  through: "product_note_tags",
  foreignKey: "note_tag_id",
  otherKey: "product_id",
  as: "products",
  timestamps: true,
});

Product.hasMany(ProductVariant, { foreignKey: "product_id", as: "variants" });
ProductVariant.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(ProductImage, { foreignKey: "product_id", as: "images" });
ProductImage.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Product.hasMany(ProductReview, { foreignKey: "product_id", as: "reviews" });
ProductReview.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Customer.hasMany(ProductReview, { foreignKey: "customer_id", as: "reviews" });
ProductReview.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

Customer.hasMany(Order, { foreignKey: "customer_id", as: "orders" });
Order.belongsTo(Customer, { foreignKey: "customer_id", as: "customer" });

Customer.hasMany(CustomerPushSubscription, {
  foreignKey: "customer_id",
  as: "pushSubscriptions",
});
CustomerPushSubscription.belongsTo(Customer, {
  foreignKey: "customer_id",
  as: "customer",
});

Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" });

Order.hasMany(OrderTimelineEvent, { foreignKey: "order_id", as: "timeline" });
OrderTimelineEvent.belongsTo(Order, { foreignKey: "order_id", as: "order" });

AnalyticsVisitor.hasMany(AnalyticsSession, { foreignKey: "visitor_id", as: "sessions" });
AnalyticsSession.belongsTo(AnalyticsVisitor, { foreignKey: "visitor_id", as: "visitor" });

AnalyticsSession.hasMany(AnalyticsEvent, { foreignKey: "session_id", as: "events" });
AnalyticsEvent.belongsTo(AnalyticsSession, { foreignKey: "session_id", as: "session" });

AnalyticsSession.hasMany(AnalyticsEventFingerprint, {
  foreignKey: "session_id",
  as: "fingerprints",
});
AnalyticsEventFingerprint.belongsTo(AnalyticsSession, {
  foreignKey: "session_id",
  as: "session",
});

Order.belongsTo(AnalyticsSession, { foreignKey: "session_id", as: "analyticsSession" });

export async function connectDatabase(): Promise<void> {
  await sequelize.authenticate();
}

export const db = {
  sequelize,
  Category,
  NoteTag,
  Product,
  ProductVariant,
  ProductImage,
  Customer,
  AnalyticsSession,
  AnalyticsVisitor,
  AnalyticsEventFingerprint,
  Order,
  OrderItem,
  AdminUser,
  OrderTimelineEvent,
  AnalyticsEvent,
  ProductReview,
  AdminNotification,
  CustomerPushSubscription,
  UrlRedirect,
};
