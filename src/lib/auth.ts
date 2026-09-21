import "server-only";

import { getDb } from "@/db";
import { createAuth } from "@/lib/auth-factory";

export const auth = createAuth(getDb());
