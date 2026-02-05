# https://docs.openwebui.com/features/rbac/

  * [](/)
  * [⭐ Features](/features/)
  * Role-Based Access Control (RBAC)



On this page

# Role-Based Access Control (RBAC)

Open WebUI implements a flexible and secure **Role-Based Access Control (RBAC)** system. This system allows administrators to precisely manage user capabilities and access to resources through three interconnected layers:

  1. [**Roles**](/features/rbac/roles): The high-level user type (Admin, User, Pending). This defines the baseline trust level.
  2. [**Permissions**](/features/rbac/permissions): Granular feature flags (e.g., "Can Delete Chats", "Can Use Web Search").
  3. [**Groups**](/features/rbac/groups): The mechanism for organizing users, granting additional permissions, and managing shared access to resources (ACLs).



Key Concept: Additive Permissions

The security model is **Additive**. Users start with their default rights, and Group memberships **add** capabilities. A user effectively has the _union_ of all rights granted by their Roles and Groups.

## Documentation Guide​

  * [‍🔑 **Roles**](/features/rbac/roles)

    * Understand the difference between Admins and Users.
    * Learn about Admin limitations and security/privacy configurations.
  * [🔒 **Permissions**](/features/rbac/permissions)

    * Explore the full list of available permission toggles.
    * Understand granular controls for Chat, Workspace, and Features.
    * **Security Tip** : Learn how properly configured Global Defaults protect your system.
  * [‍🔐 **Groups**](/features/rbac/groups)

    * Learn how to structure teams and projects.
    * **Strategy** : Distinguish between "Permission Groups" (for rights) and "Sharing Groups" (for access).
    * Manage Access Control Lists (ACLs) for private Models and Knowledge.



[Edit this page](https://github.com/open-webui/docs/blob/main/docs/features/rbac/index.mdx)

[PreviousKnowledge](/features/workspace/knowledge)[NextGroups](/features/rbac/groups)

  * Documentation Guide


