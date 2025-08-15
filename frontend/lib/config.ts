import z from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string(),
});

export type AppConfig = {
  apiUrl: string;
};

const envs = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};

const parsed = envSchema.safeParse(envs);

if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    console.error(
      `Invalid environment variable: ${issue.path.join(".")}: ${issue.message}`
    );
  }
  throw new Error("Invalid environment variables");
}

const config: AppConfig = {
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL,
};

export default config;
