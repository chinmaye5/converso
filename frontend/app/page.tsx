import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1>welcome</h1>

      <div className="flex gap-5">
        <Link href="/login">Login</Link>
        <Link href="/signup">Signup</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/logout">Logout</Link>
      </div>
    </div>
  );
}
