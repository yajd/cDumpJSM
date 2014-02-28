const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import('resource://gre/modules/Services.jsm');
var EXPORTED_SYMBOLS = ['cDump'];

function cDump(obj, opts) {
    /*
    /////////////////
    KEYS AVAIL IN OPTS
    t - title for tab, window, and in prettyPrint
    inbg - load tab inbg
	depth - number (default 1);
    /////////////////
    */
    
    if (!opts) { opts = {}; }
	if ('depth' in opts === false) { opts.depth = 1 };
	if ('inbg' in opts === false) { opts.inbg = false };
    if ('objStr' in opts === false) { opts.objStr = 'NAME_STRING_UNDEFINED' }
	
    var cWin = Services.wm.getMostRecentWindow('navigator:browser');
	Cu.reportError('cWin == ' + cWin);
	if (!cWin) {
		Cu.reportError('no recent browser with tabs found. cannot cDump. aborted.');
		return;
	}
	
	var doc;
	var win;
    var onloadFunc = function() {
        cWin.gBrowser.selectedTab = cWin.gBrowser.tabContainer.childNodes[cWin.gBrowser.tabContainer.childNodes.length-1];
        newTabBrowser.removeEventListener('load', onloadFunc, true);
		doc = newTabBrowser.contentDocument;
		win = doc.defaultView;
		
		doc.title = opts.t !== undefined ? opts.t : 'cDump';
		var div = ['div', {}, dig(obj, 0)];
		var referenceNodes = {};
		var createdDiv = jsonToDOM(div , cWin.document, referenceNodes);
		if (opts.appendChild) {
			doc.documentElement.appendChild(
				createdDiv // cannot appendChild, also on restart, it doesnt persist, i have to set the location to it, otherwise the findbar doesnt work, its so weird
			);
		} else {
			//start make htmldatauri
			var dummyDiv = cWin.document.createElementNS(jsonToDOM.defaultNamespace, 'div');
			dummyDiv.appendChild(createdDiv);
			var head = '';
			var body = '';
			body += dummyDiv.innerHTML; // i have to set the location to it, otherwise the findbar doesnt work, its so weird
			Cu.reportError('toSource = ' + dummyDiv.toSource());
			if (opts.t) {
				head += '<title>' + opts.t + '</title>';
			}
			head += ' <meta charset="UTF-8">';
			var htmlDataUri = 'data:text/html,' + encodeURIComponent('<head>' + head + '</head>' + '<body>' + body + '</body>');
			//end make htmldatauri
			doc.location = htmlDataUri;
		}
    };
	
	var dig = function(targ, cDepth) {
		var json;


			var cTypes = cTypeof(targ, ['typeof', 'objS','funcS','nodeS','obj','func']); //obj and func are just for debug purposes, in case something strange comes up
			var scType = cTypes.typeof; //cTypes.nodeS ? cTypes.nodeS : cTypes.objS; //single type to define it
			Cu.reportError('scType init = ' + scType);			
			scType = scType[0].toUpperCase() + scType.substr(1); //proper case uppers the first one non regex solution
			Cu.reportError('scType proper cased = ' + scType);
			if (scType == 'Object') {
				if (cTypes.nodeS) {
					scType = cTypes.nodeS;
				} else if (['Null', 'Array'].indexOf(cTypes.objS) > -1) {
					scType = cTypes.objS;
				}
			}
			var tTitle = cTypes.typeof + ' - ' + cTypes.objS + ' - ' + cTypes.funcS;
			try {
				tTitle += '(Value: ' + targ + ')';
			} catch (ex) {
				tTitle += '(Value: ' + ex + ')';
			}
			json =
			['table', {}, 
				['tr', {}, //start header 1
					['th', {}, 
						tTitle
					]
				] //end header 1
			];
			try {
				Cu.reportError('targ = "' + targ + '"');
			} catch (ex) {
				Cu.reportError('targ = "' + ex + '"');
			}
			Cu.reportError('scType.typeof = "' + scType.typeof + '"');
			Cu.reportError('cTypes.obj = "' + cTypes.obj + '"');
			Cu.reportError('cTypes.func = "' + cTypes.func + '"');
			switch (scType) {
				case 'Array':
					json.push(
						['tr', {}, 
							['th', {},
								'INDEX'
							],
							['th', {},
								'VALUE'
							]
						]	//header 2
					);
					
					for (var i=0; i<targ.length; i++) {
						var dug;
						try {
							dug = targ[i];
						} catch (ex) {
							dug = ex; //dont need to worry that it will find keys on this, because obviously going targ[i] is throwing error so when it does Object.keys(TARG[I]) it will throw
						}
						try {
							var keys = undefined;
							keys = Object.keys(targ[i]); //note: ES5 feature //dont use Object.keys(dug) here because if dug is an ex it will explore that
							Cu.reportError('XPCWrappedNative_NoHelper || Object --> targ[i] ("' + targ[i] + '") has keys!: type.obj = ' + cTypeof(keys,['obj']).obj + ' length = ' + keys.length + ' val = ' + keys);
						} catch (ex) {
							Cu.reportError('XPCWrappedNative_NoHelper || Object --> ex when keys of targ[i] ("' + targ + '[' + i + ']"): ' + ex);
						}
						if (cDepth < opts.depth) {
							if (keys && keys.length) {
								dug = dig(targ[i], cDepth + 1);
							}
						}
					
						json.push(
							['tr', {}, 
								['td', {},
									i
								],
								['td', {},
									dug
								]
							]	//index value pair
						);
						
						if (keys && keys.length && cDepth == opts.depth) {
							json[json.length-1][3].push(
								['span', {title:'Depth Reached - Click to go one level deeper', 'class': 'max-depth'},
									'[+]'
								]
							);
						}
						
					}
					
					break;
				case 'XPCWrappedNative_NoHelper':
				case 'Object':
					json[2][2][1].colspan = 2;
					json.push(
						['tr', {}, 
							['th', {},
								'KEY'
							],
							['th', {},
								'VALUE'
							]
						]	//header 2
					);
					for (var p in targ) {
						/*
						try {
							var dug = dig(targ[p], cDepth + 1);
						} catch (ex) {
							dug = ex;
						}
						*/
						//Cu.reportError('init - ' + p);
						var dug;
						try {
							dug = targ[p];
						} catch (ex) {
							dug = ex; //dont need to worry that it will find keys on this, because obviously going targ[p] is throwing error so when it does Object.keys(TARG[P]) it will throw
						}
						try {
							var keys = undefined;
							keys = Object.keys(targ[p]); //note: ES5 feature //dont use Object.keys(dug) here because if dug is an ex it will explore that
							Cu.reportError('XPCWrappedNative_NoHelper || Object --> targ[p] ("' + targ[p] + '") has keys!: type.obj = ' + cTypeof(keys,['obj']).obj + ' length = ' + keys.length + ' val = ' + keys);
						} catch (ex) {
							Cu.reportError('XPCWrappedNative_NoHelper || Object --> ex when keys of targ[p] ("' + targ + '[' + p + ']"): ' + ex);
						}
						if (cDepth < opts.depth) {
							if (keys && keys.length) {
								dug = dig(targ[p], cDepth + 1);
							}
						}
						
						json.push(
							['tr', {}, 
								['td', {},
									p
								],
								['td', {},
									dug
								]
							]	//key value pair
						);
						//Cu.reportError('pushed - ' + p);
						//Cu.reportError('its dug = ' + dug);
						
						if (keys && keys.length && cDepth == opts.depth) {
							json[json.length-1][3].push(
								['span', {title:'Depth Reached - Click to go one level deeper', 'class': 'max-depth'},
									'[+]'
								]
							);
						}
					}
					
					break;
				default:
					var dug;
					try {
						dug = targ;
					} catch (ex) {
						dug = ex; //dont need to worry that it will find keys on this, because obviously going targ is throwing error so when it does Object.keys(TARG) it will throw
					}
					try {
						var keys = undefined;
						keys = Object.keys(targ); //note: ES5 feature //dont use Object.keys(dug) here because if dug is an ex it will explore that
						Cu.reportError('default: targ ("' + targ + '") has keys!: type.obj = ' + cTypeof(keys,['obj']).obj + ' length = ' + keys.length + ' val = ' + keys);
					} catch (ex) {
						Cu.reportError('default: ex when keys of targ ("' + targ + '"): ' + ex);
					}
					if (cDepth < opts.depth) {
						if (keys && keys.length) {
							dug = dig(targ, cDepth + 1);
						}
					}
					/* json.push(
						['span', {class:'default'},
							dug
						]
					); */
						json.push(
							['tr', {}, 
								['td', {},
									dug
								]
							]	//key value pair
						);
					//355a 021614 im thinking if its in this section its not an object so how can it have keys? so it cant be going deeper
					if (keys && keys.length && cDepth == opts.depth) {
						json[json.length-1][2].push(
							['span', {title:'Depth Reached - Click to go one level deeper', 'class': 'max-depth'},
								'[+]'
							]
						);
					}
			}
		return json;
	};

    var newTabBrowser = cWin.gBrowser.getBrowserForTab(cWin.gBrowser.loadOneTab('about:blank', {inBackground:opts.inbg}));
    newTabBrowser.addEventListener('load', onloadFunc, true);
	
	/*
	//changing so its data uri so html persists after restart
	var head = '';
    var body = '';
	body += table.outerHTML;
	
	if (opts.t) {
		head += '<title>' + opts.t + '</title>';
	}
	var htmlDataUri = 'data:text/html,' + encodeURIComponent('<head>' + head + '</head>' + '<body>' + body + '</body>');
	*/

}

//from mdn
function jsonToDOM(xml, doc, nodes) {
    function namespace(name) {
        var m = /^(?:(.*):)?(.*)$/.exec(name);        
        return [jsonToDOM.namespaces[m[1]], m[2]];
    }

    function tag(name, attr) {
        if (Array.isArray(name)) {
            var frag = doc.createDocumentFragment();
            Array.forEach(arguments, function (arg) {
                if (!Array.isArray(arg[0]))
                    frag.appendChild(tag.apply(null, arg));
                else
                    arg.forEach(function (arg) {
                        frag.appendChild(tag.apply(null, arg));
                    });
            });
            return frag;
        }

        var args = Array.slice(arguments, 2);
        var vals = namespace(name);
		//Cu.reportError('vals[0] = "' + vals[0] + '"');
		//Cu.reportError('vals[1] = "' + vals[1] + '"');
        var elem = doc.createElementNS(vals[0] || jsonToDOM.defaultNamespace, vals[1]);

        for (var key in attr) {
            var val = attr[key];
            if (nodes && key == "key")
                nodes[val] = elem;

            vals = namespace(key);
            if (typeof val == "function")
                elem.addEventListener(key.replace(/^on/, ""), val, false);
            else
                elem.setAttributeNS(vals[0] || "", vals[1], val);
        }
        args.forEach(function(e) {
			//Cu.reportError('e == ' + e);
			//Cu.reportError('typeof == ' + cTypeof(e));
			//Cu.reportError('e instanceof doc.defaultView.Node == ' + (e instanceof doc.defaultView.Node));
			try {
				elem.appendChild(cTypeof(e, ['obj']).obj == 'Array' ?
									tag.apply(null, e) :
									e instanceof doc.defaultView.Node ? //note: for this line to work when dumping xpcom stuff, must pass in cWin.document as 2nd arg of jsonToDOM
									e :
									doc.createTextNode(e)
								);
			} catch (ex) {
				elem.appendChild(doc.createTextNode(ex));
			}
        });
        return elem;
    }
    return tag.apply(null, xml);
}
jsonToDOM.namespaces = {
    html: "http://www.w3.org/1999/xhtml",
    xul: "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
};
jsonToDOM.defaultNamespace = jsonToDOM.namespaces.html;
//end from mdn

function cTypeof(o, returnMethod) {
	//returnMethod is array of methods you want returned
	if (!returnMethod || (returnMethod.length !== undefined && returnMethod.length == 0)) {
		returnMethod = ['typeof', 'obj', 'objS', 'func', 'funcS', 'nodeS'];
	}
	var method = {};
	var methodRetVals = {};
	method.obj = function () {
		if (!('obj' in methodRetVals)) {
			try {
				methodRetVals.obj = Object.prototype.toString.call(o);
			} catch (ex) {
				methodRetVals.obj = ex;
			}
		}
		return methodRetVals.obj;
	}
	method.func = function () {
		if (!('func' in methodRetVals)) {
			try {
				methodRetVals.func = Function.prototype.toString.call((o).constructor);
			} catch (ex) {
				methodRetVals.func = ex;
			}
		}
		return methodRetVals.func;
	}
	method.objS = function () { //obj string
		if (!('obj' in methodRetVals)) {
			method.obj();
		}
		try {
			methodRetVals.objS = methodRetVals.obj.substring(8, methodRetVals.obj.length - 1);
		} catch (ex) {
			methodRetVals.objS = ex;
		}
		return methodRetVals.objS;
	}
	method.funcS = function () { //func string
		if (!('func' in methodRetVals)) {
			method.func();
		}
		try {
			methodRetVals.funcS = methodRetVals.func.substring(9, methodRetVals.func.indexOf('()'));
		} catch (ex) {
			methodRetVals.funcS = ex;
		}
		return methodRetVals.funcS;
	}/*
	method.node = function () { //obj string
        var nodeType = o.nodeType;
        if (nodeType !== undefined && nodeType !== null) {
            methodRetVals.node = nodeType;
        } else {
            methodRetVals.node = 0;
        }
		return nodeType;
	}
	method.nodeS = function () { //obj string
        var nodeName = o.nodeName;
        if (nodeName !== undefined && nodeName !== null) {
            methodRetVals.nodeS = nodeName;
        } else {
            methodRetVals.nodeS = 0;
        }
		return nodeName;
	}
    */
	method.nodeS = function () { //node string
        try {
            var nodeType = o.nodeType;
            if (nodeType !== undefined && nodeType !== null) {
                methodRetVals.nodeS = 'Node';
            } else {
                methodRetVals.nodeS = 0;
            }
        } catch (ex) {
            methodRetVals.nodeS = ex;
        }
		return nodeType;
	}
    method.typeof = function() {
        try {
           methodRetVals.typeof = typeof o; 
        } catch (ex) {
           methodRetVals.typeof = ex;
        }
        return methodRetVals.typeof;
    }
    var retVal = {};
    [].forEach.call(returnMethod, function(m) {
        if (m in method) {
          //retVal[m] = method[m](); //so must return values in funcs above 
		  retVal[m] = method['typeof'](); //so must return values in funcs above 
		  if (retVal[m] == 'object') {
			if (o instanceof Array) {
				retVal[m] = 'Array';
			} else if (o === null) {
				retVal[m] = 'Null';
			} else {
				retVal[m] = 'Object';
			}
		  } else {
			retVal[m] = retVal[m][0].toUpperCase() + retVal[m].substr(1);
		  }
        } else {
            retVal[m] = 'METHOD_UNDEFINED';
        }
    });
	return retVal;
}
