import { int, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const pictures = sqliteTable(
  "pictures",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    original_url: text("original_url").notNull(), // Full resolution image URL
    thumbnail_url: text("thumbnail_url").notNull(), // Thumbnail image URL
    alt_text: text("alt_text"), // Accessibility description
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
    theme: text("theme"), // The name of a built-in DaisyUI theme
    custom_css: text("custom_css"), // User's custom CSS
    display_name: text("display_name"), // Full name for display
    location: text("location"), // User's location
    website: text("website"), // Personal website URL
    learning_language: text("learning_language"), // Language the user is trying to learn (ISO 639-1 code)
    last_login: text("last_login"), // ISO string timestamp
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
    translated_content: text("translated_content").notNull(), // Translated post content
    translator_id: int("translator_id").references(() => users.id), // User who provided translation (optional)
    is_verified: int("is_verified").notNull().default(0), // 0 = unverified, 1 = verified
    created_at: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
    updated_at: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    index("translations_post_id_idx").on(table.post_id),
    index("translations_language_idx").on(table.language),
    index("translations_translator_idx").on(table.translator_id),
    index("translations_verified_idx").on(table.is_verified),
  ],
);
