import { z } from "zod";


// authentication
export const authenticationRequestBodySchema = z.object({
  email: z.string().email(),
  image: z.string(),
});
