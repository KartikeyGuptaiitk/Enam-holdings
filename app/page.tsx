import Desk from "../components/desk";
import { snapshot } from "../lib/data";
export const dynamic = "force-dynamic";
export default function Page() {
  return <Desk data={snapshot()} />;
}
