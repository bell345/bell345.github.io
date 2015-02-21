// A JS-based loader that executes onload tasks and then triggers a 
// "pageload" event to synchronise XHR loaded resources and other
// async requirements.
// jQuery required.

if (!window.jQuery) {
    throw new Error("[tblib/loader.js] jQuery has not been loaded");
} else if (!window.TBI) {
    throw new Error("[tblib/loader.js] base.js has not been loaded");
} else if (!window.TBI.Util) {
    throw new Error("[tblib/loader.js] util.js has not been loaded");
} else {

if (!window.globalStartTime) var globalStartTime = new Date().getTime();

TBI.Loader = function () {
    this.loaderInterval = 20;
    this.loadingScreenTimeout = 6000;
    this.defaultTimeout = 20000;
    this.emergencyTimeout = 80000;
    
    this.terminate = false;
    
    this.log = [];
    this.tasks = [];
    this.getTaskById = function (id) {
        for (var i=0;i<this.tasks.length;i++) 
            if (this.tasks[i].id == id) return this.tasks[i];
        return null;
    }

    var LogEntry = function (message) {
        this.time = new Date().getTime() - globalStartTime;
        this.message = message;
        this.print = function () {
            return "["
                + this.time
                + "ms] "
                + this.message
        };
    };
    
    var LoaderTask = function (loader) { 
        return function (id, func, timeout, depends, conditions) {
            this.id = isNull(id) ? generateUUID() : id;
            this.func = func || function (resolve, reject) { resolve(); };
            this.timeout = timeout || loader.defaultTimeout;
            this.depends = depends || [];
            this.conditions = conditions || [];
            
            this.inProgress = false;
            this.completed = false;
            this.successful = false;
            this.promise = null;
            
            this.execute = function () {
                for (var i=0;i<this.depends.length;i++) {
                    var task = loader.getTaskById(this.depends[i]);
                    if (!isNull(task) && !task.completed) return;
                }
                
                for (var i=0;i<this.conditions.length;i++)
                    if (!this.conditions[i]()) return;
                
                this.promise = new Promise(function (task, loader) { 
                    return function (resolve, reject) {
                        task.func(resolve, reject);
                        task.inProgress = true;
                        loader.milestone("Executed "+task.id);
                        
                        setTimeout(function (reject) {
                            reject("timeout");
                        }, task.timeout, reject);
                    } 
                }(this, loader)).then(function (task, loader) { 
                    return function () {
                        task.completed = true;
                        task.successful = true;
                        loader.milestone(task.id+" completed successfully");
                    } 
                }(this, loader)).catch(function (task, loader) {
                    return function (error) {
                        task.completed = true;
                        task.successful = false;
                        var reason = "timeout";
                        if (error instanceof Error) {
                            reason = error.message;
                        } else reason = reason;
                        loader.milestone(task.id+" completed unsuccessfully due to: "+reason);
                    }
                }(this, loader));
            }
        } 
    }(this);

    this.milestone = function (message, isImportant) {
        var entry = new LogEntry(message);
        this.log.push(new LogEntry(message));
        if (isImportant) console.log(entry.print());
    };
    
    this.loop = function () {
        var allDone = true;
        for (var i=0;i<this.tasks.length;i++) {
            if (!this.tasks[i].completed) {
                if (!this.tasks[i].inProgress) 
                    this.tasks[i].execute();
                allDone = false;
            }
        }
        
        if (allDone) $(document).trigger("pageload");
        else if (this.terimate) {
            this.milestone("Loader terminated prematurely");
            $(document).trigger("pageload");
        } else setTimeout(function (loader) { 
            return function () { loader.loop(); }; 
        }, this.loaderInterval, this);
    }
    
    setTimeout(function (loader) {
        return function () { loader.loop(); }
    }, this.loaderInterval, this);
    
    setTimeout(function () { 
        $("body").toggleClass("loading", true);
    }, this.loadingScreenTimeout);
    
    setTimeout(function (loader) {
        return function () { loader.terminate = true; };
    }, this.emergencyTimeout, this);
};

$(function () {
    var loader = new TBI.Loader();
    loader.milestone("Ready", true);
});

}
