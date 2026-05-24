import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl" aria-hidden>
        ⚠️
      </p>
      <h1 className="mt-4 text-xl font-bold text-work-navy">
        Siden blev ikke fundet
      </h1>
      <Link
        href="/"
        className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-work-navy px-6 font-semibold text-white"
      >
        Gå til forsiden
      </Link>
    </div>
  );
}
