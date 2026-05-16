import { SetMetadata } from '@nestjs/common';

// SetMetadata attaches data to the route handler's metadata.
// The RolesGuard reads this metadata to check if the user has the required role.
// Usage: @Roles('admin') or @Roles('admin', 'user')
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
