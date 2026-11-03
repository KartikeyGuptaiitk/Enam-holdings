import Desk from "../components/desk";
import { deskSnapshot } from "../lib/view/desk";
export const dynamic = "force-dynamic";
export default function Page() {
  return <Desk data={deskSnapshot()} />;
}
