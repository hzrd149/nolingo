import {
  int,
  sqliteTable,
  text,
  index,
  integer,
} from "drizzle-orm/sqlite-core";

export const pictures = sqliteTable(
  "pictures",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    original_url: text("original_url").notNull(), // Full resolution image URL
    thumbnail_url: text("thumbnail_url").notNull(), // Thumbnail image URL
    file_size: int("file_size"), // File size in bytes
    width: int("width"), // Image width in pixels
    height: int("height"), // Image height in pixels
    mime_type: text("mime_type"), // Image MIME type (e.g., image/jpeg)
    uploaded_by: int("uploaded_by").notNull(), // User who uploaded the image (will reference users.id)
    created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    index("pictures_uploaded_by_idx").on(table.uploaded_by),
    index("pictures_mime_type_idx").on(table.mime_type),
  ],
);

export const users = sqliteTable(
  "users",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    password: text("password").notNull(), // Hashed password
    about: text("about"), // Bio/description
    picture_id: int("picture_id").references(() => pictures.id), // Profile picture reference
    custom_css: text("custom_css"), // User's custom CSS
    display_name: text("display_name"), // Full name for display
    location: text("location"), // User's location
    website: text("website"), // Personal website URL
    learning_language: text("learning_language"), // Language the user is trying to learn (ISO 639-1 code)
    last_login: text("last_login"), // ISO string timestamp
    is_admin: integer("is_admin").notNull().default(0), // 0 = regular user, 1 = admin
    created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    index("users_username_idx").on(table.username),
    index("users_learning_language_idx").on(table.learning_language),
  ],
);

export const posts = sqliteTable(
  "posts",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    author: int("author")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(), // Short post content (256 char limit enforced in app)
    picture_id: int("picture_id")
      .notNull()
      .references(() => pictures.id), // Required image reference
    language: text("language").notNull(), // ISO 639-1 language code (e.g., 'en', 'es', 'fr')
    created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    index("posts_author_idx").on(table.author),
    index("posts_language_idx").on(table.language),
    index("posts_created_at_idx").on(table.created_at),
  ],
);

export const translations = sqliteTable(
  "translations",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    post_id: int("post_id")
      .notNull()
      .references(() => posts.id),
    language: text("language").notNull(), // Target language for translation
    content: text("content").notNull(), // Translated post content
  },
  (table) => [
    index("translations_post_id_idx").on(table.post_id),
    index("translations_language_idx").on(table.language),
  ],
);

export const replies = sqliteTable(
  "replies",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    post_id: int("post_id")
      .notNull()
      .references(() => posts.id),
    author: int("author")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(), // Reply content (256 char limit enforced in app)
    language: text("language").notNull(), // ISO 639-1 language code
    created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    index("replies_post_id_idx").on(table.post_id),
    index("replies_author_idx").on(table.author),
    index("replies_created_at_idx").on(table.created_at),
  ],
);

export const replyTranslations = sqliteTable(
  "reply_translations",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    reply_id: int("reply_id")
      .notNull()
      .references(() => replies.id),
    language: text("language").notNull(), // Target language for translation
    content: text("content").notNull(), // Translated reply content
  },
  (table) => [
    index("reply_translations_reply_id_idx").on(table.reply_id),
    index("reply_translations_language_idx").on(table.language),
  ],
);

export const vapidKeys = sqliteTable("vapid_keys", {
  id: int("id").primaryKey({ autoIncrement: true }),
  public_key: text("public_key").notNull().unique(), // VAPID public key
  private_key: text("private_key").notNull().unique(), // VAPID private key
  email: text("email").notNull(), // Contact email for VAPID
  created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    user_id: int("user_id")
      .notNull()
      .references(() => users.id),
    endpoint: text("endpoint").notNull(), // Push service endpoint URL
    p256dh_key: text("p256dh_key").notNull(), // User's public key for encryption
    auth_key: text("auth_key").notNull(), // Authentication secret
    user_agent: text("user_agent"), // Browser/device info for debugging
    created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    index("push_subscriptions_user_id_idx").on(table.user_id),
    index("push_subscriptions_endpoint_idx").on(table.endpoint),
  ],
);

export const notificationPreferences = sqliteTable(
  "notification_preferences",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    user_id: int("user_id")
      .notNull()
      .references(() => users.id)
      .unique(), // One preference record per user
    new_posts: integer("new_posts").notNull().default(1), // 0 = disabled, 1 = enabled
    post_replies: integer("post_replies").notNull().default(1), // 0 = disabled, 1 = enabled
    mentions: integer("mentions").notNull().default(1), // 0 = disabled, 1 = enabled
    created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => [index("notification_preferences_user_id_idx").on(table.user_id)],
);
