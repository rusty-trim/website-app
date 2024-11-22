import { getAuthTokenOrNull } from "@/helpers/oauth/helpers";
import { redirect } from "next/navigation";

export default async function Profile() {
  const auth = await getAuthTokenOrNull();
  const userId = auth?.payload?.id;

  if (userId) {
    return redirect(`/profile/${userId}`);
  }
  
  return redirect(`/login`);
}