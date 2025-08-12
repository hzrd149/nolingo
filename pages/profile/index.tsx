import { useSessionData } from "@/lib/hooks/useSessionData";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { profile, isLoading, error } = useUserProfile();
  const { displayName, learningLanguage } = useSessionData();

  if (status === "loading" || isLoading) {
    return (
      <div className="hero min-h-[calc(100vh-2rem)] bg-base-100">
        <div className="hero-content text-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-base-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-base-content/70">
            View and manage your profile information.
          </p>
        </div>

        {error && (
          <div className="alert alert-error mb-6">
            <span>Failed to load profile: {error}</span>
          </div>
        )}

        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">Basic Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Username</span>
                    </label>
                    <p className="text-base-content/70">{profile.username}</p>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        Display Name
                      </span>
                    </label>
                    <p className="text-base-content/70">
                      {displayName || profile.display_name || "Not set"}
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Location</span>
                    </label>
                    <p className="text-base-content/70">
                      {profile.location || "Not set"}
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Website</span>
                    </label>
                    <p className="text-base-content/70">
                      {profile.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        "Not set"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning & Preferences */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">
                  Learning & Preferences
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        Learning Language
                      </span>
                    </label>
                    <p className="text-base-content/70">
                      {learningLanguage ||
                        profile.learning_language ||
                        "Not set"}
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        Member Since
                      </span>
                    </label>
                    <p className="text-base-content/70">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        Last Updated
                      </span>
                    </label>
                    <p className="text-base-content/70">
                      {new Date(profile.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            {profile.about && (
              <div className="card bg-base-200 shadow-xl lg:col-span-2">
                <div className="card-body">
                  <h2 className="card-title text-2xl mb-4">About</h2>
                  <p className="text-base-content/70 whitespace-pre-wrap">
                    {profile.about}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
