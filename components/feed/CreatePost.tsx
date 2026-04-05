"use client";

import { useState, useRef } from "react";

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

interface Props {
  currentUser: CurrentUser;
  onPost: (post: any) => void;
}

interface ImageItem {
  file: File;
  preview: string;
}

function UserAvatar({
  avatar,
  firstName,
  lastName,
}: {
  avatar?: string | null;
  firstName: string;
  lastName: string;
}) {
  return avatar ? (
    <img
      src={avatar}
      alt="Avatar"
      className="_txt_img"
      style={{
        width: '40px',
        height: '40px',
        objectFit: 'cover',
        borderRadius: '50%', // circle
        display: 'block',
        
      }}
    />
  ) : (
    <div
      className="_txt_img"
      style={{
        width: '100%',
        height: '100%',
        background: '#1890FF',
        color: '#fff',
        fontWeight: 700,
        fontSize: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%', // circle
        userSelect: 'none',
      }}
    >
      {firstName[0]}
      {lastName[0]}
    </div>
  );
}

export default function CreatePost({ currentUser, onPost }: Props) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems: ImageItem[] = files.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...newItems]);
    // reset so same files can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

const handleSubmit = async () => {
  if (!content.trim() && images.length === 0) return
  setLoading(true)

  try {
    // Step 1: Upload all images to Cloudinary
    const uploadedUrls: string[] = []
    for (const item of images) {
      const formData = new FormData()
      formData.append("file", item.file)

      // ✅ Cloudinary upload route
      const res = await fetch("/api/uploadcloudinary", {
        method: "POST",
        body: formData,
      })
      console.log(res)

      if (res.ok) {
        const data = await res.json()
        uploadedUrls.push(data.url)
      } else {
        const errorData = await res.json()
        console.error("Image upload failed:", errorData)
      }
    }

    // Step 2: Prepare content
    let finalContent = content.trim() || (images.length > 0 ? "" : "")
    const extraImages = uploadedUrls.slice(1)

    // Step 3: Create post
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: finalContent || (images.length > 0 ? "📷 Shared photos" : ""),
        imageUrl: uploadedUrls[0] || null, // first image
        imageUrls: uploadedUrls,           // all uploaded images
        visibility,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      onPost(data.post)
      setContent("")
      images.forEach((i) => URL.revokeObjectURL(i.preview))
      setImages([])
      setVisibility("public")
    }
  } catch (err) {
    console.error(err)
    alert("Failed to create post.")
  } finally {
    setLoading(false)
  }
}

  /* Grid layout for previews — Facebook style */
  const gridStyle = (): React.CSSProperties => {
    const n = images.length;
    if (n === 1)
      return { gridTemplateColumns: "1fr", gridTemplateRows: "300px" };
    if (n === 2)
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "250px" };
    if (n === 3)
      return {
        gridTemplateColumns: "2fr 1fr",
        gridTemplateRows: "200px 200px",
      };
    if (n === 4)
      return {
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "200px 200px",
      };
    return {
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "160px 160px",
    };
  };

  const cellStyle = (i: number): React.CSSProperties => {
    const n = images.length;
    if (n === 3 && i === 0) return { gridRow: "1 / 3" };
    return {};
  };

  return (
    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
      {/* Textarea row */}
      <div className="_feed_inner_text_area_box">
        <div className="_feed_inner_text_area_box_image">
          <UserAvatar
            avatar={currentUser.avatar}
            firstName={currentUser.firstName}
            lastName={currentUser.lastName}
          />
        </div>
        <div className="form-floating _feed_inner_text_area_box_form">
          <textarea
            className="form-control _textarea"
            placeholder=""
            id="floatingTextarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {!content && (
            <label
              className="_feed_textarea_label relative w-full"
              htmlFor="floatingTextarea"
            >
              <div className="flex items-center gap-2 absolute top-4 left-3 -translate-y-1/2 pointer-events-none">
                <span className="text-gray-500">Write something ...</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="23"
                  height="24"
                  fill="none"
                  viewBox="0 0 23 24"
                  style={{ verticalAlign: "middle" }}
                >
                  <path
                    fill="#666"
                    d="M19.504 19.209c.332 0 .601.289.601.646 0 .326-.226.596-.52.64l-.081.005h-6.276c-.332 0-.602-.289-.602-.645 0-.327.227-.597.52-.64l.082-.006h6.276zM13.4 4.417c1.139-1.223 2.986-1.223 4.125 0l1.182 1.268c1.14 1.223 1.14 3.205 0 4.427L9.82 19.649a2.619 2.619 0 01-1.916.85h-3.64c-.337 0-.61-.298-.6-.66l.09-3.941a3.019 3.019 0 01.794-1.982l8.852-9.5zm-.688 2.562l-7.313 7.85a1.68 1.68 0 00-.441 1.101l-.077 3.278h3.023c.356 0 .698-.133.968-.376l.098-.096 7.35-7.887-3.608-3.87zm3.962-1.65a1.633 1.633 0 00-2.423 0l-.688.737 3.606 3.87.688-.737c.631-.678.666-1.755.105-2.477l-.105-.124-1.183-1.268z"
                  />
                </svg>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Image grid preview */}
      {images.length > 0 && (
        <div style={{ marginTop: 12, marginBottom: 4 }}>
          <div
            style={{
              display: "grid",
              gap: 3,
              borderRadius: 10,
              overflow: "hidden",
              ...gridStyle(),
            }}
          >
            {images.slice(0, 5).map((img, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  ...cellStyle(i),
                }}
              >
                <img
                  src={img.preview}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {/* +N overlay on 5th if more */}
                {i === 4 && images.length > 5 && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 28,
                      fontWeight: 700,
                    }}
                  >
                    +{images.length - 4}
                  </div>
                )}
                <button
                  onClick={() => removeImage(i)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 26,
                    height: 26,
                    cursor: "pointer",
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {/* Add more */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: 6,
              background: "none",
              border: "1px dashed #ccc",
              borderRadius: 8,
              padding: "6px 16px",
              cursor: "pointer",
              fontSize: 13,
              color: "#666",
              width: "100%",
            }}
          >
            + Add more photos
          </button>
        </div>
      )}

      {/* Bottom toolbar */}
      <div className="_feed_inner_text_area_bottom">
        <div className="_feed_inner_text_area_item">
          {/* Photo button */}
          <div className="_feed_inner_text_area_bottom_photo _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill="#666"
                    d="M13.916 0c3.109 0 5.18 2.429 5.18 5.914v8.17c0 3.486-2.072 5.916-5.18 5.916H5.999C2.89 20 .827 17.572.827 14.085v-8.17C.827 2.43 2.897 0 6 0h7.917zm0 1.504H5.999c-2.321 0-3.799 1.735-3.799 4.41v8.17c0 2.68 1.472 4.412 3.799 4.412h7.917c2.328 0 3.807-1.734 3.807-4.411v-8.17c0-2.678-1.478-4.411-3.807-4.411zm.65 8.68l.12.125 1.9 2.147a.803.803 0 01-.016 1.063.642.642 0 01-.894.058l-.076-.074-1.9-2.148a.806.806 0 00-1.205-.028l-.074.087-2.04 2.717c-.722.963-2.02 1.066-2.86.26l-.111-.116-.814-.91a.562.562 0 00-.793-.07l-.075.073-1.4 1.617a.645.645 0 01-.97.029.805.805 0 01-.09-.977l.064-.086 1.4-1.617c.736-.852 1.95-.897 2.734-.137l.114.12.81.905a.587.587 0 00.861.033l.07-.078 2.04-2.718c.81-1.08 2.27-1.19 3.205-.275zM6.831 4.64c1.265 0 2.292 1.125 2.292 2.51 0 1.386-1.027 2.511-2.292 2.511S4.54 8.537 4.54 7.152c0-1.386 1.026-2.51 2.291-2.51zm0 1.504c-.507 0-.918.451-.918 1.007 0 .555.411 1.006.918 1.006.507 0 .919-.451.919-1.006 0-.556-.412-1.007-.919-1.007z"
                  />
                </svg>
              </span>
              Photo{images.length > 0 ? ` (${images.length})` : ""}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {/* Video */}
          <div className="_feed_inner_text_area_bottom_video _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
            >
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="24"
                  fill="none"
                  viewBox="0 0 22 24"
                >
                  <path
                    fill="#666"
                    d="M11.485 4.5c2.213 0 3.753 1.534 3.917 3.784l2.418-1.082c1.047-.468 2.188.327 2.271 1.533l.005.141v6.64c0 1.237-1.103 2.093-2.155 1.72l-.121-.047-2.418-1.083c-.164 2.25-1.708 3.785-3.917 3.785H5.76c-2.343 0-3.932-1.72-3.932-4.188V8.688c0-2.47 1.589-4.188 3.932-4.188h5.726zm0 1.5H5.76C4.169 6 3.197 7.05 3.197 8.688v7.015c0 1.636.972 2.688 2.562 2.688h5.726c1.586 0 2.562-1.054 2.562-2.688v-.686-6.329c0-1.636-.973-2.688-2.562-2.688zM18.4 8.57l-.062.02-2.921 1.306v4.596l2.921 1.307c.165.073.343-.036.38-.215l.008-.07V8.876c0-.195-.16-.334-.326-.305z"
                  />
                </svg>
              </span>
              Video
            </button>
          </div>

          {/* Visibility */}
          <div className="_feed_inner_text_area_bottom_article _feed_common">
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "public" | "private")
              }
              className="_feed_inner_text_area_bottom_photo_link"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                cursor: "pointer",
                color: "#666",
                fontSize: 14,
                padding: "0 4px",
              }}
            >
              <option value="public">🌍 Public</option>
              <option value="private">🔒 Private</option>
            </select>
          </div>
        </div>

        {/* Post button */}
        <div className="_feed_inner_text_area_btn">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && images.length === 0)}
            className="_feed_inner_text_area_btn_link"
          >
            <svg
              className="_mar_img"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="13"
              fill="none"
              viewBox="0 0 14 13"
            >
              <path
                fill="#fff"
                fillRule="evenodd"
                d="M6.37 7.879l2.438 3.955a.335.335 0 00.34.162c.068-.01.23-.05.289-.247l3.049-10.297a.348.348 0 00-.09-.35.341.341 0 00-.34-.088L1.75 4.03a.34.34 0 00-.247.289.343.343 0 00.16.347L5.666 7.17 9.2 3.597a.5.5 0 01.712.703L6.37 7.88z"
                clipRule="evenodd"
              />
            </svg>
            <span>{loading ? "Posting…" : "Post"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
