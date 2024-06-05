---
"zsa-react": patch
---

Fixes case where useServerAction would invoke onSuccess before the server action was done running revalidatePath or redirect
