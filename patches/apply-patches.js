/**
 * Apply expo-modules-core patches that patch-package can't handle on Windows.
 * Runs during postinstall on EAS build server.
 */
const fs = require('fs');
const path = require('path');

function patchFile(relativePath, replacements) {
  const fullPath = path.join('node_modules', relativePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP: ${relativePath} not found`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  for (const [old, rep] of replacements) {
    if (content.includes(old)) {
      content = content.replace(old, rep);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Patched: ${relativePath}`);
  } else {
    console.log(`Already patched: ${relativePath}`);
  }
}

// Fix 1: ExpoModulesCorePlugin.gradle - components.release crash
patchFile(
  'expo-modules-core/android/ExpoModulesCorePlugin.gradle',
  [[
    '        release(MavenPublication) {\n          from components.release\n        }',
    "        if (components.findByName('release') != null) {\n          release(MavenPublication) {\n            from components.release\n          }\n        }"
  ]]
);

// Fix 2: PermissionsService.kt - null safety
patchFile(
  'expo-modules-core/android/src/main/java/expo/modules/adapters/react/permissions/PermissionsService.kt',
  [[
    'return requestedPermissions?.contains(permission) ?: false',
    'val perms = requestedPermissions\n        if (perms != null) {\n          return perms.contains(permission)\n        }\n        return false'
  ]]
);

console.log('All patches applied.');
