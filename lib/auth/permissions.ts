import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  organization: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["create", "read", "update", "delete"],
  batch: ["create", "read", "update", "delete", "download"],
  certificate: ["read", "download", "verify"],
  billing: ["read", "update", "create-subscription", "cancel-subscription"],
  settings: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["create", "read", "update", "delete"],
  batch: ["create", "read", "update", "delete", "download"],
  certificate: ["read", "download", "verify"],
  billing: ["read", "update", "create-subscription", "cancel-subscription"],
  settings: ["read", "update"],
});

export const admin = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["create", "read", "update", "delete"],
  batch: ["create", "read", "update", "delete", "download"],
  certificate: ["read", "download"],
  billing: ["read", "update", "create-subscription"],
  settings: ["read", "update"],
});

export const member = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["create", "read"],
  batch: ["create", "read"],
  certificate: ["read", "download"],
  billing: ["read"],
});

export const eventManager = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["read"],
  batch: ["read"],
  certificate: ["read", "download"],
});

export const staff = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["read"],
  batch: ["read"],
  certificate: ["read"],
});

export const speaker = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["read"],
  batch: ["read"],
});

export const volunteer = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["read"],
  batch: ["read"],
});

export type VeniRoles =
  | "owner"
  | "admin"
  | "member"
  | "eventManager"
  | "staff"
  | "speaker"
  | "volunteer";