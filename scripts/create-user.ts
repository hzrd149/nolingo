#!/usr/bin/env tsx

import { db } from "../database";
import { users } from "../database/schema";
import { hashPassword } from "../lib/auth";
import { eq } from "drizzle-orm";
import ISO6391 from "iso-639-1";
import readline from "readline";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to get user input
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Helper function to get user input with validation
async function getValidatedInput(
  query: string,
  validator: (input: string) => boolean | string,
  errorMessage: string,
): Promise<string> {
  while (true) {
    const input = await question(query);
    const validation = validator(input);

    if (validation === true) {
      return input;
    }

    if (typeof validation === "string") {
      console.log(`✅ ${validation}`);
      return input;
    }

    console.log(`❌ ${errorMessage}`);
  }
}

// Validation functions
function validateUsername(username: string): boolean | string {
  if (username.length < 3) {
    return false;
  }
  if (username.length > 20) {
    return false;
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return false;
  }
  return true;
}

function validatePassword(password: string): boolean | string {
  if (password.length < 6) {
    return false;
  }
  return true;
}

function validateLanguage(languageCode: string): boolean | string {
  if (ISO6391.validate(languageCode)) {
    return true;
  }
  return false;
}

async function createUserInteractive() {
  console.log("🌟 Welcome to Nolingo User Creation Script! 🌟\n");

  try {
    // Get username
    const username = await getValidatedInput(
      "Enter username (3-20 characters, alphanumeric, underscores, hyphens): ",
      validateUsername,
      "Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens.",
    );

    // Check if username already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("❌ Username already exists!");
      rl.close();
      return;
    }

    // Get password
    const password = await getValidatedInput(
      "Enter password (minimum 6 characters): ",
      validatePassword,
      "Password must be at least 6 characters long.",
    );

    // Confirm password
    const confirmPassword = await question("Confirm password: ");
    if (password !== confirmPassword) {
      console.log("❌ Passwords do not match!");
      rl.close();
      return;
    }

    // Get display name
    const displayName = await question(
      "Enter display name (optional, press Enter to skip): ",
    );

    // Get about/bio
    const about = await question(
      "Enter bio/description (optional, press Enter to skip): ",
    );

    // Get location
    const location = await question(
      "Enter location (optional, press Enter to skip): ",
    );

    // Get website
    const website = await question(
      "Enter website URL (optional, press Enter to skip): ",
    );

    // Get learning language
    console.log("\n🌍 Available Languages:");
    const popularLanguages = [
      { code: "en", name: "English" },
      { code: "es", name: "Spanish" },
      { code: "fr", name: "French" },
      { code: "de", name: "German" },
      { code: "it", name: "Italian" },
      { code: "pt", name: "Portuguese" },
      { code: "ru", name: "Russian" },
      { code: "ja", name: "Japanese" },
      { code: "ko", name: "Korean" },
      { code: "zh", name: "Chinese" },
      { code: "ar", name: "Arabic" },
      { code: "hi", name: "Hindi" },
      { code: "nl", name: "Dutch" },
      { code: "sv", name: "Swedish" },
      { code: "no", name: "Norwegian" },
      { code: "da", name: "Danish" },
      { code: "fi", name: "Finnish" },
      { code: "pl", name: "Polish" },
      { code: "tr", name: "Turkish" },
      { code: "he", name: "Hebrew" },
    ];

    popularLanguages.forEach((lang, index) => {
      console.log(
        `${(index + 1).toString().padStart(2)}. ${lang.code.toUpperCase()} - ${lang.name}`,
      );
    });

    console.log("   ... or enter a custom ISO 639-1 language code");

    const learningLanguage = await getValidatedInput(
      "\nEnter learning language code (e.g., en, es, fr) or number from list: ",
      (input) => {
        // Check if it's a number from the list
        const num = parseInt(input);
        if (num >= 1 && num <= popularLanguages.length) {
          return popularLanguages[num - 1].code;
        }
        // Check if it's a valid language code
        if (ISO6391.validate(input)) {
          return true;
        }
        return false;
      },
      "Please enter a valid language code or number from the list.",
    );

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const newUser = await db.insert(users).values({
      username,
      password: hashedPassword,
      display_name: displayName || undefined,
      about: about || undefined,
      location: location || undefined,
      website: website || undefined,
      learning_language: learningLanguage,
    });

    console.log("\n🎉 User created successfully! 🎉");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Username: ${username}`);
    console.log(`Display Name: ${displayName || "Not set"}`);
    console.log(
      `Learning Language: ${ISO6391.getName(learningLanguage)} (${learningLanguage.toUpperCase()})`,
    );
    console.log(`Location: ${location || "Not set"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nYou can now log in with this user account!");
  } catch (error) {
    console.error("❌ Error creating user:", error);
  } finally {
    rl.close();
  }
}

// Run the script
createUserInteractive();
