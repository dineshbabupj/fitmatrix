"""Apply expo-modules-core patches that patch-package can't handle on Windows."""
import os, sys

def patch_file(path, replacements):
    full = os.path.join("node_modules", path)
    if not os.path.exists(full):
        return
    with open(full, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched: {path}")

# Fix 1: PermissionsService.kt - null safety
patch_file(
    "expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt",
    [(
        "return requestedPermissions?.contains(permission) ?: false",
        "val perms = requestedPermissions\n        if (perms != null) {\n          return perms.contains(permission)\n        }\n        return false"
    )]
)

# Fix 2: ExpoModulesCorePlugin.gradle - components.release crash
patch_file(
    "expo-modules-core/android/ExpoModulesCorePlugin.gradle",
    [(
        "        release(MavenPublication) {\n          from components.release\n        }",
        "        if (components.findByName('release') != null) {\n          release(MavenPublication) {\n            from components.release\n          }\n        }"
    )]
)

print("All patches applied.")
