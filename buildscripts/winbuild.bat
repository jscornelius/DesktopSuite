npm run make

electron-packager . DesktopSuite --platform=win32 --arch=ia32

electron-packager . --platform=win32 --arch=x64 --asar --overwrite --icon="./src/assets/icons/win/icon.ico" --out=./dist
