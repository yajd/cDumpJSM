function startup(aData, aReason) {
/* 	Components.utils.import('chrome://cdumpjsm/content/cDump.jsm');
	Components.utils.import('resource://gre/modules/Services.jsm');
	var bData = [1,2,['a','b',true,true],4,{str1:'a string',arr1:[false,false,false,false]},6, null, undefined, new RegExp('rawr','g')];
	//var bData = Services.wm.getMostRecentWindow(null);
	var cWin = Services.wm.getMostRecentWindow(null);
	cDump(cWin,{
		t:'d2 - aData startup',
		depth: 1
	}); */
}

function shutdown(aData, aReason) {
	if (aReason == APP_SHUTDOWN) return;
	Components.utils.unload('chrome://cdumpjsm/content/cDump.jsm');
}

function install() {}

function uninstall() {}



/* //do this if want to make it a resource uri instead of a chrome (chrome://bootstrap-jsm/content/hellowWorld.jsm)
// Import Services.jsm unless in a scope where it's already been imported
Components.utils.import('resource://gre/modules/Services.jsm');

var resProt = Services.io.getProtocolHandler('resource')
                      .QueryInterface(Components.interfaces.nsIResProtocolHandler);

var aliasFile = Components.classes['@mozilla.org/file/local;1']
                          .createInstance(Components.interfaces.nsILocalFile);
aliasFile.initWithPath('/some/absolute/path');

var aliasURI = Services.io.newFileURI(aliasFile);
resProt.setSubstitution('myalias', aliasURI);

// assuming the code modules are in the alias folder itself
*/