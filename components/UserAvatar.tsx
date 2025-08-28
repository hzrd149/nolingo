export default function UserAvatar({
  user,
  size = "size-24",
}: {
  user: {
    username: string;
    display_name: string | null;
    picture_id: number | null;
  };
  size?: string;
}) {
  return (
    <div className="avatar avatar-placeholder">
      <div className={`bg-neutral text-neutral-content ${size} rounded-full`}>
        {(user.display_name ?? user.username)?.[0]?.toUpperCase() || "?"}
      </div>
    </div>
  );
}
