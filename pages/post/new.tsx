import { useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";

interface UploadedImage {
  id: number;
  original_url: string;
  thumbnail_url: string;
  file_size: number;
  width: number;
  height: number;
  mime_type: string;
  uploaded_by: number;
  created_at: string;
}

export default function NewPost() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Redirect if not authenticated
  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL for the selected image
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setPreviewUrl(null);
    const fileInput = document.getElementById(
      "image-input",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let finalImageId: number;

      // If we have a preview but no uploaded image, upload it first
      if (previewUrl && !uploadedImage) {
        const fileInput = document.getElementById(
          "image-input",
        ) as HTMLInputElement;
        const file = fileInput?.files?.[0];

        if (!file) {
          setError("Please select an image first");
          setIsSubmitting(false);
          return;
        }

        // Upload the image
        const formData = new FormData();
        formData.append("image", file);

        const uploadResponse = await fetch("/api/picture/upload", {
          method: "POST",
          body: formData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || "Failed to upload image");
        }

        finalImageId = uploadResult.id;
      } else if (uploadedImage) {
        // Use the already uploaded image
        finalImageId = uploadedImage.id;
      } else {
        setError("Please select an image first");
        setIsSubmitting(false);
        return;
      }

      // Create the post
      const response = await fetch("/api/post/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
          picture_id: finalImageId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      // Redirect to the home page
      router.push("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create New Post - Nolingo</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-6">Create New Post</h1>

            {error && (
              <div className="alert alert-error mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload Section */}
              <div className="form-control">
                <label className="label">Image</label>

                {!uploadedImage ? (
                  <div className="space-y-3">
                    <input
                      id="image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="file-input file-input-bordered file-input-primary w-full"
                      disabled={isSubmitting}
                    />

                    {previewUrl && (
                      <div className="space-y-3">
                        <div className="relative w-full">
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            width={800}
                            height={600}
                            className="w-full h-auto rounded-lg border border-base-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative w-full">
                      <Image
                        src={uploadedImage.original_url}
                        alt="Uploaded image"
                        width={800}
                        height={600}
                        className="w-full h-auto rounded-lg border border-base-300"
                      />
                    </div>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="link link-primary text-sm"
                      >
                        Reset image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Description */}
              <div className="form-control">
                <label className="label">
                  Description
                  <span className="label">{content.length}/256 characters</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32 w-full"
                  placeholder={`Describe what you see in this image in ${session?.user?.learning_language || "your learning language"}...`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={256}
                  required
                />
                <label className="label">
                  <span className="label-text-alt">
                    Describe the image, objects, actions, or scene you see
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="card-actions justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => router.back()}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    isSubmitting ||
                    !content.trim() ||
                    (!previewUrl && !uploadedImage)
                  }
                >
                  {isSubmitting
                    ? "Creating..."
                    : previewUrl && !uploadedImage
                      ? "Upload & Create Post"
                      : "Create Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
