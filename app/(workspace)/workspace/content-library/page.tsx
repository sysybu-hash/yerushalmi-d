import { ContentLibraryWorkspace } from "@/components/workspace/content-library-workspace";
import { getMediaAssets } from "./actions";

export const metadata = { title: "ספריית תוכן AI" };

export const dynamic = "force-dynamic";

export default async function ContentLibraryPage() {
  const assets = await getMediaAssets();

  return <ContentLibraryWorkspace assets={assets} />;
}
