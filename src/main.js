// main js file
var isdev = true;
const electron = require('electron');
const app = electron.app;
const url = require('url');
const path = require('path');

// development only
const electronReload = require('electron-reload');

//const _ = require('underscore');

//const ipcMain = electron.ipcMain;

//--------------------------------
// main window stuff
let mainWindow;
function createWindow() {
    mainWindow =  new electron.BrowserWindow({
        width: 600,
        height: 400
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '..','app','index.html'),
        protocol: 'file:',
        slashes: true
    }));

    if (isdev === true){
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

//--------------------------
// live reloading of the interface when something changes - may not need for production
// development only
electronReload(__dirname,{
  electron: path.join(__dirname, '../','node_modules','.bin','electron')
});

//---------------------------
// general window creating stuff...
app.on('ready', createWindow); // create window on ready (duh)
app.on('window-all-closed', () => { // on windows close the app if the window closes
  if (process.platform !== 'darwin'){
    app.quit();
  }
});
app.on('activate', () => { // reopen the window if it was closed
  if(mainWindow === null){
    createWindow();
  }
});


//--------------------------
// messaging - to be refactored
/*
ipcMain.on('async-message', (event, arg) =>{
  console.log("async message recieved in main.js");
  //event.sender.send('async-reply', 'async message recieved in main.js');
});
ipcMain.on('sync-message', (event, arg) =>{
  console.log(arg);
  event.returnValue = 'sync message recieved in main.js';
});

setTimeout(function(){
  mainWindow.webContents.send('async-message','async message sent by timeout');
},1000);
*/
