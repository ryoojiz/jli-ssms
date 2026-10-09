import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const readSession = createServerFn({ method: "GET" }).handler(async () => {
  const { currentIdentity } = await import("@/db/auth.server");
  const { mysqlPool } = await import("@/db/mysql.server");
  await mysqlPool().query("SELECT 1");
  return (await currentIdentity())?.sesi ?? null;
});

export const loginAccount = createServerFn({ method: "POST" })
  .inputValidator((value) =>
    z.object({ email: z.email(), password: z.string().min(1).max(200) }).parse(value),
  )
  .handler(async ({ data }) => {
    const { signIn } = await import("@/db/auth.server");
    const sesi = await signIn(data.email, data.password);
    if (!sesi) throw new Error("Email atau kata sandi tidak cocok.");
    return sesi;
  });

export const logoutAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { signOut } = await import("@/db/auth.server");
  await signOut();
});

export const selectSchool = createServerFn({ method: "POST" })
  .inputValidator((value) => z.object({ schoolId: z.string().min(1).max(32) }).parse(value))
  .handler(async ({ data }) => {
    const { switchSchool } = await import("@/db/auth.server");
    return switchSchool(data.schoolId);
  });
