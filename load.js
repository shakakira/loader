(function(window) {

    var document = window.document;
    var head = document.head || document.getElementsByTagName('head')[0];
    var moduleClass = 'S' + new Date()*1;
    var W3C = document.dispatchEvent;
    var modules = {};
    var uid = 0;

    var STATE = {
        LOADING : 0,
        LOADED : 1,
        EXECUTED : 2
    }

    function getUid(){
        return uid++;
    }

    function log(str){
        console && console.log(str)
    }

    function loadJS(url,callback){
        var node = document.createElement("script");
        node.className = moduleClass; //��getCurrentScriptֻ��������ΪmoduleClass��script�ڵ�
        node[W3C ? "onload" : "onreadystatechange"] = function() {
            if (W3C || /loaded|complete/i.test(node.readyState)) {
                callback && callback();
            }
        };
        node.onerror = function() {
            log('load err:', url);
        };
        node.src = url; 
        head.insertBefore(node, head.firstChild);
    }

    function loadCSS(url){
        var node = document.createElement("link");
        node.rel = "stylesheet";
        node.href = url;
        head.insertBefore(node, head.firstChild);
    }

    function load(url,parent,ext){
        var src = url.replace(/[?#].*/, "");
        if (/\.(css|js)$/.test(src)) {
            ext = RegExp.$1;
        }
        if (!ext) { //���û�к�׺��,���Ϻ�׺��
            src += ".js";
            ext = "js";
        }
        if (ext === "js") {
            if (!modules[url]) { //���֮ǰû�м��ع� ***url����Ҫ�ڴ�����***
                modules[url] = {
                    id: url,
                    state:STATE.LOADING,
                    parents:[],
                    exports: {}
                };
                loadJS(src);
            }
            modules[url].parents.push(parent); //***������Ҫȥ��***
            return url;
        } else {
            loadCSS(src);
        }
    }

    function getCurrentScript() {
        // �ο� https://github.com/samyk/jiagra/blob/master/jiagra.js
        var stack,sourceURL;
        try {
            a.b.c(); //ǿ�Ʊ���,�Ա㲶��e.stack
        } catch (e) { //safari�Ĵ������ֻ��line,sourceId,sourceURL
            stack = e.stack;
            sourceURL = e.sourceURL;
        }
        if (stack) {//��׼�����(IE10��Chrome��Opera��Firefox)
            stack = stack.split(/[@ ]/g).pop(); //ȡ�����һ��,���һ���ո��@֮��Ĳ���
            stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, ""); //ȥ�����з�
            return stack.replace(/(:\d+)?:\d+$/i, ""); //ȥ���к���������ڵĳ����ַ���ʼλ��
        }
        if(sourceURL){//���Safari
            return sourceURL;
        }
        // IE6-9
        var nodes = head.getElementsByTagName("script"); //ֻ��head��ǩ��Ѱ��
        for (var i = nodes.length, node; node = nodes[--i]; ) {
            if (node.readyState === "interactive") {//node.className === moduleClass && 
                return node.src;
            }
        }
    }

    var fireFactory = function(id, factory){
        var mod = modules[id];
        if(mod.deps){
            var args = [];
            for (var i = 0; i < mod.deps.length; i++) {
                args.push(modules[mod.deps[i]].exports);
            };
        }
        var ret = factory.apply(mod.exports,args);
        if(ret){
            mod.exports = ret;
        }
        mod.state = STATE.EXECUTED;
        if(mod.parents){
            for (var i = 0 , len = mod.parents.length ; i < len; i++) {
                var pid = mod.parents[i];
                require(modules[pid].deps,modules[pid].factory,pid);
            };
        }
    }

    var require = function(deps, factory, parent){
        var id = parent || 'callback' + getUid();
        var ni = 0,
            ci = 0;

        if(typeof deps === "string"){
            deps = deps.split(",");
        }

        for (var i = 0, len = deps.length ; i < len; i++) {
            var url = load(deps[i],id);
            if(url){
                ni++;
                if (modules[url] && modules[url].state === STATE.EXECUTED) {
                    ci++;
                }
            }
        };

        modules[id] = modules[id] || { id : id, deps : deps , factory : factory };
        
        if (ni === ci) {
            fireFactory(id , factory); 
        }
    }

    var define = function(id, deps, factory){
        if(arguments.length === 1){
            factory = id;
            id = getCurrentScript();
        }
        if(arguments.length === 2){
            if(typeof id === "string"){
                id = id;
                factory = deps;
                deps = null;
            }
            if(typeof id === "array"){
                factory = deps;
                deps = id;
                id = getCurrentScript();
            }
        }
        modules[id].deps = deps;
        modules[id].factory = factory;
        modules[id].state = STATE.LOADED;

        if(deps && deps.length){
            require(deps,factory,id);
        }else{
           fireFactory(id,factory);
        }
    }

    window.require = require;
    window.define = define;

})(window);