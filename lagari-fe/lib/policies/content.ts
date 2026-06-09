import type { PolicyDocument } from "@/lib/policies/types";
import { EXCHANGE_POLICY } from "@/lib/policies/exchange";
import { PRIVACY_POLICY } from "@/lib/policies/privacy";
import { SHIPPING_POLICY } from "@/lib/policies/shipping";
import { TERMS_OF_SERVICE } from "@/lib/policies/terms";

export const POLICY_CONTENT: Record<string, PolicyDocument> = {
  terms: TERMS_OF_SERVICE,
  exchange: EXCHANGE_POLICY,
  shipping: SHIPPING_POLICY,
  privacy: PRIVACY_POLICY,
};
