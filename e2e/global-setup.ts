import { execSync } from "child_process";

export default async function globalSetup() {
  execSync("npm run seed", { stdio: "inherit" });
}
