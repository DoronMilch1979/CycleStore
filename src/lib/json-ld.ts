import { STORE_NAME } from "@/config/site";

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify({
      "@context": "https://schema.org",
      ...data,
    }).replace(/</g, "\\u003c"),
  };
}

export function storeOrganizationJsonLd(options?: {
  email?: string;
  telephone?: string;
  address?: string;
  url: string;
}) {
  return {
    "@type": "BikeStore",
    name: STORE_NAME,
    url: options?.url,
    ...(options?.email ? { email: options.email } : {}),
    ...(options?.telephone ? { telephone: options.telephone } : {}),
    ...(options?.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: options.address,
            addressCountry: "IL",
          },
        }
      : {}),
  };
}
