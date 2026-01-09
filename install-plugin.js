#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Check if running in WSL
function isWSL() {
  if (os.platform() !== 'linux') return false;
  
  try {
    // Check for WSL in /proc/version
    const procVersion = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    if (procVersion.includes('microsoft') || procVersion.includes('wsl')) {
      return true;
    }
  } catch (e) {
    // Ignore errors
  }
  
  try {
    // Check for WSL environment variable
    if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) {
      return true;
    }
  } catch (e) {
    // Ignore errors
  }
  
  return false;
}

// Get Windows username from WSL
function getWindowsUsername() {
  try {
    // Try to get Windows username from WSLENV or by checking /mnt/c/Users
    const usersDir = '/mnt/c/Users';
    if (fs.existsSync(usersDir)) {
      const users = fs.readdirSync(usersDir).filter(name => {
        const userPath = path.join(usersDir, name);
        try {
          const stat = fs.statSync(userPath);
          // Look for a real user directory (has .config or AppData)
          return stat.isDirectory() && 
                 name !== 'Public' && 
                 name !== 'Default' && 
                 name !== 'All Users' &&
                 !name.startsWith('Default');
        } catch (e) {
          return false;
        }
      });
      
      // Look for the user with a .config directory
      for (const user of users) {
        if (fs.existsSync(path.join(usersDir, user, '.config', 'joplin-desktop'))) {
          return user;
        }
      }
      
      // Fallback to first valid user
      if (users.length > 0) {
        return users[0];
      }
    }
    
    // Final fallback: try to get from WSL username
    return process.env.LOGNAME || process.env.USER || 'user';
  } catch (e) {
    return 'user';
  }
}

// Determine Joplin plugins directory based on OS
function getJoplinPluginsDir() {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  // Check for WSL first
  if (isWSL()) {
    const username = getWindowsUsername();
    // Use WSL path to access Windows filesystem
    const windowsPath = `/mnt/c/Users/${username}/.config/joplin-desktop/plugins`;
    console.log('Detected WSL environment, using Windows Joplin directory');
    return windowsPath;
  }
  
  switch (platform) {
    case 'darwin': // macOS
      return path.join(homeDir, 'Library', 'Application Support', 'Joplin', 'plugins');
    case 'win32': // Windows
      return path.join(homeDir, '.config', 'joplin-desktop', 'plugins');
    case 'linux':
      return path.join(homeDir, '.config', 'joplin-desktop', 'plugins');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function installPlugin() {
  try {
    const rootDir = path.resolve(__dirname);
    const publishDir = path.join(rootDir, 'publish');
    
    // Read manifest to get plugin ID
    const manifestPath = path.join(rootDir, 'src', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const pluginId = manifest.id;
    
    // Find the .jpl file
    const jplFile = path.join(publishDir, `${pluginId}.jpl`);
    
    if (!fs.existsSync(jplFile)) {
      console.error(`Plugin file not found: ${jplFile}`);
      console.error('Run "npm run dist" first to build the plugin.');
      process.exit(1);
    }
    
    // Get Joplin plugins directory
    const joplinPluginsDir = getJoplinPluginsDir();
    const destFile = path.join(joplinPluginsDir, `${pluginId}.jpl`);
    
    // For WSL, use direct file operations to Windows paths
    if (isWSL()) {
      try {
        // Check if directory exists first
        const dirPath = path.dirname(destFile);
        if (!fs.existsSync(dirPath)) {
          console.error(`Joplin plugins directory does not exist: ${dirPath}`);
          console.error(`Please ensure Joplin Desktop is installed and has been run at least once.`);
          process.exit(1);
        }
        
        // Read and write the file directly
        const fileContent = fs.readFileSync(jplFile);
        fs.writeFileSync(destFile, fileContent);
        
        console.log(`✓ Plugin installed successfully!`);
        console.log(`  Source: ${jplFile}`);
        console.log(`  Destination: ${destFile}`);
        console.log(`\nRestart Joplin to load the updated plugin.`);
      } catch (error) {
        console.error('Failed to copy plugin file:', error.message);
        console.error(`\nManually copy the plugin:\n  From: ${jplFile}\n  To: ${destFile}`);
        process.exit(1);
      }
    } else {
      // For non-WSL systems, use Node.js fs operations
      try {
        fs.ensureDirSync(joplinPluginsDir);
      } catch (mkdirError) {
        // Ignore if directory already exists
      }
      
      try {
        fs.copyFileSync(jplFile, destFile);
        console.log(`✓ Plugin installed successfully!`);
        console.log(`  Source: ${jplFile}`);
        console.log(`  Destination: ${destFile}`);
        console.log(`\nRestart Joplin to load the updated plugin.`);
      } catch (copyError) {
        console.error('Failed to copy plugin file:', copyError.message);
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('Error installing plugin:', error.message);
    process.exit(1);
  }
}

installPlugin();
