import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeViewIdRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/medarbejder/${id}`);
}
