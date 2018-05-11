// main js file
var isdev=true;
const electron = require('electron');
const app = electron.app;
const url = require('url');
const path = require('path');
const {shell} = require('electron');
const {Menu} = require('electron');

const { ipcMain } = require('electron');

var gIsUserAuthenticated = false;

var UserObject = {
    loginname:"",
    password:"",
    getCMail:false,
    getBreakdowns:false,
    getFromDate:""
};

var PrefsObject={
    alertType: "Theatrical",
    alertCMail: true,
    alertBreakdowns: true,
    loginname:"",
    password:""
};

//--------------------------------
// window stuff
let mainWindow="";
let loginWindow="";
let prefsWindow="";
let alertWindow="";
let breakdownWindow="";

let mainMenu;
let menuItem;

function logout(){
    UserObject = {
        loginname:"",
        password:"",
        getCMail:false,
        getBreakdowns:false,
        getFromDate:""
    };

    mainWindow.webContents.send('stopTimer',"");
    mainWindow.hide();

    if (prefsWindow){
        prefsWindow.close();
    }

    if (breakdownWindow){
        breakdownWindow.close();
    }

    setMenuLoggedIn(false);

    gIsUserAuthenticated = false;
}

//--------------------------
// live reloading of the interface when something changes - development only
// uncomment for development
if (isdev){
    const electronReload = require('electron-reload');

    electronReload(__dirname,{
        electron: path.join(__dirname, '../','node_modules','.bin','electron')
    });
}


//--------------------------------
// menu definitions
function createMenus(breakdownCount,CMailCount){
    var breakdownCountLabel;
    var CMailCountLabel;
    if (breakdownCount == -1){
        breakdownCountLabel = getMenuItem('new breakdowns').label;
    }else {
        breakdownCountLabel = breakdownCount + ' new breakdowns';
    }
    if (CMailCount == -1){
        CMailCountLabel = getMenuItem('unread messages').label;
    }else{
        CMailCountLabel = CMailCount + ' unread messages';
    }

    const template = [
        {
          label: 'Edit',
          submenu: [
            {role: 'copy'},
            {role: 'paste'},
          ]
        },{
        label: 'Services',
            submenu: [
            {
                label: breakdownCountLabel,
                click: () => createBreakdownWindow(),//shell.openExternal('https://www.breakdownexpress.com/projects/index.cfm'),
                enabled: false,visible: false
            },
            {
                label: CMailCountLabel,
                click: () => electron.shell.openExternal('https://www.breakdownexpress.com/cmail/'),
                enabled: true,visible: false
            },
            {
                type: 'separator',
                visible: false
            },
            {
                label: 'Check for new Breakdowns',
                click: () => mainWindow.webContents.send('menuCheckForBreakdowns',''),
                enabled: false, visible: false
            },
            {
                label: 'View Current Breakdowns',
                click: () =>  createBreakdownWindow(),
                enabled: false, visible: false
            },
            {type: 'separator'},
            {
                label: 'Check for new CMail',
                click: () => mainWindow.webContents.send('menuCheckForCMail',''),
                enabled: false, visible: true
            },
            {
                label: 'Access my CMail',
                click: () => electron.shell.openExternal('https://www.breakdownexpress.com/cmail/'),
                enabled: false, visible: true
            },
            {type: 'separator'},
            {
                label: 'Preferences',
                click: () => createPrefsWindow(),
                enabled: false
            },
            {type: 'separator'},
            {
                label: 'Log in as a different user',
                click: () => createLoginWindow(),
                enabled: false
            }
        ]
    }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                //{role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        });
    }

    mainMenu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(mainMenu);
}
//--------------------------------
function getMenuItem (label) {
  for (var i = 0; i < mainMenu.items.length; i++) {
    var menuItem = mainMenu.items[i].submenu.items.find(function (item) {
      //return item.label === label;
      return item.label.includes(label);
  });
    if (menuItem) return menuItem;
  }
}
//--------------------------------
function setMenuLoggedIn(how){
    var breakdownMenus = (UserObject.getBreakdowns && PrefsObject.alertBreakdowns);
    var cmailMenus = (UserObject.getCMail && PrefsObject.alertCMail);

    getMenuItem('new breakdowns').enabled = how;
    getMenuItem('new breakdowns').visible = how;
    getMenuItem('unread messages').enabled = how;
    getMenuItem('unread messages').visible = how;

    if (breakdownMenus == true){
        getMenuItem('Check for new Breakdowns').enabled = how;
        getMenuItem('Check for new Breakdowns').visible = how;
        getMenuItem('View Current Breakdowns').enabled = how;
        getMenuItem('View Current Breakdowns').visible = how;
    }else {
        getMenuItem('new breakdowns').enabled = false;
        getMenuItem('new breakdowns').visible = false;
        getMenuItem('Check for new Breakdowns').enabled = false;
        getMenuItem('Check for new Breakdowns').visible = false;
        getMenuItem('View Current Breakdowns').enabled = false;
        getMenuItem('View Current Breakdowns').visible = false;

        //getMenuItem('Preferences').enabled = false;
    }

    if(PrefsObject.alertCMail == false){
        getMenuItem('unread messages').enabled = false;
        getMenuItem('unread messages').visible = false;

        getMenuItem('Check for new CMail').enabled = false;
        getMenuItem('Access my CMail').enabled = false;

        getMenuItem('Check for new CMail').visible = false;
        getMenuItem('Access my CMail').visible = false;
    }else{
        getMenuItem('Check for new CMail').visible = true;
        getMenuItem('Access my CMail').visible = true;
    }
    getMenuItem('Check for new CMail').enabled = how;
    getMenuItem('Access my CMail').enabled = how;

    if (UserObject.getBreakdowns === false){
        getMenuItem('Preferences').visible = false;
    }
    else{
        getMenuItem('Preferences').enabled = how;
    }
    getMenuItem('Log in as a different user').enabled = true;
}

//--------------------------------//--------------------------------//--------------------------------
//--------------------------------//--------------------------------//--------------------------------
//--------------------------------//--------------------------------//--------------------------------
//--------------------------------//--------------------------------//--------------------------------
// main window
function createMainWindow() {
    mainWindow =  new electron.BrowserWindow({
        width: 300 ,
        height: 150,
        icon: path.join(__dirname, 'assets/icons/png/64x64.png')
    });


    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, '.','content.html'),
        protocol: 'file:',

        slashes: true
    }));

// uncomment for development
if (isdev) mainWindow.webContents.openDevTools();

    createMenus(0,0);
    setMenuLoggedIn(false);

    if (!gIsUserAuthenticated){
        createLoginWindow();
    }

    mainWindow.on('closed', () => {
        if (prefsWindow){
            prefsWindow.close();
        }
        if (loginWindow){
            loginWindow.close();
        }
        if (breakdownWindow){
            breakdownWindow.close();
        }
        mainWindow = null;
    });
}

//--------------------------------
// prefs window
function createPrefsWindow(){
    if (prefsWindow){
        return;
    }

    prefsWindow =  new electron.BrowserWindow({
        width: 375 ,
        height: 180,
        //frame: false
    });

    prefsWindow.loadURL(url.format({
        pathname: path.join(__dirname, '.','prefs.html'),
        protocol: 'file:',
        slashes: true
    }));

// uncomment for development
//prefsWindow.webContents.openDevTools();

    prefsWindow.on('closed', () => {
        prefsWindow = null;
    });
}

//--------------------------------
// login window stuff
function createLoginWindow(){
    if (loginWindow){
        return;
    }

    logout();

    loginWindow =  new electron.BrowserWindow({
        width: 340,
        height: 260
        //frame: false
    });

    loginWindow.loadURL(url.format({
        pathname: path.join(__dirname, '.','login.html'),
        protocol: 'file:',
        slashes: true
    }));

// uncomment for development
//loginWindow.webContents.openDevTools();

    loginWindow.setAlwaysOnTop(true);

    loginWindow.on('closed', () => {
        loginWindow = null;
    });
}

//--------------------------------
// breakdown window
function createBreakdownWindow(){
    if (breakdownWindow){
        return;
    }

    breakdownWindow =  new electron.BrowserWindow({
        width: 800 ,
        height: 500,
        //frame: false
    });

    breakdownWindow.loadURL(url.format({
        pathname: path.join(__dirname, '.','breakdown.html'),
        protocol: 'file:',
        slashes: true
    }));

// uncomment for development
//breakdownWindow.webContents.openDevTools();

    breakdownWindow.webContents.on('did-finish-load', () => {
        breakdownWindow.webContents.send("updateBreakdownList");
    });

    breakdownWindow.on('beforeunload', () =>{
        breakdownWindow.webContents.send("updateBreakdownDetails");
    });

    breakdownWindow.on('closed', () => {
        breakdownWindow = null;
    });
}

//--------------------------------
// alerts window stuff
function createAlertWindow(message){
    if (alertWindow){
        return;
    }
    alertWindow =  new electron.BrowserWindow({
        width: 300 ,
        height: 100,
        frame: false
    });

    alertWindow.loadURL(url.format({
        pathname: path.join(__dirname, '.','alert.html'),
        protocol: 'file:',
        slashes: true
    }));

// uncomment for development
//alertWindow.webContents.openDevTools();

    alertWindow.on('ready',() => {
        mainWindow.webContents.send('alertSetMessage',message);
    });

    alertWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('alertSetMessage',message);
    });

    alertWindow.on('closed', () => {
        alertWindow = null;
    });
}

//---------------------------
// general window creating stuff...

app.on('ready', createMainWindow); // create window on ready (duh)
app.on('window-all-closed', () => { // on windows close the app if the window closes
//  if (process.platform !== 'darwin'){
    app.quit();
//  }
});

/*app.on('activate', () => { // reopen the window if it was closed
  if(mainWindow === null){
    createWindow();
  }
});*/

function sendMessage(messageText){
    event.sender.send(messageText,"");
}
//--------------------------
// interprocess communications
//-- when we get a new breakdown update the list if the window is open
ipcMain.on('_updateBreakdownList', (event,arg) =>{
    if (breakdownWindow){
        breakdownWindow.webContents.send("updateBreakdownList");
    }
});

//-- prefs
ipcMain.on('createPrefsWindow', (event,arg) =>{
    createPrefsWindow();
});
ipcMain.on('closePrefsWindow', (event,arg) =>{
    if (prefsWindow){
        prefsWindow.close();
    }
});
ipcMain.on('refreshPrefs', (event,arg) =>{
    PrefsObject = arg;
    if (mainWindow){
        mainWindow.webContents.send('prefsUpdated',"");
    }
    if (breakdownWindow){
        breakdownWindow.webContents.send("prefsUpdated");
    }
});
//-- login
ipcMain.on('createLoginWindow', (event,arg) =>{
    createLoginWindow();
    if (mainWindow){
        mainWindow.webContents.send('setUserObject',UserObject);
    }
});
ipcMain.on('userIsLoggedIn', (event,arg) =>{
    UserObject = arg;
    gIsUserAuthenticated = true;
    loginWindow.close();
    mainWindow.show();
    setMenuLoggedIn(true);
    mainWindow.webContents.send('beginMainLoop',UserObject);
});
ipcMain.on('closeLoginWindow', (event,arg) =>{
    if(loginWindow){
        loginWindow.close();
    }
});
ipcMain.on('loginFailed', (event,arg) =>{
    gIsUserAuthenticated = false;
    if (loginWindow){
        loginWindow.close();
    }
    createAlertWindow("Unable to Login");
});
//-- alerts
ipcMain.on('createAlertWindow', (event,arg) =>{
    createAlertWindow(arg);
});
ipcMain.on('closeAlertWindow', (event,arg) =>{
    if (alertWindow){
        alertWindow.close();
    }
});
//-- update cmail and breakdown count on menus when a new item is detected
ipcMain.on('_updateBreakdownMenuCount', (event,arg) =>{
    createMenus(arg,-1);
    setMenuLoggedIn(true);
});
ipcMain.on('updateCMailMenuCount', (event,arg) =>{
    createMenus(-1,arg);
    setMenuLoggedIn(true);
});

//-- update the "new" count after we view the new breakdowns
ipcMain.on('_updateNewBreakdownCount', (event,arg) =>{
    if (mainWindow){
        mainWindow.webContents.send('updateNewBreakdownCount',"");
    }
});

//-- resize the main window
ipcMain.on('resizeMainWindow', (event,arg) =>{
    var sizeObject = arg;

    mainWindow.setSize(arg.width,arg.height);
});
