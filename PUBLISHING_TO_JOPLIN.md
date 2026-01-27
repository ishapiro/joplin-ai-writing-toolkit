# Publishing to Joplin Repository

## Prerequisites

- You must have a Joplin account.
- You must have an NPM account.

## Steps

1. Update the version in the package.json file.
2. Update the version in the manifest.json file.
3. Run `npm run dist` to build the plugin.
4. Run `npm publish` to publish the plugin to NPM.

Note this is npm publish and not npm run publish