// This file addresses the issue of yt-dlp failing on Azure App Service

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if yt-dlp exists on the server
const checkYtdlpInstalled = () => {
  return new Promise((resolve, reject) => {
    exec('yt-dlp --version', (error, stdout, stderr) => {
      if (error || stderr) {
        reject('yt-dlp is not installed or there is a permission issue');
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

// Ensure that yt-dlp has the correct permissions in Azure App Service
const fixPermissions = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.chmod(filePath, '755', (err) => {
      if (err) {
        reject('Error changing permissions for yt-dlp');
      } else {
        resolve('Permissions fixed successfully');
      }
    });
  });
};

// Check if yt-dlp is installed and if there are permission issues
const runYtdlpCommand = async () => {
  try {
    const ytDlpVersion = await checkYtdlpInstalled();
    console.log(`yt-dlp is installed: ${ytDlpVersion}`);
    const ytDlpPath = '/usr/local/bin/yt-dlp'; // Ensure correct path for Azure environment
    await fixPermissions(ytDlpPath);
    console.log('yt-dlp permissions fixed successfully');
    // Run yt-dlp command after confirming installation and fixing permissions
    exec('yt-dlp <video_url>', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing yt-dlp: ${error.message}`);
      } else if (stderr) {
        console.error(`yt-dlp stderr: ${stderr}`);
      } else {
        console.log(`yt-dlp output: ${stdout}`);
      }
    });
  } catch (error) {
    console.error(error);
  }
};

runYtdlpCommand();