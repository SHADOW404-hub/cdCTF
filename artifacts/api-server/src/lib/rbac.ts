
export type UserRole = "user" | "admin" | string;

export interface RBACPermissions {
  [table: string]: {
    [role: string]: string[]; // Allowed columns for this role
  };
}

export const columnPermissions: RBACPermissions = {
  users: {
    user: ["nickname", "avatarUrl"],
    admin: ["nickname", "avatarUrl", "points", "role", "isBlocked", "email", "emailVerified"],
  },
  ctf_tasks: {
    user: [], // Users cannot update CTF tasks
    admin: [
      "name", "nameUz", "nameRu", "description", "descriptionUz", "descriptionRu",
      "category", "difficulty", "points", "hint", "flag", "fileUrl", "hintCost", "isPublished"
    ],
  },
  lessons: {
    user: [],
    admin: [
      "title", "titleUz", "titleRu", "content", "contentUz", "contentRu",
      "categoryId", "points", "isPublished", "orderIndex"
    ],
  },
  competitions: {
    user: [],
    admin: [
      "name", "description", "type", "startTime", "endTime", "inviteCode", "isPublished"
    ],
  },
};

/**
 * Filters the input data to only include columns that the user is allowed to update.
 */
export function filterAllowedUpdates(role: UserRole, table: string, data: Record<string, any>): Record<string, any> {
  const allowedColumns = columnPermissions[table]?.[role] || columnPermissions[table]?.["user"] || [];
  
  if (role === "admin") {
    // Admins usually have full access, but we can still restrict if needed.
    // For now, let's return as is if the table is defined for admin, 
    // or filter if we want to be strict.
    if (columnPermissions[table]?.admin) {
        const filtered: Record<string, any> = {};
        for (const key of Object.keys(data)) {
            if (columnPermissions[table].admin.includes(key)) {
                filtered[key] = data[key];
            }
        }
        return filtered;
    }
  }

  const filtered: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (allowedColumns.includes(key)) {
      filtered[key] = data[key];
    }
  }

  return filtered;
}
